import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import AIAvatar from './AIAvatar';
import PdfViewer from './PdfViewer';
import '../styles/hero.css';
import '../styles/PdfViewer.css';

interface Message {
  type: 'user' | 'bot';
  content: string;
  pdfData?: {
    filename: string;
    data: string;
  };
  internships?: any[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Bonjour! Je suis votre assistant CV. Je peux vous aider à analyser votre CV et vous donner des conseils personnalisés.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [cvText, setCvText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      // Lire le fichier comme ArrayBuffer d'abord
      const buffer = await file.arrayBuffer();
      // Convertir en base64
      const base64Content = btoa(
        new Uint8Array(buffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Ajouter le préfixe MIME approprié
      const mimePrefix = file.type === 'application/pdf' 
        ? 'data:application/pdf;base64,'
        : 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,';
      
      const finalContent = mimePrefix + base64Content;

      // Envoyer le contenu base64 au backend
      const response = await fetch('http://localhost:5000/analyze_cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cv: finalContent
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Ajouter le message de l'utilisateur avec le nom du fichier
        setMessages(prev => [...prev, {
          type: 'user',
          content: `J'ai uploadé mon CV: ${file.name}`
        }]);

        // Ajouter d'abord le message de génération
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Je génèreeeeee une lettre de motivation personnalisée pour ce stage...'
        }]);

        // Attendre 1.5 secondes avant d'afficher la lettre
        setTimeout(() => {
          // Créer le contenu du message avec les stages
          const stagesList = data.matches.map((match: any) => 
            `${match.title}\n${match.score ? Math.round(match.score * 100) : 'N/A'}% Match\n${match.company} • ${match.location}\n${match.description}\n\n${match.required_skills.join('\n')}\n`
          ).join('\n---\n\n');

          // Ajouter la réponse du bot
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `${data.message}\n\nVotre CV correspond au domaine ${data.analysis.domain}.\n\n${stagesList}`
          }]);
        }, 1500);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: data.error || "Une erreur s'est produite lors de l'analyse du CV."
        }]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "Désolé, une erreur s'est produite lors de l'analyse de votre CV. Veuillez vérifier que le fichier est un PDF valide et réessayer."
      }]);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!cvText.trim()) return;

    setMessages(prev => [...prev, { type: 'user', content: cvText }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/analyze_cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cv: cvText }),
      });

      const data = await response.json();

      if (data.success) {
        // Ajouter d'abord le message de génération
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Je génèreeeeee une lettre de motivation personnalisée pour ce stage...'
        }]);

        // Attendre 1.5 secondes avant d'afficher la lettre
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `Lettre de Motivation (Non générée par humain)\nCopier\n\n${data.message}\n\n${data.analysis ? `Analyse :\n${JSON.stringify(data.analysis, null, 2)}\n\n` : ''}${data.matches ? `Stages recommandés :\n${data.matches.map((match: any) => 
              `${match.title} - ${match.company} (Score: ${match.score}%)`
            ).join('\n')}` : ''}`
          }]);
        }, 1500);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: data.error || "Une erreur s'est produite lors de l'analyse."
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "Désolé, une erreur s'est produite lors de l'analyse de votre CV."
      }]);
    }

    setLoading(false);
    setCvText('');
  };

  return (
    <div className="container is-wide">
      <div className="hero_body">
        <div className="hero_content">
          <div className="hero_left">
            <div className="u-text-ligh-400">
              <div className="kicker color-current is-home">
                <div className="eyebrow-md u-mb-0 color-current is-home">XLS</div>
                <div className="kicker-path">
                  <div className="kicker_line color-current is-home"></div>
                  <div className="kicker-plane color-current is-home">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 15" width="100%">
                      <path d="M0.0199581 3.8732C0.0095118 3.81065 0.0577426 3.7537 0.121158 3.7537L0.652631 3.7537C0.6814 3.7537 0.708847 3.76578 0.728281 3.78699L3.08289 6.35694C3.10232 6.37815 3.12977 6.39023 3.15854 6.39023L6.05767 6.39023C6.12533 6.39023 6.17447 6.32588 6.15665 6.26061L4.48321 0.129618C4.46539 0.0643445 4.51452 0 4.58219 0L5.66139 0C5.69351 0 5.72377 0.0150377 5.74317 0.0406346L10.5542 6.38954C10.5545 6.38997 10.555 6.39023 10.5555 6.39023L15.2859 6.39023C15.8988 6.39023 16.3956 6.88709 16.3956 7.5C16.3956 8.11291 15.8988 8.60977 15.2859 8.60977L10.5555 8.60977C10.555 8.60977 10.5545 8.61003 10.5542 8.61046L5.74317 14.9594C5.72377 14.985 5.69351 15 5.66139 15L4.58219 15C4.51452 15 4.46539 14.9357 4.48321 14.8704L6.15665 8.73939C6.17447 8.67412 6.12533 8.60977 6.05767 8.60977L3.15854 8.60977C3.12977 8.60977 3.10232 8.62185 3.08289 8.64306L0.728281 11.213C0.708847 11.2342 0.6814 11.2463 0.652631 11.2463L0.121158 11.2463C0.0577426 11.2463 0.00951179 11.1893 0.0199581 11.1268L0.622844 7.5169C0.624713 7.50571 0.624713 7.49429 0.622844 7.4831L0.0199581 3.8732Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
                <div className="eyebrow-md u-mb-0 color-current is-home">RNW</div>
              </div>
            </div>
            <div className="hero_heading">
              <h1 className="hero-title">Optimisez votre CV avec l'IA</h1>
            </div>
            <div className="hero_descr">
              <p>Get personalized feedback on your resume and discover opportunities that match your profile.</p>
            </div>
          </div>
          
          <div className="hero_right">
            <div className="hero_window">
              <div className="hero_frame">
                <div className="messages-container">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      className={`message ${message.type}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {message.type === 'bot' && <AIAvatar />}
                      <div className="message-content">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                        {message.pdfData && (
                          <PdfViewer pdfData={message.pdfData} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      className="message bot"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <AIAvatar />
                      <div className="message-content">
                        <p>Analyse en cours...</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="hero_frame-border">
                <svg width="100%" height="100%" viewBox="0 0 293 458" fill="none">
                  <g clipPath="url(#clip0_1863_28375)">
                    <g filter="url(#filter0_i_1863_28375)">
                      <path d="M291 146.5C291 66.6949 226.305 2 146.5 2C66.6949 2 2 66.6949 2 146.5V311.5C2 391.305 66.6949 456 146.5 456C226.305 456 291 391.305 291 311.5V146.5Z" stroke="url(#paint0_linear_1863_28375)" strokeWidth="4"/>
                    </g>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_1863_28375" x1="146.5" y1="4" x2="146.5" y2="454" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E0DEDE"/>
                      <stop offset="1" stopColor="white"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="input-container">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button 
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Upload PDF
          </button>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Ou collez le texte de votre CV ici..."
            rows={4}
          />
          <button onClick={handleSubmit} disabled={loading || !cvText.trim()}>
            Analyser
          </button>
        </div>
      </div>
    </div>
  );
}
