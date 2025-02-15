import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]

class AdvancedTransformer(nn.Module):
    def __init__(self, vocab_size, num_classes=4, d_model=256, nhead=8, num_encoder_layers=2,
                 dim_feedforward=1024, dropout=0.1):
        super().__init__()
        
        # ici il y a les Embedding et positional encoding
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model)
        
        # on a là l'Encoder transformer
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True  
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_encoder_layers)
        
        # Têtes de sortie pour différentes tâches
        self.mlm_head = nn.Linear(d_model, vocab_size)
        self.classif_head = nn.Linear(d_model, num_classes)  # Classification des domaines
        
        self.d_model = d_model
        self.init_weights()
    
    def init_weights(self):
        initrange = 0.1
        self.embedding.weight.data.uniform_(-initrange, initrange)
        self.mlm_head.bias.data.zero_()
        self.mlm_head.weight.data.uniform_(-initrange, initrange)
        self.classif_head.bias.data.zero_()
        self.classif_head.weight.data.uniform_(-initrange, initrange)
    
    def forward(self, src, task='mlm', attention_mask=None):
        # Embedding et positional encoding
        src_emb = self.embedding(src) * math.sqrt(self.d_model)
        src_emb = self.pos_encoder(src_emb)
        
        # Si un masque d'attention est fourni, ladapter pour le transformer
        if attention_mask is not None:
            # jinverse le masque car TransformerEncoder attend True pour les tokens à masquer
            attention_mask = ~attention_mask
        
        # Passage dans l'encoder
        memory = self.encoder(src_emb, src_key_padding_mask=attention_mask)
        
        # Tête de sortie selon la tâche
        if task == 'mlm':
            return self.mlm_head(memory)
        elif task == 'classification':
            # Pooling sur la séquence
            pooled = torch.mean(memory, dim=1)
            return self.classif_head(pooled)
        else:
            raise ValueError(f"Tâche inconnue: {task}")