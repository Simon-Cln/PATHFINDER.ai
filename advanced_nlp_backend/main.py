import os
import json
import uuid
import base64
import logging
import re
import string
import tempfile
import time

import torch
import torch.nn.functional as F
import numpy as np

import fitz 
import docx2txt 

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Pour TF-IDF et cosine similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from rank_bm25 import BM25Okapi

# jimpoorte les modèles
from torch.serialization import add_safe_globals
from model import AdvancedTransformer
from model_ner import NERTagger
from bpe_tokenizer import BPETokenizer
from train_pipeline import run_training_pipeline
from train_ner import train_ner

# les logs
logging.basicConfig(level=logging.DEBUG,
                    format='[%(levelname)s] %(message)s')

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# pour check lextension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

MODEL_PATH = 'model_checkpoint.pth'
NER_PATH = 'ner_model.pth'
TOKENIZER_PATH = 'tokenizer.json'
INTERNSHIPS_FILE = 'data/data_internships.json'

# glob var
device = None
model = None
tokenizer = None
ner_model = None

def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

domain_descriptions = {
    'Data': (
        "Data science, machine learning, deep learning, analyse de données, big data, "
        "data analyst, data scientist, SQL, R, Python, statistiques, modélisation prédictive, "
        "visualisation de données, pandas, numpy, scikit-learn, intelligence artificielle, "
        "Spark, Hadoop, ETL, data mining, data cleaning, feature engineering, NLP, data visualization"
    ),
    'Cyber': (
        "Sécurité informatique, cyberdéfense, pentest, cryptographie, forensic, malware, "
        "menace, intrusion, OSCP, ethical hacking, firewall, détection d'intrusion, analyse de menaces"
    ),
    'Software': (
        "Développement logiciel, backend, frontend, Java, C++, JavaScript, DevOps, "
        "microservices, Docker, Kubernetes, cloud computing, CI/CD, programmation, architecture, développement web"
    ),
    'Other': (
        "Marketing, finance, commercial, RH, management, supply chain, droit, immobilier"
    )
}

STOP_WORDS = {
    'fr': set([
        'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'à', 'pour', 'dans', 'par',
        'avec', 'sur', 'au', 'aux', 'ce', 'ces', 'ne', 'pas', 'plus', 'ou', 'mais', 'donc'
    ])
}

SKILLS_LIST = {
    'Data': {"python", "sql", "pandas", "numpy", "scikit-learn", "machine learning", "data analysis", "statistiques", "spark", "hadoop", "etl"},
    'Cyber': {"cybersecurity", "pentest", "oscp", "ethical hacking", "firewall", "intrusion", "malware", "cryptographie"},
    'Software': {"java", "javascript", "react", "node.js", "devops", "docker", "kubernetes", "c++", "python", "programming"},
    'Other': set()
}

# bdd des stages chargée ici
try:
    with open(INTERNSHIPS_FILE, 'r', encoding='utf-8') as f:
        data_internships = json.load(f)
        internships_db = data_internships.get('jobs', [])
        logging.info(f"Loaded {len(internships_db)} internships.")
except Exception as e:
    logging.error(f"Erreur lors du chargement de la base d'offres: {e}")
    internships_db = []

# déserialisation des modèles
add_safe_globals([BPETokenizer, NERTagger, AdvancedTransformer])

#  Prétraitement du txt
def clean_text(text, language='fr'):
    """
    - Conversion en minuscules
    - Suppression de la ponctuation
    - Suppression des stop words
    - Normalisation des espaces multiples
    """
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = ' '.join(text.split())
    if language == 'fr':
        words = [w for w in text.split() if w not in STOP_WORDS['fr']]
        text = ' '.join(words)
    return text

def preprocess_cv_text(cv_text, max_length=5000):
    """
    - Nettoie le texte
    - Extrait les sections importantes
    - Limite la taille pour l'analyse
    """
    logging.debug(f"=== Preprocessing CV text (length: {len(cv_text)} chars) ===")
    text = clean_text(cv_text)
    logging.debug("Text after basic cleaning (first 200 chars):")
    logging.debug(text[:200] + "...")
    
    important_keywords = ['profil', 'skills', 'compétences', 'expérience', 'formation', 'projets', 
                         'data', 'python', 'machine learning', 'développement', 'software']
    paragraphs = [p.strip() for p in cv_text.split('\n') if p.strip()]
    priority_text = []
    other_text = []
    
    for paragraph in paragraphs:
        clean_para = clean_text(paragraph)
        if any(k in clean_para.lower() for k in important_keywords):
            priority_text.append(clean_para)
            logging.debug(f"Found important paragraph: {clean_para[:100]}...")
    
    final_text = ' '.join(priority_text)
    if len(final_text) < max_length:
        remaining_length = max_length - len(final_text)
        additional_text = ' '.join(other_text)[:remaining_length]
        final_text += ' ' + additional_text
    
    final_text = final_text[:max_length]
    logging.debug(f"=== Final preprocessed text (length: {len(final_text)} chars) ===")
    logging.debug("First 200 chars of preprocessed text:")
    logging.debug(final_text[:200] + "...")
    
    return final_text

def tfidf_similarity(text1, text2):
     #Calculate TF-IDF similarity between two texts using cosine similarity.
    logging.debug(f"Computing TF-IDF similarity between texts of lengths {len(text1)} and {len(text2)}")
    vectorizer = TfidfVectorizer(min_df=1, stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        feature_array = vectorizer.get_feature_names_out()
        tfidf_sorting = np.argsort(tfidf_matrix.toarray()).flatten()[::-1]
        logging.debug("Top 10 termes importants dans les textes:")
        n_top_words = 10
        for idx in tfidf_sorting[:n_top_words]:
            logging.debug(f"{feature_array[idx]} (score: {tfidf_matrix[0, idx]:.4f})")
        return float(similarity)
    except Exception as e:
        logging.error(f"Error in TF-IDF calculation: {e}")
        return 0.0

# on extrait les compétences ici
def extract_skills(text, domain):
    # en comparant avec la liste de compétences pour le domaine
    text_clean = clean_text(text)
    found_skills = set()
    for skill in SKILLS_LIST.get(domain, set()):
        if skill.lower() in text_clean:
            found_skills.add(skill.lower())
    return found_skills

def bm25_scores(query, documents): 
    #Calcule les scores BM25 pour une requête et une liste de docs
    #Retourne une liste de scores
    docs_clean = [clean_text(doc) for doc in documents]
    tokenized_docs = [doc.split() for doc in docs_clean]
    bm25 = BM25Okapi(tokenized_docs)
    query_clean = clean_text(query)
    query_tokens = query_clean.split()
    scores = bm25.get_scores(query_tokens)
    return scores

# je chatge les modèle ici
def load_models():
    global model, tokenizer, ner_model, device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    logging.info("[INIT] Loading tokenizer...")
    tokenizer_ = BPETokenizer()
    corpus_path = 'data/corpus_tech.txt'
    try:
        if os.path.exists(TOKENIZER_PATH):
            tokenizer_ = BPETokenizer.load(TOKENIZER_PATH)
            logging.info("[OK] Tokenizer loaded from file.")
        else:
            logging.info("Tokenizer not found, building new one...")
            tokenizer_.build_vocab(corpus_path)
            tokenizer_.save(TOKENIZER_PATH)
    except Exception as e:
        logging.error(f"Erreur lors du chargement/création du tokenizer: {e}")
    logging.info(f"[INFO] Tokenizer size: {len(tokenizer_.tokens2id)}")
    
    logging.info("[INIT] Loading main classification model (AdvancedTransformer)...")
    model_ = AdvancedTransformer(
        vocab_size=len(tokenizer_.tokens2id),
        d_model=256,
        nhead=8,
        num_encoder_layers=2,
        dim_feedforward=1024,
        dropout=0.1
    ).to(device)
    try:
        if os.path.exists(MODEL_PATH):
            model_.load_state_dict(torch.load(MODEL_PATH, map_location=device))
            logging.info("[OK] Classification model loaded.")
        else:
            logging.info("Model checkpoint not found, training from scratch.")
            run_training_pipeline()
            model_.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    except Exception as e:
        logging.error(f"Erreur lors du chargement du modèle de classification: {e}")
    
    logging.info("[INIT] Loading NER model...")
    ner_ = NERTagger(
        vocab_size=len(tokenizer_.tokens2id),
        hidden_dim=256,
        num_labels=3
    ).to(device)
    try:
        if os.path.exists(NER_PATH):
            ner_.load_state_dict(torch.load(NER_PATH, map_location=device))
            logging.info("[OK] NER model loaded.")
        else:
            logging.info("NER model not found, training from scratch.")
            train_ner(tokenizer_, ner_, 'data/ner_corpus.txt', device)
            ner_.load_state_dict(torch.load(NER_PATH, map_location=device))
    except Exception as e:
        logging.error(f"Erreur lors du chargement du modèle NER: {e}")
    
    tokenizer = tokenizer_
    model = model_
    ner_model = ner_
    logging.info("[OK] All models loaded.")

# Classification domain (TF-IDF + DL) 
def classify_domain(cv_text, threshold=0.3, alpha=0.95):
    #Class le CV dans un des domaines (Data, Cyber, Software, Other) en combinant similarité TF-IDF avec des descriptions enrichies et prédiction DL.
    
    logging.debug("=> Step 1: TF-IDF similarity with domain descriptions.")
    cv_classif = preprocess_cv_text(cv_text)
    
    semantic_scores = {}
    for dom, desc in domain_descriptions.items():
        desc_clean = clean_text(desc)
        sim = tfidf_similarity(cv_classif, desc_clean)
        semantic_scores[dom] = sim
        logging.debug(f"     Domain={dom}, tfidf_sim={sim:.4f}")

    max_sim = max(semantic_scores.values()) if semantic_scores.values() else 1.0
    if max_sim == 0.0:
        max_sim = 1.0
    for dom in semantic_scores:
        semantic_scores[dom] /= max_sim

    logging.debug("=> Step 2: Deep Learning classification.")
    cv_for_dl = cv_text if len(cv_text) <= 5000 else cv_text[:5000]
    tokens = tokenizer.tokenize(cv_for_dl)
    MAX_SEQ_LEN = 1024
    if len(tokens) > MAX_SEQ_LEN:
        tokens = tokens[:MAX_SEQ_LEN]
    try:
        input_ids = torch.tensor([tokens], dtype=torch.long).to(device)
    except Exception as e:
        logging.error(f"Erreur lors de la création du tensor: {e}")
        return "Other", {'semantic_scores': semantic_scores, 'dl_scores': {}, 'combined_scores': {}}
    with torch.no_grad():
        logits = model(input_ids, task='classification')
        probs = F.softmax(logits, dim=-1)
    dl_scores = {
        'Data': float(probs[0][0]),
        'Cyber': float(probs[0][1]),
        'Software': float(probs[0][2]),
        'Other': float(probs[0][3])
    }
    logging.debug(f"     DL scores => {dl_scores}")
    
    logging.debug(f"=> Step 3: Combine with alpha={alpha}.")
    combined_scores = {}
    for dom in domain_descriptions:
        combined = alpha * semantic_scores[dom] + (1 - alpha) * dl_scores[dom]
        combined_scores[dom] = combined
        logging.debug(f"     Domain={dom}, sem={semantic_scores[dom]:.3f}, dl={dl_scores[dom]:.3f}, final={combined:.3f}")
    
    best_domain = max(combined_scores.items(), key=lambda x: x[1])[0]
    best_score = combined_scores[best_domain]
    logging.debug(f"=> Best domain candidate: {best_domain} (score={best_score:.3f})")
    
    if best_score < threshold:
        best_domain = "Other"
        logging.debug(f"=> Forcing domain=Other (score below {threshold})")
    
    return best_domain, {
        'semantic_scores': semantic_scores,
        'dl_scores': dl_scores,
        'combined_scores': combined_scores
    }

# Matching internships avec BM25 et analyse des compétences
def match_internships_by_domain(cv_text, domain, top_k=5, bm25_weight=0.6, skill_weight=0.4):
    """
    Filtre d'abord les offres en fonction de mots-clés spécifiques au domaine,
    puis calcule un score combiné basé sur BM25 et la correspondance des compétences.
    Le score final est : final_score = bm25_weight * BM25_score + skill_weight * skill_score.
    """
    if domain == "Other":
        return []
    
    domain_keywords = {
        'Data': ['data', 'analyste', 'science', 'machine learning', 'big data', 'analyse'],
        'Cyber': ['cyber', 'sécurité', 'pentest', 'forensic', 'oscp', 'intrusion'],
        'Software': ['développement', 'logiciel', 'backend', 'frontend', 'devops', 'microservices']
    }
    keywords = domain_keywords.get(domain, [])
    filtered_jobs = []
    for job in internships_db:
        job_text = f"{job['title']} {job.get('description','')}"
        if any(kw.lower() in job_text.lower() for kw in keywords):
            filtered_jobs.append(job)
    if not filtered_jobs:
        filtered_jobs = internships_db
    
    documents = []
    for job in filtered_jobs:
        doc = f"{job['title']} {job.get('description','')}"
        documents.append(clean_text(doc))
    cv_clean = clean_text(cv_text)
    
    tokenized_docs = [doc.split() for doc in documents]
    bm25 = BM25Okapi(tokenized_docs)
    query_tokens = cv_clean.split()
    bm25_scores_arr = bm25.get_scores(query_tokens)
    
    # Normaliser les scores BM25
    if len(bm25_scores_arr) > 0:
        max_bm25 = max(bm25_scores_arr)
        if max_bm25 > 0:
            bm25_scores_arr = [score / max_bm25 for score in bm25_scores_arr]
    
    cv_skills = extract_skills(cv_text, domain)
    logging.debug(f"Compétences extraites du CV ({domain}): {cv_skills}")
    
    final_jobs = []
    for idx, job in enumerate(filtered_jobs):
        job_skills = set()
        if job.get('required_skills'):
            job_skills = {skill.lower() for skill in job['required_skills']}
        if job_skills:
            skill_score = len(cv_skills.intersection(job_skills)) / len(job_skills)
        else:
            skill_score = 0.0

        # je calcule  le score final comme une moyenne pondérée des scores normalisés (valeurs pour montrer les 5 meilleurs stages liés au CV)
        final_score = bm25_weight * bm25_scores_arr[idx] + skill_weight * skill_score
        
        # Le score est déjà entre 0 et 1, pas besoin de le multiplier par 100 ducoup là
        percentage_score = final_score
        
        logging.debug(f"Stage: {job['title']}")
        logging.debug(f"  - BM25 score normalisé: {bm25_scores_arr[idx]:.4f}")
        logging.debug(f"  - Skill score: {skill_score:.4f}")
        logging.debug(f"  - Final score: {percentage_score:.4f}")
        
        job_entry = {
            'title': job['title'],
            'company': job.get('company', 'N/A'),
            'location': job.get('location', 'N/A'),
            'description': job.get('description', ''),
            'required_skills': job.get('required_skills', []),
            'score': percentage_score * 100  # Convertir en pourcentage une seule fois
        }
        final_jobs.append(job_entry)
    
    final_jobs.sort(key=lambda x: x['score'], reverse=True)
    top_matches = final_jobs[:top_k]
    logging.debug("Réponse finale envoyée :")
    for job in top_matches:
        logging.debug(f"  - {job['title']}: score={job['score']} (type: {type(job['score'])})")
    return top_matches

# --- Extraction de texte des fichiers PDF et DOCX ---

def extract_text_with_pymupdf(pdf_bytes):
    logging.debug("Extraction PDF avec PyMuPDF...")
    try:
        doc = fitz.open("pdf", pdf_bytes)
    except Exception as e:
        logging.error(f"Erreur lors de l'ouverture du PDF: {e}")
        return ""
    text = ""
    for i, page in enumerate(doc):
        page_text = page.get_text()
        logging.debug(f"Page {i} : extrait {len(page_text)} caractères")
        text += page_text
    return text

def extract_text_from_docx(docx_content):
    logging.debug("Extraction DOCX avec docx2txt...")
    try:
        # Si c'est une chaîne, on suppose que c'est du base64
        if isinstance(docx_content, str):
            # Si on a le préfixe MIME, on l'enlève
            if docx_content.startswith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"):
                docx_content = docx_content.split("base64,")[1]
            # Décoder le base64
            try:
                file_bytes = base64.b64decode(docx_content)
                logging.debug(f"Base64 décodé avec succès: {len(file_bytes)} bytes")
            except Exception as e:
                logging.error(f"Erreur décodage base64: {str(e)}")
                return ""
        else:
            file_bytes = docx_content
            logging.debug(f"Utilisation directe des bytes: {len(file_bytes)} bytes")

        # Créer un fichier temporaire pour docx2txt
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
            logging.debug(f"Fichier temporaire créé: {tmp_path}")

        try:
            # Extraire le texte avec docx2txt
            text = docx2txt.process(tmp_path)
            logging.debug(f"Texte extrait avec succès: {len(text)} caractères")
            
            # Supprimer le fichier temporaire
            os.unlink(tmp_path)
            logging.debug("Fichier temporaire supprimé")
            
            if text:
                # Prévisualisation pour debug
                preview = text[:200] + "..." if len(text) > 200 else text
                logging.debug(f"Prévisualisation: {preview}")
                return text
            else:
                logging.warning("Aucun texte extrait du DOCX")
                return ""

        except Exception as e:
            logging.error(f"Erreur extraction texte: {str(e)}")
            # Nettoyage en cas d'erreur
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            return ""

    except Exception as e:
        logging.error(f"Erreur globale extraction DOCX: {str(e)}")
        return ""

def extract_text_from_raw_file(file_content):
    #Extrait le texte d'un fichier (PDF ou DOCX) à partir de son contenu.
    #Le fichier peut être encodé en base64 avec un préfixe.
    
    logging.debug("Début de l'extraction du fichier...")
    text = ""
    if isinstance(file_content, str):
        if file_content.startswith("data:application/pdf;base64,"):
            logging.debug("Contenu détecté comme PDF en base64")
            file_content = file_content.split("base64,")[1]
            file_bytes = base64.b64decode(file_content)
            text = extract_text_with_pymupdf(file_bytes)
        elif file_content.startswith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"):
            logging.debug("Contenu détecté comme DOCX en base64")
            text = extract_text_from_docx(file_content)
        elif file_content.startswith("%PDF-"):
            logging.debug("Contenu détecté comme PDF brut")
            file_bytes = file_content.encode("utf-8")
            text = extract_text_with_pymupdf(file_bytes)
        elif file_content.startswith("PK"):  # DOCX commencent souvent par "PK"
            logging.debug("Contenu détecté comme DOCX brut (commence par 'PK')")
            text = extract_text_from_docx(file_content)
        else:
            logging.debug("Contenu non reconnu, tentative d'extraction comme texte brut")
            text = file_content
    else:
        # Si file_content nest pas une chaîne cest des byte
        try:
            text = extract_text_with_pymupdf(file_content)
        except Exception as e:
            logging.error(f"Erreur lors de l'extraction depuis des bytes: {e}")
            text = ""
    logging.debug(f"Extraction terminée, {len(text)} caractères extraits")
    return text

#FLASK ROUTES 
@app.route("/")
def home():
    return "Simple CV Analyzer (TF-IDF + DL + BM25 + Skills) up and running!"

@app.route("/analyze_cv", methods=["POST", "OPTIONS"])
def analyze_cv():
    #Analyse un CV soumis via POST et retourne les stages correspondants
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    try:
        data = request.json
        if not data:
            logging.error("No JSON data in request")
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        cv_text = data.get("cv_text", "").strip()
        if not cv_text:
            logging.error("No CV text in request")
            return jsonify({"success": False, "error": "No CV text provided"}), 400
            
        logging.info("==== New CV analysis request ====")
        logging.info(f"CV length = {len(cv_text)} chars")
        
        # Détermine si le contenu est PDF ou DOCX
        if (cv_text.startswith('data:application/pdf;base64,') or cv_text.startswith('%PDF-') or
            cv_text.startswith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,') or
            cv_text.startswith("PK")):
            logging.debug("Contenu détecté comme fichier PDF ou DOCX, tentative d'extraction...")
            cv_text = extract_text_from_raw_file(cv_text)
            if not cv_text:
                return jsonify({
                    "success": False,
                    "error": "Could not extract text from file. Please ensure the file is not corrupted or password-protected."
                }), 400
            
            logging.debug("=== Contenu extrait ===")
            preview_length = min(len(cv_text), 500)
            logging.debug(f"First {preview_length} chars of extracted text:")
            logging.debug(cv_text[:preview_length] + "..." if len(cv_text) > preview_length else cv_text)
            logging.debug("=== Fin de l'extraction ===")
        
        # Affichage pour débogage de la longueur finale du texte extrait
        logging.debug(f"Texte extrait final (length: {len(cv_text)} chars)")
        
        cv_classif = preprocess_cv_text(cv_text, max_length=5000)
        domain, debug_info = classify_domain(cv_classif, threshold=0.3, alpha=0.95)

        if domain == "Other":
            resp = {
                "success": True,
                "message": (
                    "Je suis un Bot utile aux étudiants de l'Efrei, spécialisé en Data, Cyber et Software. "
                    "Votre CV semble correspondre à un domaine non-technique. Je suis désolé, mais je ne peux pas "
                    "vous proposer de stages adaptés." + 
                    " I am a bot designed to help Efrei students find technical internships. Your CV seems to match a non-technical domain. I'm sorry, but I cannot offer you adapted internships."
                ),
                "analysis": {
                    "domain": "Other",
                    "explanation": "Score final trop faible => Other",
                    "debug_info": debug_info
                },
                "matches": []
            }
            return jsonify(resp)
        else:
            matched_stages = match_internships_by_domain(cv_text, domain, top_k=5)
            unique_stages = []
            seen = set()
            for st in matched_stages:
                key = (st['title'], st['description'])
                if key not in seen:
                    seen.add(key)
                    unique_stages.append(st)
    
            final_matches = []
            for st in unique_stages:
                final_matches.append({
                    "title": st["title"],
                    "company": st["company"],
                    "location": st["location"],
                    "description": st["description"],
                    "required_skills": st["required_skills"],
                    "score": f"{round(st['score']*100,1)}%"
                })
    
            # Ajouter un délai artificiel pour simuler le temps de recherche
            time.sleep(2)

            resp = {
                "success": True,
                "message": f"Votre CV correspond au domaine {domain}.",
                "analysis": {
                    "domain": domain,
                    "explanation": f"Orientation {domain}",
                    "debug_info": debug_info
                },
                "matches": final_matches,
                "cvContent": cv_text,  # Ajouter le contenu du CV
                "fileName": "CV.pdf"  # Ajouter le nom du fichier
            }
            logging.info(f"Domain={domain}, found {len(final_matches)} matches.")
            return jsonify(resp)
    
    except Exception as e:
        logging.error(f"Erreur lors de l'analyse du CV: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'analyse du CV."
        }), 500

@app.route("/upload_cv", methods=["POST"])
def upload_cv():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Lecture du fichier depuis le disque
        with open(filepath, "rb") as f:
            file_bytes = f.read()
        logging.debug(f"Fichier {filename} lu depuis le disque, taille {len(file_bytes)} bytes")
        
        # Utilise l'extraction selon l'extension
        ext = filename.rsplit('.', 1)[1].lower()
        if ext == "pdf":
            cv_text = extract_text_with_pymupdf(file_bytes)
        elif ext == "docx":
            cv_text = extract_text_from_docx(file_bytes)
        else:
            cv_text = ""
        
        preview = cv_text[:300] if len(cv_text) > 300 else cv_text
        logging.info(f"PDF/DOCX preview: {preview}")
    
        domain, debug_info = classify_domain(cv_text, threshold=0.3, alpha=0.95)
    
        if domain == "Other":
            resp = {
                "success": True,
                "message": (
                    "Je suis un Bot utile aux étudiants de l'Efrei, spécialisé en Data, Cyber et Software. "
                    "Votre CV semble correspondre à un domaine non-technique. Je suis désolé, mais je ne peux pas "
                    "vous proposer de stages adaptés." + 
                    " I am a bot designed to help Efrei students find technical internships. Your CV seems to match a non-technical domain. I'm sorry, but I cannot offer you adapted internships."
                ),
                "analysis": {
                    "domain": "Other",
                    "explanation": "Score final trop faible => Other",
                    "debug_info": debug_info
                },
                "matches": [],
                "preview": preview
            }
            return jsonify(resp)
        else:
            matched_stages = match_internships_by_domain(cv_text, domain, top_k=5)
            unique_stages = []
            seen = set()
            for st in matched_stages:
                key = (st['title'], st['description'])
                if key not in seen:
                    seen.add(key)
                    unique_stages.append(st)
    
            final_matches = []
            for st in unique_stages:
                final_matches.append({
                    "title": st["title"],
                    "company": st["company"],
                    "location": st["location"],
                    "description": st["description"],
                    "required_skills": st["required_skills"],
                    "score": f"{round(st['score']*100,1)}%"
                })
    
            # Ajouter un délai artificiel pour simuler le temps de recherche
            time.sleep(2)

            resp = {
                "success": True,
                "message": f"Votre CV correspond au domaine {domain}.",
                "analysis": {
                    "domain": domain,
                    "debug_info": debug_info
                },
                "matches": final_matches,
                "preview": preview,
                "cvContent": cv_text,  # Ajoutele contenu du CV
                "fileName": filename  # Ajoute le nom du fichier
            }
            return jsonify(resp)
    
    else:
        return jsonify({"error": "File type not allowed"}), 400

if __name__ == "__main__":
    load_models()
    app.run(debug=True, port=5000)
