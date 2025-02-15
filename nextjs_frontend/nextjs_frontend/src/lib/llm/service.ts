/**
 * Service de génération de lettres de motivation
 */
import { ImprovedLLM } from './model';

interface Internship {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  domain: string;
  location: string;
  duration: string;
  keywords: string[];
  companyValues?: string[];
}

interface Experience {
  title: string;
  company: string;
  description: string;
  skills: string[];
  duration?: number;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
}

interface Candidate {
  fullName: string;
  formation: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  values?: string[];
}

interface TemplateData {
  internship: Internship;
  candidate: Candidate;
}

const DEFAULT_PROJECT: Project = {
  name: "Projet d'analyse de données",
  description: "Projet utilisant Python et des techniques de machine learning pour l'analyse de données",
  technologies: ["Python", "Machine Learning", "Data Analysis"]
};

const DEFAULT_EXPERIENCE: Experience = {
  title: "Stage en développement",
  company: "Entreprise innovante",
  description: "Développement d'applications et analyse de données",
  skills: ["Python", "Analyse de données", "Machine Learning"]
};

class MotivationLetterService {
  private llm: ImprovedLLM;

  constructor() {
    this.llm = new ImprovedLLM();
  }

  private validateInternship(internship: any): Internship {
    console.log("=== VALIDATION DU STAGE ===");
    console.log("Stage reçu:", internship);

    // Extraire les mots-clés de la description du stage
    const description = internship?.description?.toLowerCase() || '';
    const keywords = new Set<string>();
    
    // Liste de mots-clés techniques courants
    const technicalKeywords = [
      'python', 'r', 'sql', 'java', 'javascript', 'typescript',
      'machine learning', 'deep learning', 'ai', 'artificial intelligence',
      'data science', 'analyse de données', 'big data',
      'statistiques', 'mathématiques', 'algorithmes',
      'développement', 'programmation', 'software',
      'cloud', 'aws', 'azure', 'gcp',
      'devops', 'ci/cd', 'git',
      'api', 'rest', 'graphql',
      'base de données', 'database', 'sql', 'nosql',
      'visualisation', 'dashboard', 'reporting'
    ];

    // Extraire les mots-clés techniques de la description
    technicalKeywords.forEach(keyword => {
      if (description.includes(keyword.toLowerCase())) {
        keywords.add(keyword);
      }
    });

    // Ajouter les requirements s'ils existent
    if (internship?.requirements?.length > 0) {
      internship.requirements.forEach((req: string) => keywords.add(req));
    }

    const validated = {
      title: internship?.title || "Stage",
      company: internship?.company || "Entreprise",
      description: internship?.description || "",
      requirements: Array.from(keywords),
      domain: internship?.domain || "",
      location: internship?.location || "",
      duration: internship?.duration || "",
      keywords: Array.from(keywords)
    };

    console.log("Stage validé:", validated);
    console.log("Mots-clés extraits:", Array.from(keywords));
    return validated;
  }

  private validateCandidate(userCV: any, skills: string[]): Candidate {
    console.log("=== VALIDATION DU CV ===");
    console.log("CV reçu:", userCV);
    console.log("Skills fournis:", skills);

    // Extraire les compétences du CV
    const extractedSkills = new Set<string>([
      ...(userCV?.skills || []),
      ...(userCV?.projects || []).flatMap(p => p.technologies || []),
      ...(userCV?.experience || []).flatMap(e => e.skills || []),
      ...skills
    ]);

    console.log("Skills extraits:", Array.from(extractedSkills));

    // Ajouter des compétences par défaut si nécessaire
    const finalSkills = extractedSkills.size > 0 ? 
      Array.from(extractedSkills) : 
      ["Python", "Analyse de données", "Machine Learning"];

    // Traiter les expériences
    const experiences = (userCV?.experience || []).map((exp: any) => ({
      title: exp.title || "Stage",
      company: exp.company || "Entreprise",
      description: exp.description || "",
      skills: exp.skills?.length > 0 ? exp.skills : finalSkills,
      duration: exp.duration || "3 mois"
    }));

    // Traiter les projets
    const projects = (userCV?.projects || []).map((proj: any) => ({
      name: proj.name || "Projet",
      description: proj.description || "",
      technologies: proj.technologies?.length > 0 ? proj.technologies : finalSkills
    }));

    const validated = {
      fullName: userCV?.fullName || "Candidat",
      formation: userCV?.formation || "Formation en cours",
      skills: finalSkills,
      experience: experiences.length > 0 ? experiences : [{
        title: "Stage",
        company: "Entreprise",
        description: "Stage en développement et analyse de données",
        skills: finalSkills,
        duration: "3 mois"
      }],
      projects: projects.length > 0 ? projects : [{
        name: "Projet Personnel",
        description: "Développement d'une application d'analyse de données",
        technologies: finalSkills
      }],
      values: userCV?.values
    };

    console.log("=== RÉSULTAT DE LA VALIDATION ===");
    console.log("CV validé:", validated);
    return validated;
  }

  async generateTemplate(internship: any, skills: string[], userCV: any): Promise<string> {
    try {
      console.log("=== DÉBUT GÉNÉRATION LETTRE ===");
      console.log("📋 Stage reçu:", {
        titre: internship?.title,
        entreprise: internship?.company,
        description: internship?.description,
        prérequis: internship?.requirements,
        domaine: internship?.domain,
        localisation: internship?.location,
        durée: internship?.duration
      });
      
      console.log("🔍 Analyse textuelle du CV:", {
        "Mots-clés trouvés dans la description du stage": internship?.description?.toLowerCase().match(/\b\w+\b/g) || [],
        "Compétences fournies": skills,
        "Compétences du CV": userCV?.skills || [],
        "Technologies des projets": userCV?.projects?.map(p => p.technologies || []).flat() || [],
        "Compétences des expériences": userCV?.experience?.map(e => e.skills || []).flat() || []
      });

      // Validation des entrées avec plus de souplesse
      if (!internship && !userCV) {
        throw new Error("Les données de l'offre de stage ET du CV sont manquantes");
      }

      // Préparation des données avec validation
      const templateData: TemplateData = {
        internship: this.validateInternship(internship),
        candidate: this.validateCandidate(userCV, skills)
      };

      console.log("=== DONNÉES TEMPLATE PRÉPARÉES ===");
      console.log("📋 Stage validé:", {
        titre: templateData.internship.title,
        entreprise: templateData.internship.company,
        motsClés: templateData.internship.keywords,
        prérequis: templateData.internship.requirements
      });
      console.log("👤 Candidat validé:", {
        nom: templateData.candidate.fullName,
        formation: templateData.candidate.formation,
        compétences: templateData.candidate.skills,
        expériences: templateData.candidate.experience.map(e => ({
          titre: e.title,
          entreprise: e.company,
          compétences: e.skills
        })),
        projets: templateData.candidate.projects.map(p => ({
          nom: p.name,
          technologies: p.technologies
        }))
      });

      // Génération de la lettre
      const letter = this.llm.generateMotivationLetter(templateData);
      console.log("✉️ Lettre générée avec succès");
      return letter;

    } catch (error) {
      console.error("❌ Erreur lors de la génération de la lettre :", error);
      throw error;
    }
  }
}

// Export d'une instance unique du service
const motivationLetterService = new MotivationLetterService();
export { motivationLetterService, type Internship, type Candidate, type TemplateData };
