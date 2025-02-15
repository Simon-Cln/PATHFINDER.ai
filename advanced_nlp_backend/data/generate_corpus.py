import random
from itertools import product, combinations
import json

def generate_job_descriptions():
    """Génère des descriptions de postes techniques."""
    companies = ["Google", "Amazon", "Microsoft", "Apple", "Meta", "IBM", "Oracle", "Thales", "Capgemini", "Sopra Steria", 
                "Orange", "Atos", "Ubisoft", "Criteo", "Datadog", "OVHcloud", "Dassault Systèmes"]
    locations = ["Paris", "Lyon", "Toulouse", "Bordeaux", "Nantes", "Lille", "Marseille", "Sophia Antipolis", "Grenoble"]
    
    roles = {
        "Data": ["Data Scientist", "ML Engineer", "Data Engineer", "Research Scientist", "NLP Engineer", "Computer Vision Engineer"],
        "Cyber": ["Security Engineer", "Pentester", "SOC Analyst", "Security Architect", "Threat Hunter", "Incident Response Analyst"],
        "Dev": ["Full Stack Developer", "Backend Engineer", "DevOps Engineer", "Cloud Architect", "Software Engineer", "Platform Engineer"]
    }
    
    descriptions = []
    for domain, positions in roles.items():
        for position in positions:
            for company in companies:
                for location in locations:
                    stack = get_tech_stack(domain)
                    responsibilities = get_responsibilities(domain)
                    desc = f"Offre de stage : {position} - {company} ({location})\n"
                    desc += f"Stack technique : {', '.join(random.sample(stack, min(5, len(stack))))}\n"
                    desc += "Responsabilités :\n- " + "\n- ".join(random.sample(responsibilities, 3)) + "\n"
                    descriptions.append(desc)
    return descriptions

def get_tech_stack(domain):
    stacks = {
        "Data": [
            "Python", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Spark", "Hadoop", 
            "Kubernetes", "Docker", "AWS", "GCP", "Azure", "MLflow", "DVC", "Weights & Biases", "Ray",
            "FastAPI", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Airflow", "Kafka"
        ],
        "Cyber": [
            "Python", "Bash", "PowerShell", "Kali Linux", "Metasploit", "Burp Suite", "Wireshark", 
            "Nmap", "Snort", "Splunk", "ELK Stack", "OSSEC", "Nessus", "OpenVAS", "MISP", "TheHive",
            "YARA", "Volatility", "IDA Pro", "Ghidra", "Docker", "AWS Security", "Azure Security"
        ],
        "Dev": [
            "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust", "C++", "React", "Vue.js", 
            "Angular", "Node.js", "Spring Boot", "Django", "FastAPI", "Docker", "Kubernetes", 
            "AWS", "Azure", "GCP", "Terraform", "Ansible", "Jenkins", "GitLab CI", "PostgreSQL"
        ]
    }
    return stacks.get(domain, [])

def get_responsibilities(domain):
    resp = {
        "Data": [
            "Développer et déployer des modèles de machine learning en production",
            "Optimiser les performances des modèles existants",
            "Créer des pipelines de données robustes et scalables",
            "Implémenter des solutions de deep learning pour la vision par ordinateur",
            "Concevoir des systèmes de recommandation personnalisés",
            "Analyser de grands volumes de données pour en extraire des insights",
            "Mettre en place des systèmes de monitoring pour les modèles ML",
            "Développer des solutions NLP pour l'analyse de texte",
            "Collaborer avec les équipes produit pour définir les métriques",
            "Automatiser les processus d'entraînement et d'évaluation des modèles"
        ],
        "Cyber": [
            "Effectuer des tests d'intrusion sur les applications web",
            "Analyser les menaces et les vulnérabilités de sécurité",
            "Mettre en place des solutions de détection d'intrusion",
            "Gérer les incidents de sécurité et conduire des investigations",
            "Développer des outils d'automatisation pour la sécurité",
            "Réaliser des audits de sécurité des systèmes",
            "Implémenter des politiques de sécurité Zero Trust",
            "Surveiller et analyser les logs de sécurité",
            "Conduire des exercices de red teaming",
            "Former les équipes aux bonnes pratiques de sécurité"
        ],
        "Dev": [
            "Développer des applications web scalables et performantes",
            "Concevoir des architectures microservices",
            "Implémenter des pipelines CI/CD automatisés",
            "Optimiser les performances des applications",
            "Gérer des infrastructures cloud complexes",
            "Développer des APIs RESTful et GraphQL",
            "Mettre en place des systèmes de monitoring",
            "Implémenter des solutions de caching distribuées",
            "Gérer des bases de données à haute disponibilité",
            "Contribuer à l'amélioration des pratiques DevOps"
        ]
    }
    return resp.get(domain, [])

def generate_technical_content():
    """Génère du contenu technique détaillé."""
    sections = {
        "LLM_AND_TRANSFORMERS": [
            "Les modèles de type Transformer comme GPT et BERT ont révolutionné le traitement du langage naturel grâce à leur mécanisme d'attention.",
            "L'architecture Transformer utilise des couches d'attention multi-têtes pour capturer les dépendances à longue portée dans les séquences.",
            "Le pré-entraînement des LLMs se fait généralement sur d'immenses corpus de texte avec des objectifs comme le masquage de tokens.",
            "Les modèles foundation comme GPT-3 peuvent être fine-tunés sur des tâches spécifiques grâce au transfer learning.",
            "L'inférence avec les LLMs nécessite souvent des techniques d'optimisation comme le knowledge distillation et le pruning.",
            "Les embeddings contextuels générés par BERT permettent de capturer le sens des mots en fonction de leur contexte.",
            "Le concept de few-shot learning permet aux LLMs d'apprendre de nouvelles tâches avec peu d'exemples d'entraînement.",
        ],
        
        "DEEP_LEARNING": [
            "Les réseaux de neurones convolutifs (CNN) sont particulièrement efficaces pour l'analyse d'images et la vision par ordinateur.",
            "Le deep learning nécessite une grande quantité de données d'entraînement et une puissance de calcul importante, souvent fournie par des GPUs.",
            "Les techniques de régularisation comme le dropout et la batch normalization permettent de réduire le surapprentissage.",
            "Les réseaux récurrents (RNN, LSTM, GRU) sont adaptés au traitement de séquences temporelles et de texte.",
            "L'apprentissage par renforcement profond combine deep learning et RL pour apprendre des politiques optimales.",
            "Les auto-encodeurs permettent d'apprendre des représentations compressées des données de manière non supervisée.",
            "Les GANs (Generative Adversarial Networks) consistent en un générateur et un discriminateur qui s'entraînent mutuellement.",
        ],
    }

    # Ajouter beaucoup plus de contenu technique...
    sections.update({
        "MACHINE_LEARNING_ADVANCED": [
            f"L'algorithme {algo} est particulièrement efficace pour {task}."
            for algo, task in product(
                ["XGBoost", "LightGBM", "CatBoost", "Random Forest", "SVM", "KNN"],
                ["la classification", "la régression", "la détection d'anomalies", "le clustering"]
            )
        ],
        "DEEP_LEARNING_ARCHITECTURES": [
            f"L'architecture {arch} est optimale pour {task}."
            for arch, task in product(
                ["ResNet", "VGG", "Inception", "EfficientNet", "YOLO", "Mask R-CNN"],
                ["la classification d'images", "la détection d'objets", "la segmentation sémantique", "le transfer learning"]
            )
        ],
        "CLOUD_PATTERNS": [
            f"Le pattern {pattern} permet {benefit}."
            for pattern, benefit in product(
                ["Circuit Breaker", "CQRS", "Event Sourcing", "Saga", "Strangler Fig"],
                ["d'améliorer la résilience", "de gérer la scalabilité", "d'optimiser les performances", "de faciliter la maintenance"]
            )
        ]
    })

    # Générer des descriptions de projets
    projects = []
    for domain in ["IA", "Cybersécurité", "Cloud"]:
        for complexity in ["simple", "intermédiaire", "complexe"]:
            for goal in ["améliorer", "optimiser", "automatiser", "sécuriser"]:
                project = f"Projet {domain} {complexity} : {goal} les processus existants en utilisant les technologies modernes."
                projects.append(project)
                projects.append(f"Objectifs techniques du projet :")
                projects.extend([f"- {resp}" for resp in get_responsibilities(domain[:4])])
                projects.append("")

    # Générer des descriptions techniques détaillées
    tech_descriptions = []
    for section, content in sections.items():
        tech_descriptions.append(f"\n# {section.replace('_', ' ').title()}")
        tech_descriptions.extend(content)
        
        # Ajouter des variations et combinaisons
        if len(content) >= 2:
            for c1, c2 in combinations(content, 2):
                combined = f"En combinant {c1.lower()} avec {c2.lower()}, on obtient des résultats encore plus performants."
                tech_descriptions.append(combined)

    return tech_descriptions + projects

def generate_other_corpus():
    """Génère un corpus de textes hors-scope (droit, marketing, etc)"""
    corpus = ""
    
    # Droit
    legal_texts = [
        "Le cabinet d'avocats spécialisé en droit des affaires recherche un juriste",
        "Maîtrise du droit commercial et du droit des sociétés",
        "Rédaction de contrats et de conclusions",
        "Analyse de la jurisprudence et veille juridique",
        "Master en droit des affaires avec spécialisation en contentieux",
        "Stage au sein du département juridique d'une grande entreprise",
        "Participation à des audiences au tribunal de commerce"
    ]
    
    # Marketing
    marketing_texts = [
        "Développement de la stratégie marketing digital",
        "Analyse des KPIs et reporting des campagnes",
        "Gestion des réseaux sociaux et du content marketing",
        "Expérience en marketing B2B et B2C",
        "Master en marketing et communication",
        "Stage dans une agence de publicité",
        "Certification Google Analytics et Google Ads"
    ]
    
    # Finance
    finance_texts = [
        "Analyse financière et reporting mensuel",
        "Gestion de la trésorerie et des relations bancaires",
        "Élaboration des budgets prévisionnels",
        "Master en finance d'entreprise",
        "Stage en cabinet d'audit financier",
        "Maîtrise des normes IFRS et US GAAP",
        "Certification AMF"
    ]
    
    all_texts = legal_texts + marketing_texts + finance_texts
    corpus = "\n".join(all_texts)
    return corpus

def generate_technical_corpus():
    """Génère un corpus technique pour le pré-entraînement."""
    corpus = ""
    
    # Data Science
    data_texts = [
        "Développement de modèles de machine learning en Python",
        "Analyse de données avec pandas et numpy",
        "Deep learning avec TensorFlow et PyTorch",
        "Visualisation de données avec matplotlib et seaborn",
        "Traitement du langage naturel avec NLTK et spaCy",
        "Big data avec Spark et Hadoop",
        "Déploiement de modèles ML en production"
    ]
    
    # Cybersécurité
    cyber_texts = [
        "Tests d'intrusion et audit de sécurité",
        "Analyse de malware et reverse engineering",
        "Configuration de firewalls et IDS",
        "Gestion des incidents de sécurité",
        "Cryptographie et sécurité des réseaux",
        "Sécurité des applications web",
        "Forensics et investigation numérique"
    ]
    
    # Software Engineering
    software_texts = [
        "Développement full-stack avec React et Node.js",
        "Architecture microservices avec Docker et Kubernetes",
        "CI/CD avec Jenkins et GitLab",
        "Développement backend en Java Spring Boot",
        "Tests unitaires et intégration continue",
        "Clean code et design patterns",
        "API REST et GraphQL"
    ]
    
    all_texts = data_texts + cyber_texts + software_texts
    corpus = "\n".join(all_texts)
    return corpus

def generate_technical_corpus_full():
    """Génère un corpus technique complet."""
    corpus_parts = []
    
    # Générer le contenu technique
    corpus_parts.extend(generate_technical_content())
    
    # Ajouter les descriptions de postes
    corpus_parts.extend(generate_job_descriptions())
    
    # Mélanger le contenu
    random.shuffle(corpus_parts)
    
    # Joindre tout le contenu
    corpus = "\n\n".join(corpus_parts)
    
    # Calculer une estimation du nombre de tokens
    estimated_tokens = len(corpus.split())
    print(f"Nombre estimé de tokens générés : {estimated_tokens}")
    
    return corpus

if __name__ == "__main__":
    # Générer les corpus
    tech_corpus = generate_technical_corpus_full()
    other_corpus = generate_other_corpus()
    
    # Combiner les corpus
    full_corpus = tech_corpus + "\n" + other_corpus
    
    # Sauvegarder le corpus
    with open("./corpus_tech.txt", "w", encoding="utf-8") as f:
        f.write(full_corpus)
    
    print("Corpus généré avec succès!")
