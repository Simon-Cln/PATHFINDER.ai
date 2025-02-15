import os
import random


BASE_PATH = r"C:\Users\calar\OneDrive\Bureau\surf\PATHFINDER\advanced_nlp_backend\data\labeled_cvs"

categories = {
    "data": 0,
    "cyber": 1,
    "software": 2,
    "other": 3
}

NUM_CVS_PER_CATEGORY = 50  


LIST_NAMES = [
    "Julien Lefevre", "Marie Dubois", "Alice Martin", "Lucas Bernard",
    "Sophie Moreau", "Arthur Leroy", "Camille Petit", "Jean Lambert",
    "Nathalie Blanc", "Emilie Garnier", "Paul Roger", "Louise Dupont"
]

LIST_ADDRESS = [
    "12 Rue de la Paix, 75002 Paris",
    "18 Avenue de Lyon, 69003 Lyon",
    "5 Place de la Gare, 31000 Toulouse",
    "22 Boulevard de Strasbourg, 67000 Strasbourg",
    "9 Rue du Pont, 33000 Bordeaux",
    "75 Rue Saint-Michel, 13006 Marseille"
]

LIST_PHONE = [
    "06.12.34.56.78", "07.98.76.54.32", "06.55.44.12.90",
    "07.22.33.44.55", "06.89.12.45.67"
]

LIST_EMAILS = [
    "contact@gmail.com", "pro@yahoo.fr", "personnel@outlook.com",
    "example@hotmail.fr", "cvmail@free.fr"
]

LIST_LINKS = [
    "https://www.linkedin.com/in/candidat123", 
    "https://github.com/candidat123",
    "https://www.linkedin.com/in/professionnelxyz",
    ""
]

# --------------------------------------------------------------------
# Ressources spécifiques par catégorie
# --------------------------------------------------------------------
# 1) CYBER
CYBER_FORMATIONS = [
    "Master 2 - Cybersécurité - EFREI Paris (2023-2025)\nSécurité des systèmes, cryptographie, pentesting, forensic",
    "Master Cybersécurité - EPITA (2022-2024)\nSpécialisation : Sécurité offensive, Reverse Engineering, SIEM",
    "Licence Informatique - Université de Rennes (2019-2022)\n"
]

CYBER_EXPERIENCES = [
    "Stage Analyste en Cybersécurité - Atos (06/2024 - 12/2024)\n- Audit de sécurité et pentesting\n- Mise en place de solutions SIEM\n- Analyse de logs et détection d’incidents",
    "Alternance Cyberdefense - Orange Cyberdefense (2023 - 2024)\n- Tests d’intrusion sur applications web\n- Recherche de vulnérabilités\n- Gestion des alertes SOC",
    "Mission Freelance - Consultant Sécurité (2022)\n- Hardening serveurs Linux\n- Configuration pare-feu et IDS"
]

CYBER_COMPETENCES = [
    "Langages : Python, Bash, C, Powershell",
    "Outils : Metasploit, Wireshark, Burp Suite, Splunk, Nessus",
    "Protocoles : TCP/IP, SSL/TLS, SSH, DNS",
    "Sécurité offensive : Pentesting, Reverse Engineering",
    "Sécurité défensive : Hardening, SOC, SIEM"
]

CYBER_PROJETS = [
    "Simulation d'attaques sur un réseau virtualisé (Kali Linux, Snort)",
    "Développement d'un honeypot pour la détection de cyberattaques (Python, ELK Stack)",
    "Analyse forensic d’un malware (Reverse Engineering, IDA Pro)"
]

CYBER_OBJECTIFS = [
    "En dernière année de Master Cybersécurité, je cherche un stage de fin d’études pour mettre en pratique mes compétences en sécurité offensive et défensive.",
    "Mon objectif est de rejoindre une équipe SOC pour analyser et répondre aux menaces en temps réel.",
    "Je souhaite approfondir mes connaissances en pentesting et en threat intelligence au sein d’un grand groupe."
]

# 2) DATA
DATA_FORMATIONS = [
    "Master 2 - Data Science - Université Paris-Saclay (2023-2025)\nMachine Learning, Big Data, statistiques avancées",
    "Licence Mathématiques & Informatique - Université de Lille (2020-2023)",
    "Bachelor Informatique - École 42 (2019-2022)\n"
]

DATA_EXPERIENCES = [
    "Stage Data Analyst - Capgemini (06/2024 - 12/2024)\n- Analyse de gros volumes de données (Spark, Hadoop)\n- Création de dashboards Power BI\n- Optimisation de requêtes SQL",
    "Alternance Data Scientist - BNP Paribas (2023 - 2024)\n- Modèles de prédiction de churn\n- Traitement du langage naturel (NLP)\n- Visualisation et reporting",
    "Projet Freelance - Data Mining (2022)\n- Scraping et nettoyage de données web\n- Mise en place d’un pipeline ETL"
]

DATA_COMPETENCES = [
    "Langages : Python, R, SQL",
    "Outils : TensorFlow, PyTorch, Spark, Hadoop, Tableau",
    "Modélisation : régression, classification, clustering",
    "Data engineering : pipelines ETL, orchestrations (Airflow)"
]

DATA_PROJETS = [
    "Développement d'un modèle de classification d'images (CNN) pour la détection de défauts",
    "Analyse exploratoire et visualisation de données clients (Pandas, Matplotlib)",
    "Mise en place d'un pipeline Big Data (Kafka, Spark, HDFS)"
]

DATA_OBJECTIFS = [
    "Recherche un stage de fin d’études en Data Science pour appliquer mes compétences en machine learning et data engineering.",
    "Mon objectif est de créer de la valeur à partir de données massives pour améliorer la prise de décision.",
    "Je souhaite développer des solutions d’IA en production et optimiser les workflows analytiques."
]

# 3) SOFTWARE
SOFTWARE_FORMATIONS = [
    "Master Ingénierie Logicielle - Université de Grenoble (2023-2025)\nConception orientée objet, architectures distribuées",
    "Licence Informatique - Université de Bordeaux (2020-2023)",
    "Bachelor Développement Web - EEMI (2019-2022)\n"
]

SOFTWARE_EXPERIENCES = [
    "Stage Développeur Full-Stack - Société Générale (06/2024 - 12/2024)\n- Développement d’API REST en Java Spring\n- Frontend en React.js\n- Mise en place CI/CD (Jenkins)",
    "Alternance Ingénieur Logiciel - Thales (2023 - 2024)\n- Applications C++ temps réel\n- Docker, Kubernetes, microservices\n- Tests unitaires et intégration continue",
    "Projet Freelance - Création d’une application mobile (2022)\n- Stack Flutter / Firebase\n- Authentification et push notifications"
]

SOFTWARE_COMPETENCES = [
    "Langages : Java, C++, Python, JavaScript",
    "Frameworks : Spring Boot, Django, React, Node.js",
    "Outils : Docker, Kubernetes, Git, Jenkins",
    "Méthodes : Agile/Scrum, TDD, Clean Code"
]

SOFTWARE_PROJETS = [
    "Développement d'un microservice de paiement (Java Spring, Docker, MySQL)",
    "Application mobile cross-platform (Flutter, Firebase)",
    "Système de recommandation d’articles (Python, REST API)"
]

SOFTWARE_OBJECTIFS = [
    "Cherche un stage de fin d'études pour consolider mes compétences Full-Stack et en DevOps.",
    "Souhaite participer au développement d’applications web complexes et scalables.",
    "Mon objectif est de rejoindre une équipe agile pour développer des solutions innovantes."
]

# 4) OTHER
OTHER_FORMATIONS = [
    "Master Marketing - HEC Paris (2023-2025)\nGestion de projets, études de marché, stratégies marketing",
    "Licence Management - Université de Montpellier (2020-2023)",
    "Bachelor Économie - Université de Lyon (2019-2022)\n"
]

OTHER_EXPERIENCES = [
    "Stage Assistante Marketing - L’Oréal (06/2024 - 12/2024)\n- Études de marché et analyse concurrentielle\n- Rédaction de plans marketing\n- Gestion de la relation client",
    "Alternance Chef de projet - Carrefour (2023 - 2024)\n- Coordination d’équipes pluridisciplinaires\n- Suivi des KPIs\n- Mise en place de campagnes promotionnelles",
    "Mission Freelance - Consultant en gestion (2022)\n- Analyse budgétaire et recommandations stratégiques"
]

OTHER_COMPETENCES = [
    "Gestion de projet, Budgeting, Team leadership",
    "Outils : Excel, PowerPoint, CRM, Google Analytics",
    "Compétences transversales : communication, négociation, stratégie",
    "Expérience en management et coordination d’équipes"
]

OTHER_PROJETS = [
    "Lancement d’une nouvelle gamme de produits (étude de marché, marketing digital)",
    "Organisation d’un salon professionnel (logistique, planification, budget)",
    "Réussite d’un projet de réduction des coûts opérationnels"
]

OTHER_OBJECTIFS = [
    "À la recherche d’un stage de fin d’études pour acquérir de l’expérience en marketing et gestion de projets.",
    "Souhaite développer mes compétences en management et en stratégie commerciale.",
    "Mon objectif est de rejoindre une entreprise dynamique et contribuer à sa croissance."
]

# --------------------------------------------------------------------
# Fonction principale de génération d'un CV
# --------------------------------------------------------------------
def generate_cv(category: str) -> str:
    """
    Génère le contenu d'un CV en fonction de la catégorie (data, cyber, software, other)
    sous forme de texte structuré.
    """
    # Choix d'un nom, adresse, téléphone, email, lien
    nom_complet = random.choice(LIST_NAMES)
    adresse = random.choice(LIST_ADDRESS)
    telephone = random.choice(LIST_PHONE)
    email = random.choice(LIST_EMAILS)
    link = random.choice(LIST_LINKS)
    
    header = f"{nom_complet}\n{adresse} - {telephone} - {email}"
    if link:
        header += f" - {link}"
    header += "\n"
    
    if category == "cyber":
        formations = random.choice(CYBER_FORMATIONS)
        experiences = random.choice(CYBER_EXPERIENCES)
        competences = random.sample(CYBER_COMPETENCES, k=min(3, len(CYBER_COMPETENCES)))
        projets = random.choice(CYBER_PROJETS)
        objectif = random.choice(CYBER_OBJECTIFS)
    
    elif category == "data":
        formations = random.choice(DATA_FORMATIONS)
        experiences = random.choice(DATA_EXPERIENCES)
        competences = random.sample(DATA_COMPETENCES, k=min(3, len(DATA_COMPETENCES)))
        projets = random.choice(DATA_PROJETS)
        objectif = random.choice(DATA_OBJECTIFS)
    
    elif category == "software":
        formations = random.choice(SOFTWARE_FORMATIONS)
        experiences = random.choice(SOFTWARE_EXPERIENCES)
        competences = random.sample(SOFTWARE_COMPETENCES, k=min(3, len(SOFTWARE_COMPETENCES)))
        projets = random.choice(SOFTWARE_PROJETS)
        objectif = random.choice(SOFTWARE_OBJECTIFS)
    
    else:
        formations = random.choice(OTHER_FORMATIONS)
        experiences = random.choice(OTHER_EXPERIENCES)
        competences = random.sample(OTHER_COMPETENCES, k=min(3, len(OTHER_COMPETENCES)))
        projets = random.choice(OTHER_PROJETS)
        objectif = random.choice(OTHER_OBJECTIFS)
    
    # Construction du texte final
    cv_text = (
        f"{header}\n"
        "FORMATION\n"
        f"{formations}\n\n"
        "EXPÉRIENCES PROFESSIONNELLES\n"
        f"{experiences}\n\n"
        f"OBJECTIF\n{objectif}\n\n"
        "COMPÉTENCES\n"
        + "\n".join(f"- {c}" for c in competences)
        + "\n\n"
        "PROJETS\n"
        f"{projets}\n"
    )
    
    return cv_text


def main():
    for cat in categories:
        cat_folder = os.path.join(BASE_PATH, cat)
        os.makedirs(cat_folder, exist_ok=True)
        
        for i in range(1, NUM_CVS_PER_CATEGORY + 1):
            # Génère le contenu du CV
            cv_text = generate_cv(cat)
            
            # Nom du fichier .txt
            filename_txt = f"cv_{cat}_{i}.txt"
            path_txt = os.path.join(cat_folder, filename_txt)
            
            with open(path_txt, 'w', encoding='utf-8') as f:
                f.write(cv_text)
            
            # Label vector (pour compatibilité)
            # Dans la nouvelle version, on utilise CrossEntropy => un seul entier
            # Mais si tu veux garder l'ancien format 0/1/0/0 :
            label_vec = [0, 0, 0, 0]
            label_vec[categories[cat]] = 1
            
            filename_labels = f"cv_{cat}_{i}.labels"
            path_labels = os.path.join(cat_folder, filename_labels)
            with open(path_labels, 'w', encoding='utf-8') as f:
                f.write(" ".join(map(str, label_vec)))
    
    print("Génération des CVs terminée !")


if __name__ == "__main__":
    main()