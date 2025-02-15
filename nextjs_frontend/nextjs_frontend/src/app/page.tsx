'use client';

import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import Background from '@/components/Background';
import LoadingState from '@/components/LoadingState';
import InternshipCarousel from '@/components/InternshipCarousel';
import TypewriterText from '@/components/TypewriterText';
import ChatBot from '@/components/ChatBot';
import { motion, AnimatePresence } from 'framer-motion';

interface Internship {
  title: string;
  company: string;
  location: string;
  duration: string;
  description: string;
  required_skills: string[];
  score: number;
  match_details: {
    semantic_similarity: number;
    skills_match: number;
    domain_relevance: number;
  };
}

interface Analysis {
  message: string;
  advice: string;
  internships: Internship[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [cvContent, setCvContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasSearched, setHasSearched] = useState(false);
  const [matchRate, setMatchRate] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      setCvContent(text);
      
      const response = await fetch('http://localhost:5000/analyze_cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cv_text: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze CV');
      }

      const data = await response.json();
      setAnalysis(data);
      
      // Mettre à jour les internships
      if (data.matches) {
        setInternships(data.matches);
      } else if (data.internships) {
        setInternships(data.internships);
      }

      // Calculer et mettre à jour les statistiques
      if (data.matches || data.internships) {
        const matches = data.matches || data.internships;
        const avgMatchRate = matches.reduce((acc: number, curr: Internship) => 
          acc + (curr.score || 0), 0) / matches.length;
        
        setMatchRate(Math.round(avgMatchRate * 100));
        setProfileCompletion(85); // On peut ajuster ce calcul en fonction des champs remplis dans le CV
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[--background]">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        matchRate={matchRate}
        profileCompletion={profileCompletion}
        hasSearched={hasSearched}
      />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-col items-start gap-4 mb-8 fade-up">
                <h1 className="font-tt-ramillas text-4xl font-bold text-gray-900">Dashboard</h1>
                <p className="font-ppmori text-xl text-gray-600">Chat with PathFinder to find your perfect internship match</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="stat-card"
                >
                  <div className="stat-icon bg-[--accent-light]">
                    <svg className="w-5 h-5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-value">{internships.length || 5}</h3>
                    <p className="stat-label">Total Matches</p>
                    <span className="stat-caption">Internships found</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="stat-card"
                >
                  <div className="stat-icon bg-[--accent-light]">
                    <svg className="w-5 h-5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-value">{matchRate}%</h3>
                    <p className="stat-label">Best Match</p>
                    <span className="stat-caption">Matching score</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="stat-card"
                >
                  <div className="stat-icon bg-[--accent-light]">
                    <svg className="w-5 h-5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-value">{profileCompletion}%</h3>
                    <p className="stat-label">Profile Strength</p>
                    <span className="stat-caption">Based on your CV</span>
                  </div>
                </motion.div>
              </div>

              <AnimatePresence>
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <ChatBot 
                      setInternships={setInternships} 
                      setMatchRate={setMatchRate}
                      setProfileCompletion={setProfileCompletion}
                      setHasSearched={setHasSearched}
                      onFileUpload={handleFileUpload}
                      analysis={analysis}
                      isLoading={isLoading}
                      cvContent={cvContent}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {activeTab === 'matches' && (
            <div>
              <h1 className="heading-1 mb-8">Your Matches</h1>
              {analysis && internships.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ... le reste du code pour l'onglet matches ... */}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h1 className="heading-1 mb-8">Settings</h1>
              <div className="card">
                <h2 className="heading-3 mb-6">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text" className="input" placeholder="Enter your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" className="input" placeholder="Enter your email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Location</label>
                    <input type="text" className="input" placeholder="Enter preferred location" />
                  </div>
                  <button className="button">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
