import torch
import torch.nn as nn

class NERTagger(nn.Module):
    def __init__(self, vocab_size, hidden_dim=256, num_labels=3):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, hidden_dim)
        self.lstm = nn.LSTM(hidden_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.classifier = nn.Linear(hidden_dim*2, num_labels)  # O, B-COMP, I-COMP

    def forward(self, x):
        emb = self.embedding(x)  # batch, seq len, hidden dim
        out, _ = self.lstm(emb)
        logits = self.classifier(out)  # batch, seq_len, num_labels
        return logits






