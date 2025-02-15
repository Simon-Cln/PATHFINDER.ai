'use client';

import React from 'react';

interface MatchDetails {
  semantic_similarity: number;
  skills_match: number;
  domain_relevance: number;
}

interface Internship {
  title: string;
  company: string;
  location: string;
  duration: string;
  description: string;
  required_skills: string[];
  score: number;
  match_details: MatchDetails;
}

interface InternshipListProps {
  internships: Internship[];
  visible: boolean;
}

const InternshipList: React.FC<InternshipListProps> = ({ internships, visible }) => {
  if (!visible || !internships.length) return null;

  return (
    <div className="mt-8 p-8 bg-white rounded-lg shadow-lg max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Stages recommandés</h2>
      <div className="space-y-6">
        {internships.map((internship, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  {internship.title}
                </h3>
                <p className="text-gray-600 mb-1">{internship.company}</p>
                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {internship.location}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {internship.duration}
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                {Math.round(internship.score * 100)}% match
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 line-clamp-3">
              {internship.description}
            </p>
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Compétences requises :</h4>
              <div className="flex flex-wrap gap-2">
                {internship.required_skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Détails de la correspondance :</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Similarité sémantique</p>
                  <p className="font-semibold">{Math.round(internship.match_details.semantic_similarity * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Correspondance des compétences</p>
                  <p className="font-semibold">{Math.round(internship.match_details.skills_match * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Pertinence du domaine</p>
                  <p className="font-semibold">{Math.round(internship.match_details.domain_relevance * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternshipList;
