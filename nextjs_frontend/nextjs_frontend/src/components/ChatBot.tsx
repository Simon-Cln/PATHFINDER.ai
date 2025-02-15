import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';
import LoadingSpinner from './LoadingSpinner';
import CVViewer from './CVViewer';
import { motivationLetterService } from '../lib/llm/service';
import { extractName } from './CVViewer';

interface Message {
  type: 'bot' | 'user' | 'upload' | 'results';
  content: React.ReactNode | string;
  isTyping?: boolean;
}

interface ChatBotProps {
  setInternships: (internships: any[]) => void;
  setMatchRate: (rate: number) => void;
  setProfileCompletion: (completion: number) => void;
  setHasSearched: (searched: boolean) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  analysis: any;
  isLoading: boolean;
  cvContent?: string;
}

interface FileUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  buttonText: string;
  inputId: string;
}

const PathfinderLogo = () => (
  <svg height="14" strokeLinejoin="round" viewBox="0 0 16 16" width="14">
    <path d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z" fill="currentColor"></path>
    <path d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z" fill="currentColor"></path>
    <path d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z" fill="currentColor"></path>
  </svg>
);

const LoadingMessages = [
  "Je suis en train d'analyser votre CV pour trouver les meilleures opportunités de stage... ",
  "Je parcours les offres de stage qui correspondent à vos compétences... ",
  "J'évalue la pertinence de chaque opportunité par rapport à votre profil... ",
  "Je prépare un résumé détaillé des meilleures correspondances... "
];

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, buttonText, inputId }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        id={inputId}
        ref={inputRef}
        onChange={handleChange}
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
};

function ChatBot({ setInternships, setMatchRate, setProfileCompletion, setHasSearched, onFileUpload, analysis, isLoading, cvContent }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [bestMatchScore, setBestMatchScore] = useState<number | null>(null);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [showStageSelection, setShowStageSelection] = useState(false);
  const [selectedStage, setSelectedStage] = useState<any>(null);

  // Gestion du message de chargement rotatif
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % LoadingMessages.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Gestion de l'upload de fichier avec message
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Ajouter le message d'upload
      setMessages(prev => [...prev, {
        type: 'upload',
        content: `Uploading: ${e.target.files![0].name}`,
      }]);

      // Démarrer l'affichage des messages de chargement
      let messageIndex = 0;
      const displayNextMessage = () => {
        if (messageIndex < LoadingMessages.length) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: LoadingMessages[messageIndex],
            isTyping: true
          }]);
          messageIndex++;
          setTimeout(displayNextMessage, 2000); // Afficher un nouveau message toutes les 2 secondes
        }
      };
      
      displayNextMessage();
      await onFileUpload(e);
    }
  };

  // Message initial
  useEffect(() => {
    if (!welcomeShown) {
      setMessages([{
        type: 'bot',
        content: "Dear EFREI student, I am PathFinder, an assistant dedicated to helping you land your dream internship based on your skills and aspirations. Let's start by analyzing your CV to find the perfect match for you!",
        isTyping: true
      }]);
      setWelcomeShown(true);
    }
  }, [welcomeShown]);

  // Affichage du bouton d'upload
  useEffect(() => {
    if (isTypingComplete && !hasUploaded) {
      setMessages(prev => {
        const hasUploadMessage = prev.some(msg => msg.type === 'upload');
        if (hasUploadMessage) return prev;

        return [...prev, {
          type: 'upload',
          content: (
            <div className="message upload">
              <div className="upload-zone">
                <div className="flex flex-col items-center p-4">
                  <FileUpload 
                    onUpload={handleFileUpload} 
                    buttonText="Select your CV" 
                    inputId="initial-upload"
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 transition-all duration-200 font-ppmori text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2 font-ppmori">
                    Formats : PDF, DOC, DOCX, TXT
                  </p>
                </div>
              </div>
            </div>
          )
        }];
      });
    }
  }, [isTypingComplete, hasUploaded, handleFileUpload]);

  // Gestion de l'analyse du CV
  useEffect(() => {
    if (analysis && !isLoading) {
      const matchCount = analysis.internships?.length || analysis.matches?.length || 0;
      const matches = analysis.matches || analysis.internships || [];
      const domain = analysis?.analysis?.domain;
      console.log("Analyse complète reçue:", analysis);
      console.log("Structure complète de analysis:", JSON.stringify(analysis, null, 2));
      console.log("Domain détecté:", domain);
      console.log("Est-ce que c'est Other?:", domain === "Other");
      console.log("Données des stages reçues:", matches);
      
      setMessages(prev => {
        const baseMessages = prev.filter(msg => msg.type !== 'upload' && msg.type !== 'results');
        
        return [
          ...baseMessages,
          {
            type: 'results',
            content: (
              <div className="results-summary">
                <h3>Analyse de votre CV terminée !</h3>
                {console.log("Avant la condition Other - domain:", domain)}
                {domain === "Other" && (
                  <div className="my-4 p-4 bg-gray-50 rounded-lg text-gray-700">
                    <p>I am a bot designed to help Efrei students find technical internships. Your CV seems to match a non-technical domain (Other). I'm sorry, but I cannot offer you adapted internships.</p>
                  </div>
                )}
                {cvContent && (
                  <div className="cv-preview my-6 bg-white rounded-lg p-6 border border-gray-200">
                    <CVViewer cvContent={cvContent} />
                  </div>
                )}
                {matches.map((internship: any, index: number) => {
                  console.log("Stage en cours:", internship);
                  console.log("Score brut:", internship.score);
                  
                  // Nettoyer le score en enlevant le % et en convertissant en nombre
                  const rawScore = internship.score?.toString().replace('%', '') || '0';
                  const numericScore = parseFloat(rawScore) / 100;
                  console.log("Score nettoyé:", numericScore);
                  
                  const scorePercentage = Math.round(numericScore);
                  console.log("Pourcentage calculé:", scorePercentage);
                  
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h5 className="font-tt-ramillas font-bold text-xl text-blue-600 mb-1">{internship.title}</h5>
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="font-semibold text-lg">{internship.company}</span>
                              {internship.location && (
                                <span className="text-gray-500 flex items-center">
                                  • <svg className="w-4 h-4 ml-1 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  {internship.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-semibold whitespace-nowrap">
                              {scorePercentage}% match
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {internship.duration && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                              ⏱️ {internship.duration}
                            </span>
                          )}
                          {internship.domain && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm">
                              🎯 {internship.domain}
                            </span>
                          )}
                        </div>
                        {internship.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {internship.description}
                          </p>
                        )}
                        {internship.required_skills && internship.required_skills.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-semibold text-gray-600">Compétences requises</span>
                            <div className="flex flex-wrap gap-1.5">
                              {internship.required_skills.map((skill: string, skillIndex: number) => (
                                <span key={skillIndex} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={() => generateMotivationLetter(internship)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md font-ppmori text-sm"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Generate a cover letter template</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        ];
      });

      setInternships(matches);
      setMatchRate(matches[0] ? Math.round((matches[0].score || matches[0].matching_score || 0) * 100) / 100 : 0);
      setProfileCompletion(analysis.profile_completion || 0);
      setHasSearched(true);
    }
  }, [analysis, isLoading, setHasSearched, setInternships, setMatchRate, setProfileCompletion, cvContent]);

  const extractCVInfo = (cvContent: string | null | undefined) => {
    if (!cvContent) {
      console.log("Pas de contenu CV à analyser");
      return null;
    }

    // Initialiser l'objet info avec des tableaux vides
    const info = {
      formation: '',
      skills: [] as string[],
      experience: [] as Array<{
        title: string;
        description: string;
        skills: string[];
        duration: string;
      }>,
      projects: [] as Array<{
        name: string;
        description: string;
        technologies: string[];
      }>
    };

    try {
      const lines = cvContent.split('\n').map(line => line?.trim() || '');
      console.log("Lignes du CV:", lines);

      // Extraire la formation de la première ligne
      const firstLine = lines[0] || '';
      if (firstLine.includes('Data') || firstLine.includes('AI') || firstLine.includes('EFREI')) {
        info.formation = firstLine;
      }

      // Extraire les compétences techniques
      const techLine = lines.find(line => 
        line?.toLowerCase().includes('machine learning') || 
        line?.toLowerCase().includes('deep learning') ||
        line?.toLowerCase().includes('data')
      );
      
      if (techLine) {
        const techSkills = techLine.split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
        info.skills = [...info.skills, ...techSkills];
      }

      let currentSection = '';
      let currentItem: typeof info.experience[0] | typeof info.projects[0] | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || '';
        
        // Détecter les sections
        if (line.toUpperCase() === 'FORMATION') {
          currentSection = 'formation';
          currentItem = null;
        } else if (line.toUpperCase() === 'COMPÉTENCES' || line.toUpperCase() === 'COMPETENCES' || line.toUpperCase() === 'SKILLS') {
          currentSection = 'skills';
          currentItem = null;
        } else if (line.toUpperCase() === 'EXPÉRIENCE' || line.toUpperCase() === 'EXPERIENCE' || line.toUpperCase() === 'EXPÉRIENCES PROFESSIONNELLES') {
          currentSection = 'experience';
          currentItem = null;
        } else if (line.toUpperCase() === 'PROJETS' || line.toUpperCase() === 'PROJECTS' || line.toUpperCase() === 'PROJETS ACADÉMIQUES') {
          currentSection = 'projects';
          currentItem = null;
        } else if (line) {
          switch (currentSection) {
            case 'formation':
              if (line.includes('Master') || line.includes('EFREI') || line.includes('Data') || line.includes('AI')) {
                info.formation = line.replace(/\[.*?\]/g, '').trim();
              }
              break;

            case 'skills':
              if (!line.includes(':') && !line.includes('[') && line.length > 3) {
                const skills = line.split(/[,.]/)
                  .map(s => s?.trim() || '')
                  .filter(s => s.length > 0);
                info.skills = [...info.skills, ...skills];
              }
              break;

            case 'experience':
              if (line.match(/^[-•]|^\d+\./) || line.includes('202')) {
                if (currentItem && 'title' in currentItem) {
                  info.experience.push(currentItem as typeof info.experience[0]);
                }
                currentItem = {
                  title: line.replace(/^[-•\d.]/, '').trim(),
                  description: '',
                  skills: [],
                  duration: ''
                };

                const dateMatch = line.match(/(20\d{2}|[1-9] mois)/);
                if (dateMatch) {
                  currentItem.duration = dateMatch[0];
                }
              } else if (currentItem && 'title' in currentItem) {
                const techWords = line.match(/\b(Python|R|SQL|Machine Learning|Deep Learning|NLP|[A-Z][a-z]*)\b/g);
                if (techWords) {
                  currentItem.skills = [...currentItem.skills, ...techWords];
                }
                currentItem.description += ' ' + line;
              }
              break;

            case 'projects':
              // Détecter un nouveau projet
              if (line && !line.startsWith('(') && line.length > 10) {
                if (currentItem && 'name' in currentItem) {
                  info.projects.push(currentItem as typeof info.projects[0]);
                }
                // Séparer le titre des technologies (entre parenthèses)
                const [title, techPart] = line.split(/\s*\(/);
                currentItem = {
                  name: title.replace(/^[-•\d.]/, '').trim(),
                  description: '',
                  technologies: []
                };
                
                // Extraire les technologies des parenthèses
                if (techPart) {
                  const techs = techPart
                    .replace(/\)$/, '')  // Enlever la parenthèse finale
                    .split(/[,\s]+/)     // Séparer par virgule ou espace
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                  currentItem.technologies = [...techs];
                }
              } else if (currentItem && 'name' in currentItem) {
                // Si c'est une ligne de description
                if (!line.includes('(') && !line.includes(')')) {
                  currentItem.description += (currentItem.description ? ' ' : '') + line;
                }
                // Détecter des technologies supplémentaires dans la description
                const techWords = line.match(/\b(Python|R|SQL|Machine Learning|Deep Learning|NLP|[A-Z][a-z]+)\b/g);
                if (techWords) {
                  currentItem.technologies = [...new Set([...currentItem.technologies, ...techWords])];
                }
              }
              break;
          }
        }
      }

      // Ajouter le dernier item
      if (currentItem) {
        if (currentSection === 'experience' && 'title' in currentItem) {
          info.experience.push(currentItem as typeof info.experience[0]);
        } else if (currentSection === 'projects' && 'name' in currentItem) {
          info.projects.push(currentItem as typeof info.projects[0]);
        }
      }

      // Nettoyer et dédupliquer les skills
      const allSkills = new Set([
        ...info.skills,
        ...info.experience.flatMap(e => e.skills),
        ...info.projects.flatMap(p => p.technologies)
      ].filter(s => s && s.length > 0));

      info.skills = Array.from(allSkills);

      console.log("Informations extraites du CV:", info);
      return info;
    } catch (error) {
      console.error("Erreur lors de l'extraction des informations du CV:", error);
      return null;
    }
  };

  const generateMotivationLetter = async (internship: any) => {
    setMessages(prev => [...prev, {
      type: 'bot',
      content: "Je génère une lettre de motivation personnalisée pour ce stage...",
      isTyping: true
    }]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const displayName = cvContent ? extractName(cvContent) : "";
      const cvInfo = cvContent ? extractCVInfo(cvContent) : null;
      
      console.log("=== DONNÉES DU CV AVANT TRAITEMENT ===");
      console.log("📝 Contenu brut du CV:", cvContent);
      console.log("👤 Nom extrait:", displayName);
      console.log("🎓 Formation:", cvInfo?.formation || analysis?.formation);
      console.log("🔧 Compétences:", {
        "Du CV": cvInfo?.skills || analysis?.skills || [],
        "Des projets": cvInfo?.projects?.map(p => p.technologies || []).flat() || [],
        "Des expériences": cvInfo?.experience?.map(e => e.skills || []).flat() || []
      });

      // Fusionner toutes les compétences
      const allSkills = Array.from(new Set([
        ...(cvInfo?.skills || []),
        ...(cvInfo?.projects?.map(p => p.technologies || []).flat() || []),
        ...(cvInfo?.experience?.map(e => e.skills || []).flat() || [])
      ])).filter(skill => skill && skill.length > 0);

      // Préparer les données du CV
      const userCV = {
        fullName: displayName || "Prénom NOM",
        formation: cvInfo?.formation || analysis?.formation || "étudiant en Master Data & AI",
        skills: allSkills,
        experience: cvInfo?.experience?.map(exp => ({
          title: exp.title || "",
          company: exp.company || "VEOLIA",
          description: exp.description || "Stage en data science",
          skills: exp.skills || [],
          duration: exp.duration || "6 mois"
        })) || [],
        projects: cvInfo?.projects?.map(proj => ({
          name: proj.name || "",
          description: proj.description || "",
          technologies: proj.technologies || []
        })) || []
      };

      // S'assurer qu'il y a au moins une expérience
      if (userCV.experience.length === 0) {
        userCV.experience = [{
          title: "Stage Data Scientist",
          company: "VEOLIA",
          description: "Stage en data science et analyse de données",
          skills: userCV.skills,
          duration: "6 mois"
        }];
      }

      // S'assurer qu'il y a au moins un projet
      if (userCV.projects.length === 0) {
        userCV.projects = [{
          name: "Projet d'analyse de données",
          description: "Développement d'une application d'analyse de données avec machine learning",
          technologies: userCV.skills
        }];
      }

      console.log("=== DONNÉES POUR LA LETTRE ===");
      console.log("Stage:", internship);
      console.log("CV:", userCV);

      const letter = await motivationLetterService.generateTemplate(
        internship,
        allSkills,
        userCV
      );

      // Mettre à jour les messages avec la lettre générée
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, {
          type: 'bot',
          content: (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-tt-ramillas text-xl font-bold text-gray-900">
                  Lettre de Motivation <span className="text-sm font-normal text-gray-500">(Non générée par humain)</span>
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(letter);
                    alert('Lettre de motivation copiée dans le presse-papier !');
                  }}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3m3-3v12" />
                  </svg>
                  Copier
                </button>
              </div>
              <div className="whitespace-pre-wrap font-ppmori text-gray-700 leading-relaxed">
                <TypewriterEffect 
                  text={letter}
                  speed={10}
                  onComplete={() => {
                    setMessages(prev => prev.map((msg, i) => 
                      i === prev.length - 1 ? { ...msg, isTyping: false } : msg
                    ));
                  }}
                />
              </div>
            </div>
          ),
          isTyping: true
        }];
      });

    } catch (error) {
      console.error("Erreur lors de la génération de la lettre:", error);
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isTyping);
        return [...newMessages, {
          type: 'bot',
          content: "Désolé, une erreur est survenue lors de la génération de la lettre. Veuillez réessayer."
        }];
      });
    }
  };

  // Scroll automatique
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-tt-ramillas font-bold text-gray-900">Chat with PathFinder</h2>
            <p className="text-sm font-ppmori text-gray-500">Find your perfect internship match</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-tt-ramillas font-bold text-blue-600">
              {bestMatchScore !== null ? `${(bestMatchScore * 100).toFixed(1)}%` : 'NaN%'}
            </div>
            <div className="text-sm font-ppmori text-gray-500">Best Match</div>
            <div className="text-xs font-ppmori text-gray-400">Matching score</div>
          </div>
        </div>
      </div>
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.type === 'bot' && (
              <div className="bot-avatar">
                <svg height="14" strokeLinejoin="round" viewBox="0 0 16 16" width="14">
                  <path d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z" fill="currentColor"></path>
                  <path d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z" fill="currentColor"></path>
                  <path d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z" fill="currentColor"></path>
                </svg>
              </div>
            )}
            <div className="message-content">
              {message.type === 'bot' && message.isTyping && typeof message.content === 'string' ? (
                <TypewriterEffect 
                  text={message.content} 
                  speed={20}
                  className="text-gray-900 font-medium"
                  onComplete={() => {
                    if (index === 0) setIsTypingComplete(true);
                    setMessages(prev => prev.map((msg, i) => 
                      i === index ? { ...msg, isTyping: false } : msg
                    ));
                  }}
                />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatBot;
