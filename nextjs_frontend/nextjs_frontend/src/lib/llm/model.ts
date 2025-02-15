/**
 * Modèle de génération de lettres de motivation basé sur l'analyse des données
 */

interface ProjectAnalysis {
  relevance: number;
  keywords: string[];
  description: string;
  matchingKeywords: string[];
  score: number;
}

interface ExperienceAnalysis {
  relevance: number;
  matchingKeywords: string[];
  skills: string[];
  score: number;
}

interface TemplateSection {
  content: string;
  score: number;
  keywords: string[];
}

interface LetterTemplate {
  introduction: TemplateSection;
  skills: TemplateSection;
  experience: TemplateSection;
  projects: TemplateSection;
  conclusion: TemplateSection;
}

export class ImprovedLLM {
  private readonly keywordWeights = {
    // Compétences techniques avec poids ML
    'machine learning': 2.5,
    'deep learning': 2.3,
    'ai': 2.2,
    'nlp': 2.1,
    'computer vision': 2.0,
    'data science': 2.0,
    'python': 1.8,
    'tensorflow': 1.8,
    'pytorch': 1.8,
    'scikit-learn': 1.7,
    'data analysis': 1.7,
    'big data': 1.6,
    'statistics': 1.6,
    
    // Compétences développement
    'développement': 1.5,
    'api': 1.4,
    'cloud': 1.4,
    'devops': 1.3,
    'git': 1.2,
    'docker': 1.2,
    
    // Soft skills
    'gestion de projet': 1.4,
    'travail en équipe': 1.3,
    'communication': 1.2,
    'autonomie': 1.1,
    'problem solving': 1.4,
    'innovation': 1.3
  };

  private analyzeProject(project: any, internshipKeywords: string[]): ProjectAnalysis {
    console.log("=== ANALYSE DU PROJET ===");
    console.log("📂 Projet à analyser:", {
      nom: project.name,
      description: project.description,
      technologies: project.technologies
    });
    console.log("🔑 Mots-clés du stage:", internshipKeywords);

    const description = project.description.toLowerCase();
    const technologies = project.technologies || [];
    
    // Recherche de correspondances dans la description
    const descriptionMatches = internshipKeywords.filter(k => 
      description.includes(k.toLowerCase())
    );
    
    // Recherche de correspondances dans les technologies
    const techMatches = internshipKeywords.filter(k =>
      technologies.some(t => t.toLowerCase().includes(k.toLowerCase()))
    );
    
    console.log("🔍 Correspondances trouvées:", {
      "Dans la description": descriptionMatches,
      "Dans les technologies": techMatches
    });
    
    const matchingKeywords = Array.from(new Set([...descriptionMatches, ...techMatches]));
    const score = matchingKeywords.length;
    const relevance = internshipKeywords.length > 0 ? 
      matchingKeywords.length / internshipKeywords.length : 
      0;

    const analysis = {
      relevance,
      keywords: technologies,
      description,
      matchingKeywords,
      score: score * (relevance + 0.5)
    };

    console.log("📊 Résultat de l'analyse:", {
      motsClésCorrespondants: analysis.matchingKeywords,
      score: analysis.score,
      pertinence: analysis.relevance
    });
    
    return analysis;
  }

  private analyzeExperience(experience: any, internshipKeywords: string[]): ExperienceAnalysis {
    console.log("=== ANALYSE DE L'EXPÉRIENCE ===");
    console.log("💼 Expérience à analyser:", {
      titre: experience.title,
      entreprise: experience.company,
      description: experience.description,
      compétences: experience.skills
    });
    console.log("🔑 Mots-clés du stage:", internshipKeywords);

    const description = experience.description.toLowerCase();
    const skills = experience.skills || [];
    
    // Recherche de correspondances dans la description
    const descriptionMatches = internshipKeywords.filter(k => 
      description.includes(k.toLowerCase())
    );
    
    // Recherche de correspondances dans les compétences
    const skillMatches = internshipKeywords.filter(k =>
      skills.some(s => s.toLowerCase().includes(k.toLowerCase()))
    );
    
    console.log("🔍 Correspondances trouvées:", {
      "Dans la description": descriptionMatches,
      "Dans les compétences": skillMatches
    });
    
    const matchingKeywords = Array.from(new Set([...descriptionMatches, ...skillMatches]));
    const score = matchingKeywords.length;
    const relevance = internshipKeywords.length > 0 ? 
      matchingKeywords.length / internshipKeywords.length : 
      0;

    const analysis = {
      relevance,
      matchingKeywords,
      skills,
      score: score * (relevance + 0.5)
    };

    console.log("📊 Résultat de l'analyse:", {
      motsClésCorrespondants: analysis.matchingKeywords,
      score: analysis.score,
      pertinence: analysis.relevance
    });
    
    return analysis;
  }

  private generateIntroduction(data: any): TemplateSection {
    const { internship, candidate } = data;
    const content = `Madame, Monsieur,

Je suis actuellement ${candidate.formation}, et je suis très intéressé(e) par l'offre de stage de ${internship.title} au sein de ${internship.company}. Votre entreprise ${internship.company} a particulièrement retenu mon attention par son expertise dans ${internship.domain || "le domaine"} et son engagement dans l'innovation technologique.`.trim();

    return {
      content,
      score: 1,
      keywords: [internship.domain]
    };
  }

  private generateSkillsSection(data: any): TemplateSection {
    const { internship, candidate } = data;
    const matchingSkills = candidate.skills.filter(skill => 
      internship.requirements.some(req => 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const content = `Ma formation en ${candidate.formation} et mes compétences techniques en ${matchingSkills.join(', ')} correspondent parfaitement aux exigences du poste. ${
      matchingSkills.length > 2 
        ? "Cette combinaison de compétences me permet d'avoir une approche complète et innovante dans mes projets."
        : ""
    }`.trim();

    return {
      content,
      score: matchingSkills.length / internship.requirements.length,
      keywords: matchingSkills
    };
  }

  private generateExperienceSection(data: any): TemplateSection {
    const experiences = data.candidate.experience
      .map(exp => this.analyzeExperience(exp, data.internship.keywords))
      .sort((a, b) => b.score - a.score);

    const bestExperience = experiences[0];
    const exp = data.candidate.experience[0];
    
    const content = bestExperience && exp ? `Au cours de mon expérience en tant que ${exp.title || 'Stage'} chez ${exp.company || 'Entreprise'}, j'ai pu développer des compétences essentielles${
      bestExperience.matchingKeywords.length > 0 
        ? ` en ${bestExperience.matchingKeywords.join(', ')}`
        : exp.skills.length > 0 
          ? ` en ${exp.skills.join(', ')}` 
          : ''
    }. Cette expérience m'a permis de comprendre les enjeux techniques et organisationnels d'un projet professionnel.`.trim() : '';

    return {
      content,
      score: bestExperience?.score || 0,
      keywords: bestExperience?.matchingKeywords || []
    };
  }

  private generateProjectsSection(data: any): TemplateSection {
    const projects = data.candidate.projects
      .map(proj => this.analyzeProject(proj, data.internship.keywords))
      .sort((a, b) => b.score - a.score);

    const bestProject = projects[0];
    const proj = data.candidate.projects[0];
    
    const content = bestProject && proj ? `J'ai notamment réalisé ${
      proj.name ? `le projet ${proj.name}` : 'un projet'
    }${
      proj.description ? ` ${proj.description}` : ''
    }${
      bestProject.matchingKeywords.length > 0
        ? ` utilisant ${bestProject.matchingKeywords.join(', ')}`
        : proj.technologies.length > 0
          ? ` utilisant ${proj.technologies.join(', ')}`
          : ''
    }. Ce projet m'a permis de mettre en pratique mes connaissances et de développer une expertise concrète dans ces technologies.`.trim() : '';

    return {
      content,
      score: bestProject?.score || 0,
      keywords: bestProject?.matchingKeywords || []
    };
  }

  private generateConclusion(data: any): TemplateSection {
    const { internship, candidate } = data;
    const content = `Je suis convaincu(e) que mon profil correspond aux attentes de ${internship.company} et je serais ravi(e) de pouvoir échanger avec vous lors d'un entretien pour vous présenter plus en détail ma motivation et mes compétences.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.


${candidate.fullName || ""}`.trim();

    return {
      content,
      score: 1,
      keywords: []
    };
  }

  generateMotivationLetter(data: any): string {
    console.log("=== GÉNÉRATION DE LA LETTRE DE MOTIVATION ===");
    console.log("📋 Données reçues:", {
      stage: {
        titre: data.internship.title,
        entreprise: data.internship.company,
        motsClés: data.internship.keywords,
        prérequis: data.internship.requirements
      },
      candidat: {
        nom: data.candidate.fullName,
        formation: data.candidate.formation,
        compétences: data.candidate.skills,
        expériences: data.candidate.experience.map(e => e.title),
        projets: data.candidate.projects.map(p => p.name)
      }
    });

    // Analyse des expériences et projets
    const experiences = data.candidate.experience
      .map(exp => this.analyzeExperience(exp, data.internship.keywords))
      .sort((a, b) => b.score - a.score);

    const projects = data.candidate.projects
      .map(proj => this.analyzeProject(proj, data.internship.keywords))
      .sort((a, b) => b.score - a.score);

    console.log("=== RÉSULTATS DE L'ANALYSE ===");
    console.log("💼 Expériences analysées:", experiences.map(e => ({
      motsClésCorrespondants: e.matchingKeywords,
      score: e.score,
      pertinence: e.relevance
    })));
    console.log("📂 Projets analysés:", projects.map(p => ({
      motsClésCorrespondants: p.matchingKeywords,
      score: p.score,
      pertinence: p.relevance
    })));

    // Génération des sections
    const template: LetterTemplate = {
      introduction: this.generateIntroduction(data),
      skills: this.generateSkillsSection(data),
      experience: this.generateExperienceSection(data),
      projects: this.generateProjectsSection(data),
      conclusion: this.generateConclusion(data)
    };

    console.log("=== SECTIONS DE LA LETTRE ===");
    console.log("📝 Sections générées:", {
      introduction: template.introduction.content.substring(0, 50) + "...",
      compétences: template.skills.content.substring(0, 50) + "...",
      expérience: template.experience.content.substring(0, 50) + "...",
      projets: template.projects.content.substring(0, 50) + "...",
      conclusion: template.conclusion.content.substring(0, 50) + "..."
    });

    // Construction de la lettre finale
    return [
      template.introduction.content,
      "\n\n",
      template.skills.content,
      "\n\n",
      template.experience.content,
      "\n\n",
      template.projects.content,
      "\n\n",
      template.conclusion.content
    ].filter(Boolean).join('');
  }
}
