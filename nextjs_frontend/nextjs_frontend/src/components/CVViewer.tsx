import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CVViewerProps {
  cvContent: string;
  fileName: string;
}

export const extractName = (cvContent: string): string => {
  // Diviser le contenu en lignes et prendre les 5 premières lignes non vides
  const lines = cvContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 5);
  
  console.log("Premières lignes du CV:", lines); // Debug
  
  for (const line of lines) {
    // Nettoyer la ligne
    let cleanLine = line
      .replace(/\|.*$/g, '') // Enlever tout ce qui suit un |
      .replace(/[0-9+@\(\)]/g, '') // Enlever les chiffres, +, @, parenthèses
      .replace(/\s*[-–]\s*/g, ' ') // Remplacer les tirets par des espaces
      .replace(/\[.*?\]/g, '') // Enlever [Email], [Téléphone], etc.
      .replace(/^M[12]\s+[-–]\s+/i, '') // Enlever "M1 - " ou "M2 - "
      .replace(/^Stage\s+[-–]\s+/i, '') // Enlever "Stage - "
      .trim();

    console.log("Ligne nettoyée:", cleanLine); // Debug

    // Ignorer les lignes qui commencent par des mots clés courants
    if (/^(etudiant|formation|master|stage|cv|curriculum|vitae|profil|about|summary|actuellement)/i.test(cleanLine)) {
      continue;
    }

    // Ignorer les lignes avec des mots clés de section
    if (/^(competences|skills|experience|education|contact|projects|langues|languages|summary|profile)/i.test(cleanLine)) {
      continue;
    }

    // Découper en mots
    const words = cleanLine.split(/\s+/);
    console.log("Mots trouvés:", words); // Debug
    
    // Vérifier chaque mot
    const validWords = words.filter(word => {
      // Ignorer les mots vides
      if (!word) return false;

      // Ignorer les mots trop courts ou trop longs
      if (word.length < 2 || word.length > 20) return false;

      // Ignorer les mots qui sont des stopwords
      if (/^(le|la|les|de|du|des|en|dans|par|pour|sur|avec|sans|et|ou|un|une|ce|cette|ces|mon|ma|mes)$/i.test(word)) {
        return false;
      }

      // Accepter les mots qui :
      // - Commencent par une majuscule
      // - Peuvent contenir des lettres majuscules au milieu (pour les noms composés)
      // - Peuvent contenir des accents
      // - Peuvent contenir des tirets
      const isValid = /^[A-ZÀ-Ý][A-Za-zÀ-ÿ-]*$/.test(word);
      console.log(`Mot "${word}" est valide:`, isValid); // Debug
      return isValid;
    });

    console.log("Mots valides trouvés:", validWords); // Debug

    // Si on trouve 2 ou 3 mots valides au début de la ligne
    if (validWords.length >= 2 && validWords.length <= 4) {
      const result = validWords.slice(0, 3).join(' ');
      console.log("Nom final extrait:", result); // Debug
      return result;
    }
  }
  
  console.log("Aucun nom trouvé"); // Debug
  return ''; // Retourner une chaîne vide si aucun nom n'est trouvé
};

const formatCV = (content: string): string => {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
};

const CVViewer: React.FC<CVViewerProps> = ({ cvContent, fileName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = extractName(cvContent);
  const formattedContent = formatCV(cvContent);

  return (
    <>
      {/* Miniature du CV */}
      <div 
        onClick={() => setIsOpen(true)}
        className="mt-4 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:shadow-xl transition-all duration-300 max-w-sm overflow-hidden hover:scale-[1.02] group"
      >
        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                CV
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Cliquez pour voir le CV complet
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu du contenu */}
        <div className="p-4">
          <div className="text-sm text-gray-600 leading-relaxed">
            {displayName || 'CV sans nom'}
          </div>
        </div>
      </div>

      {/* Modal pour afficher le CV en grand */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay avec flou */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* En-tête */}
              <div className="sticky top-0 flex justify-between items-center p-4 bg-white border-b border-gray-200 backdrop-blur-xl bg-white/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">CV</h3>
                    <div className="text-sm text-gray-500">Curriculum Vitae</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                >
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu du CV */}
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-8">
                    {formattedContent.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CVViewer;
