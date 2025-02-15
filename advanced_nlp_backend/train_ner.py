import torch
import torch.nn as nn
import torch.optim as optim
import os
import random

from bpe_tokenizer import BPETokenizer
from model_ner import NERTagger

def train_ner(tokenizer, ner_model, ner_corpus_path, device, epochs=3, batch_size=4, seq_len=64):
   
   #Entraîne un modèle de NER. On suppose que ner_corpus_path contient des lignes du type :
    #token1 label1 token2 label2 etc où le label est dans {0=O, 1=B-COMP, 2=I-COMP}.
    # S'assurer que le modèle est sur le bon device
    ner_model = ner_model.to(device)
    
    dataset = []
    
    with open(ner_corpus_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        
        tokens, labels = [], []
        i = 0
        while i < len(parts) - 1:
            t = parts[i]
            l = parts[i+1]
            i += 2
            tokens.append(t)
            labels.append(int(l))
        
        # Tokenisation -> liste d'ids
        ids = tokenizer.tokenize(" ".join(tokens))
        
        # Tronquer/padder la séquence d’ids
        if len(ids) > seq_len:
            ids = ids[:seq_len]
        if len(ids) < seq_len:
            ids += [tokenizer.pad_token_id] * (seq_len - len(ids))

        # Tronquer/padder la séquence de labels
        if len(labels) > seq_len:
            labels = labels[:seq_len]
        if len(labels) < seq_len:
            labels += [0] * (seq_len - len(labels))  # 0 = label 'O' pour le padding
        
        dataset.append((ids, labels))

    def batchify(lst, bs):
        for i in range(0, len(lst), bs):
            yield lst[i:i+bs]

    optimizer = optim.Adam(ner_model.parameters(), lr=1e-4)
    loss_fn = nn.CrossEntropyLoss()

    ner_model.train()
    best_loss = float('inf')
    for epoch in range(epochs):
        random.shuffle(dataset)
        total_loss = 0
        nb_batches = 0

        for batch in batchify(dataset, batch_size):
            seqs = [b[0] for b in batch]   # liste de ids
            labs = [b[1] for b in batch]   # liste de labels

            seq_tensor = torch.tensor(seqs, dtype=torch.long, device=device)
            lab_tensor = torch.tensor(labs, dtype=torch.long, device=device)

            optimizer.zero_grad()

            # Forward
            logits = ner_model(seq_tensor)  # (batch, seq_len, num_labels)

            # Calcul de la perte
            loss = loss_fn(logits.view(-1, 3), lab_tensor.view(-1))

            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            nb_batches += 1

        avg_loss = total_loss / nb_batches
        print(f"[NER training] Epoch {epoch+1}, Loss={avg_loss:.4f}")
        
        # Sauvegarder le meilleur modèle
        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(ner_model.state_dict(), 'ner_model.pth')
            print(f"Nouveau meilleur modèle sauvegardé (loss: {best_loss:.4f})")

    print("NER training finished.")