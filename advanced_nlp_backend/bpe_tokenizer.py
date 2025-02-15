import re
import json
from collections import Counter, defaultdict

class BPETokenizer:
    def __init__(self, vocab_size=3000):
        self.vocab_size = vocab_size
        self.tokens2id = {}
        self.id2tokens = []
        self.bpe_codes = {}
        self.bpe_codes_reverse = {}
        self.word_freqs = Counter()
        self.fitted = False
        
        # Tokens spéciaux
        self.pad_token_id = 0
        self.unk_token_id = 1
        self.cls_token_id = 2
        self.sep_token_id = 3
        self.mask_token_id = 4
        
        # on init  les tokens spéciaux
        self.tokens2id.update({
            "<PAD>": self.pad_token_id,
            "<UNK>": self.unk_token_id,
            "<CLS>": self.cls_token_id,
            "<SEP>": self.sep_token_id,
            "<MASK>": self.mask_token_id
        })
        self.id2tokens = ["<PAD>", "<UNK>", "<CLS>", "<SEP>", "<MASK>"]

    def load_corpus(self, filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
        # On découpe en mots
        words = re.findall(r"[\w']+", text.lower())
        return words

    def build_vocab(self, corpus_path, additional_words=None):
        """
        Construire le vocabulaire à partir d'un fichier corpus.
        
        :param corpus_path: Chemin du fichier corpus
        :param additional_words: Liste de mots techniques à ajouter
        """
        # Mots techniques par défaut
        default_tech_words = [
            "pentest", "docker", "spark", 
            "kubernetes", "tensorflow", "pytorch", 
            "mlops", "devops", "cybersecurity"
        ]
        
        # Combiner les mots additionnels avec les mots par défaut
        if additional_words is None:
            additional_words = []
        additional_words.extend(default_tech_words)
        
        # Ajouter les mots techniques au corpus
        with open(corpus_path, 'a', encoding='utf-8') as f:
            for word in additional_words:
                f.write(f"\n{word}")
        
        # Reste de l'implémentation inchangée
        with open(corpus_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # On découpe en mots
        words = re.findall(r"[\w']+", text.lower())
        
        # Fréquence de chaque mot
        for w in words:
            self.word_freqs[w] += 1

        # Table initiale : chaque caractère est un token
        vocab = set()
        for w in self.word_freqs:
            for char in w:
                vocab.add(char)

        # Ajout des caractères au vocabulaire
        for char in sorted(vocab):
            if char not in self.tokens2id:
                self.tokens2id[char] = len(self.tokens2id)
                self.id2tokens.append(char)

        # Effectuer des merges successives
        for i in range(self.vocab_size):
            pairs_count = self._count_pairs()
            if not pairs_count:
                break

            best_pair = max(pairs_count.items(), key=lambda x: x[1])[0]
            self.bpe_codes[best_pair] = i
            self.bpe_codes_reverse[i] = best_pair

            # Mettre à jour le vocabulaire
            new_token = ''.join(best_pair)
            if new_token not in self.tokens2id:
                token_id = len(self.tokens2id)
                self.tokens2id[new_token] = token_id
                self.id2tokens.append(new_token)

        self.fitted = True

    def _count_pairs(self):
        pairs = defaultdict(int)
        for word, freq in self.word_freqs.items():
            chars = list(word)
            for i in range(len(chars)-1):
                pair = (chars[i], chars[i+1])
                pairs[pair] += freq
        return pairs

    def tokenize(self, text, max_len=None):
        """Tokenize text into ids."""
        # Nettoyage basique
        text = text.lower().strip()
        words = re.findall(r"[\w']+", text)
        
        #Conversion en tokens
        tokens = []
        for word in words:
            if word in self.tokens2id:
                tokens.append(self.tokens2id[word])
            else:
                # Fallback sur les caractères individuels
                for char in word:
                    tokens.append(self.tokens2id.get(char, self.unk_token_id))
        
        # Ajout des tokens spéciaux
        tokens = [self.cls_token_id] + tokens + [self.sep_token_id]
        
        # Tronquer si nécessaire
        if max_len is not None:
            tokens = tokens[:max_len]
            
        return tokens

    def encode_plus(self, text, add_special_tokens=True, max_length=None, padding='max_length', truncation=True, return_attention_mask=True):
        # Tokenization de base
        tokens = self.tokenize(text)
        
        if add_special_tokens and tokens[0] != self.cls_token_id:
            tokens = [self.cls_token_id] + tokens
        if add_special_tokens and tokens[-1] != self.sep_token_id:
            tokens = tokens + [self.sep_token_id]
            
        # Tronquer
        if truncation and max_length is not None:
            tokens = tokens[:max_length]
            
        # Padding
        attention_mask = [1] * len(tokens)
        if padding == 'max_length' and max_length is not None:
            padding_length = max_length - len(tokens)
            if padding_length > 0:
                tokens = tokens + [self.pad_token_id] * padding_length
                attention_mask = attention_mask + [0] * padding_length
                
        result = {
            'input_ids': tokens,
            'attention_mask': attention_mask if return_attention_mask else None
        }
        
        return result

    def save(self, path):
        #save le tokenizer
        # Convertir les tuples en strings pour la sérialisation JSON
        bpe_codes_json = {}
        for k, v in self.bpe_codes.items():
            if isinstance(k, tuple):
                k = '|'.join(k)
            bpe_codes_json[k] = v

        with open(path, 'w', encoding='utf-8') as f:
            json.dump({
                'vocab_size': self.vocab_size,
                'tokens2id': self.tokens2id,
                'id2tokens': self.id2tokens,
                'bpe_codes': bpe_codes_json,
                'word_freqs': dict(self.word_freqs),
                'fitted': self.fitted
            }, f, ensure_ascii=False, indent=2)
    
    @classmethod
    def load(cls, path):
        #laod un tokenizer sauvegardé."""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        tokenizer = cls(vocab_size=data['vocab_size'])
        
        # on réinitializ les tokens2id avec les tokens spéciaux
        tokenizer.tokens2id = {
            "<PAD>": tokenizer.pad_token_id,
            "<UNK>": tokenizer.unk_token_id,
            "<CLS>": tokenizer.cls_token_id,
            "<SEP>": tokenizer.sep_token_id,
            "<MASK>": tokenizer.mask_token_id
        }
        tokenizer.id2tokens = ["<PAD>", "<UNK>", "<CLS>", "<SEP>", "<MASK>"]
        
        # add le reste des tokens
        for token, idx in data['tokens2id'].items():
            if token not in tokenizer.tokens2id:  # Ne pas écraser les tokens spéciaux
                tokenizer.tokens2id[token] = idx
                # poursassurer que id2tokens est assez grand
                while len(tokenizer.id2tokens) <= idx:
                    tokenizer.id2tokens.append("")
                tokenizer.id2tokens[idx] = token
        
        # Reconvertir les strings en tuples pour les codes BPE
        bpe_codes = {}
        for k, v in data['bpe_codes'].items():
            if '|' in k:
                k = tuple(k.split('|'))
            bpe_codes[k] = v
        tokenizer.bpe_codes = bpe_codes
        
        tokenizer.word_freqs = Counter(data['word_freqs'])
        tokenizer.fitted = data['fitted']
        
        return tokenizer

    def test_technical_tokens(self):
        """
        je test icila tokenisation de mots techniques.
        """
        test_words = [
            "pentest", "docker", "spark", 
            "kubernetes", "tensorflow", "pytorch", 
            "mlops", "devops", "cybersecurity"
        ]
        
        print("=== Test de tokenisation des mots techniques ===")
        for word in test_words:
            tokens = self.tokenize(word)
            print(f"{word}: {tokens}")
            
            # check si le mot est bientokenizé
            is_unk = all(token == self.unk_token_id for token in tokens)
            print(f"Est-ce un token <UNK> ? {is_unk}\n")
        
        return self
