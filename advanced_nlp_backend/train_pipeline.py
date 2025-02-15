import torch
import torch.nn as nn
import torch.optim as optim
import os
import random
from tqdm import tqdm
import math
from torch.optim.lr_scheduler import LambdaLR
from torch.utils.data import DataLoader
import torch.nn.functional as F

from bpe_tokenizer import BPETokenizer
from model import AdvancedTransformer

class WarmupLinearSchedule(LambdaLR):
    def __init__(self, optimizer, warmup_steps, t_total, min_ratio=0.0, last_epoch=-1):
        self.warmup_steps = warmup_steps
        self.t_total = t_total
        self.min_ratio = min_ratio
        super(WarmupLinearSchedule, self).__init__(optimizer, self.lr_lambda, last_epoch=last_epoch)
    
    def lr_lambda(self, step):
        if step < self.warmup_steps:
            return float(step) / float(max(1, self.warmup_steps))
        return max(self.min_ratio, float(self.t_total - step) / float(max(1.0, self.t_total - self.warmup_steps)))

def mask_tokens(inputs, mask_token_id, vocab_size, mlm_probability=0.15):
    device = inputs.device
    labels = inputs.clone()
    
    # Masquer 15% des tokens
    probability_matrix = torch.full(labels.shape, mlm_probability, device=device)
    masked_indices = torch.bernoulli(probability_matrix).bool()
    labels[~masked_indices] = -100  # ignorer la perte
    
    # 80% => <MASK>
    indices_replaced = torch.bernoulli(torch.full(labels.shape, 0.8, device=device)).bool() & masked_indices
    inputs[indices_replaced] = mask_token_id
    
    # 10% => token random
    indices_random = torch.bernoulli(torch.full(labels.shape, 0.1, device=device)).bool() & masked_indices & ~indices_replaced
    random_tokens = torch.randint(vocab_size, labels.shape, dtype=torch.long, device=device)
    inputs[indices_random] = random_tokens[indices_random]
    
    return inputs, labels

def pretrain_mlm(tokenizer, model, corpus_path, device, epochs=8, batch_size=32, seq_len=256, accumulation_steps=4):
    print("Démarrage du pré-entraînement MLM...")
    
    # Chargement et préparation des données
    with open(corpus_path, 'r', encoding='utf-8') as f:
        corpus = f.read().split('\n')
    
    # Tokenization du corpus
    tokenized_corpus = []
    for text in corpus:
        if text.strip():  # Ignorer les lignes vides
            tokens = tokenizer.tokenize(text)
            if len(tokens) > 2:  # Au moins 3 tokens pour que ça ait du sens
                tokenized_corpus.append(tokens)
    
    # Paramètres d'entraînement
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)
    criterion = nn.CrossEntropyLoss(ignore_index=-100)
    
    model.train()
    
    # Boucle d'entraînement
    for epoch in range(epochs):
        print(f"Epoch {epoch+1}/{epochs}:", end=' ')
        total_loss = 0
        batch_count = len(tokenized_corpus) // batch_size
        
        progress_bar = tqdm(range(batch_count), desc=f"Epoch {epoch+1}/{epochs}")
        
        for batch_idx in progress_bar:
            # Préparer le batch
            batch_start = batch_idx * batch_size
            batch_end = min((batch_idx + 1) * batch_size, len(tokenized_corpus))
            batch_texts = tokenized_corpus[batch_start:batch_end]
            
            # Padding des séquences
            padded_batch = []
            attention_mask = []
            for tokens in batch_texts:
                if len(tokens) > seq_len:
                    tokens = tokens[:seq_len]
                else:
                    tokens = tokens + ["<PAD>"] * (seq_len - len(tokens))
                padded_batch.append([tokenizer.tokens2id.get(t, tokenizer.unk_token_id) for t in tokens])
                attention_mask.append([1] * min(len(tokens), seq_len) + [0] * max(0, seq_len - len(tokens)))
            
            # Conversion en tensors
            inputs = torch.tensor(padded_batch, dtype=torch.long, device=device)
            attention_mask = torch.tensor(attention_mask, dtype=torch.bool, device=device)
            
            # Masquage MLM
            inputs, labels = mask_tokens(inputs, tokenizer.mask_token_id, len(tokenizer.tokens2id))
            
            # Forward pass
            outputs = model(inputs, task='mlm', attention_mask=attention_mask)
            
            # Calcul de la perte
            loss = criterion(outputs.view(-1, outputs.size(-1)), labels.view(-1))
            loss = loss / accumulation_steps
            
            # Backward pass
            loss.backward()
            
            # Mise à jour des poids tous les accumulation_steps
            if (batch_idx + 1) % accumulation_steps == 0:
                optimizer.step()
                optimizer.zero_grad()
            
            total_loss += loss.item() * accumulation_steps
            
            # Mise à jour de la barre de progression
            progress_bar.set_postfix({'loss': f"{total_loss/(batch_idx+1):.4f}"})
        
        avg_loss = total_loss / batch_count
        print(f"Loss: {avg_loss:.4f}")
        
        # Sauvegarder le modèle
        if (epoch + 1) % 5 == 0:
            torch.save(model.state_dict(), f"model_mlm_epoch_{epoch+1}.pth")
            
def finetune_classif(tokenizer, model, labeled_cvs_folder, device, epochs=20, batch_size=8, seq_len=512):
    print("Démarrage du fine-tuning classification...")
    
    # Chargement des données
    data = []
    labels = []
    
    # Parcourir les dossiers (un par classe)
    for class_idx, class_name in enumerate(['data', 'cyber', 'software', 'other']):
        class_dir = os.path.join(labeled_cvs_folder, class_name)
        if not os.path.exists(class_dir):
            continue
            
        # Parcourir les fichiers CV
        for cv_file in os.listdir(class_dir):
            if cv_file.endswith('.txt'):
                with open(os.path.join(class_dir, cv_file), 'r', encoding='utf-8') as f:
                    cv_text = f.read()
                data.append(cv_text)
                labels.append(class_idx)
    
    # Préparation des données
    dataset = list(zip(data, labels))
    
    # Paramètres d'entraînement
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    criterion = nn.CrossEntropyLoss()
    best_loss = float('inf')
    
    model.train()
    
    # Boucle d'entraînement
    for epoch in range(epochs):
        print(f"Epoch {epoch+1}/{epochs}:", end=' ')
        total_loss = 0
        random.shuffle(dataset)
        
        # Traitement par batch
        for i in range(0, len(dataset), batch_size):
            batch_data = dataset[i:i+batch_size]
            texts, batch_labels = zip(*batch_data)
            
            # Tokenization et padding
            tokenized = []
            attention_mask = []
            for text in texts:
                tokens = tokenizer.tokenize(text)
                if len(tokens) > seq_len:
                    tokens = tokens[:seq_len]
                else:
                    tokens = tokens + ["<PAD>"] * (seq_len - len(tokens))
                tokenized.append([tokenizer.tokens2id.get(t, tokenizer.unk_token_id) for t in tokens])
                attention_mask.append([1] * min(len(tokens), seq_len) + [0] * max(0, seq_len - len(tokens)))
            
            # Conversion en tensors
            inputs = torch.tensor(tokenized, dtype=torch.long, device=device)
            attention_mask = torch.tensor(attention_mask, dtype=torch.bool, device=device)
            labels = torch.tensor(batch_labels, dtype=torch.long, device=device)
            
            # Forward pass
            outputs = model(inputs, task='classification', attention_mask=attention_mask)
            
            # Calcul de la perte
            loss = criterion(outputs, labels)
            
            # Backward pass et optimisation
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        avg_loss = total_loss * batch_size / len(dataset)
        print(f"Loss: {avg_loss:.4f}")
        
        # Sauvegarder le meilleur modèle
        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(model.state_dict(), "best_model.pth")
            print(f"Nouveau meilleur modèle sauvegardé (loss: {best_loss:.4f})")
            
        # Early stopping si la perte est très basse
        if avg_loss < 0.01:
            print("Loss suffisamment basse, arrêt de l'entraînement")
            break

def run_training_pipeline():
    print("Lancement du pipeline d'entraînement...")
    
    CORPUS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'corpus_tech.txt')
    tokenizer = BPETokenizer()
    
    # Construction du tokenizer (forcée)
    print("Construction du tokenizer...")
    tokenizer.build_vocab(CORPUS_PATH)
    tokenizer.save('tokenizer.json')
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = AdvancedTransformer(
        vocab_size=len(tokenizer.tokens2id),
        d_model=256,
        nhead=8,
        num_encoder_layers=2,
        dim_feedforward=1024,
        dropout=0.1
    ).to(device)
    
    # Pre-training MLM
    print("Pré-entraînement MLM...")
    pretrain_mlm(tokenizer, model, CORPUS_PATH, device, epochs=10)
    
    # Fine-tuning classification
    print("Fine-tuning classification...")
    LABELED_CVS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'labeled_cvs')
    finetune_classif(tokenizer, model, LABELED_CVS_PATH, device, epochs=30)
    
    print("Sauvegarde du modèle...")
    torch.save(model.state_dict(), 'model_checkpoint.pth')
    
    print("Pipeline d'entraînement terminé avec succès!")

if __name__ == '__main__':
    run_training_pipeline()
