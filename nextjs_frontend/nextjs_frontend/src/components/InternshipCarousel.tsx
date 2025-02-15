'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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

interface Props {
  internships: Internship[];
}

const InternshipCarousel = ({ internships }: Props) => {
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    const newPage = page + newDirection;
    if (newPage >= 0 && newPage < internships.length) {
      setPage([newPage, newDirection]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const internship = internships[page];

  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      {/* Navigation */}
      <div className="absolute left-4 right-4 top-4 z-10 flex justify-between">
        <motion.button
          onClick={() => paginate(-1)}
          className="group rounded-lg border border-neutral-800 bg-neutral-900/50 p-2 text-neutral-400 backdrop-blur-sm transition-all hover:border-neutral-700 hover:text-neutral-200"
          disabled={page === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-400 backdrop-blur-sm">
          {page + 1} / {internships.length}
        </div>
        <motion.button
          onClick={() => paginate(1)}
          className="group rounded-lg border border-neutral-800 bg-neutral-900/50 p-2 text-neutral-400 backdrop-blur-sm transition-all hover:border-neutral-700 hover:text-neutral-200"
          disabled={page === internships.length - 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0 flex items-center justify-center px-8"
        >
          <div className="w-full space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-light tracking-tight text-white">{internship.title}</h3>
                  <p className="text-sm text-neutral-400">{internship.company}</p>
                </div>
                <motion.div 
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900 text-lg font-light text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {Math.round(internship.score * 100)}%
                </motion.div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-neutral-400">
                <span>{internship.location}</span>
                <span className="h-1 w-1 rounded-full bg-neutral-700" />
                <span>{internship.duration}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium uppercase tracking-wider text-neutral-500">Description</h4>
              <p className="text-sm leading-relaxed text-neutral-300">{internship.description}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium uppercase tracking-wider text-neutral-500">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {internship.required_skills.map((skill, i) => (
                  <motion.span
                    key={i}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-400"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium uppercase tracking-wider text-neutral-500">Match Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
                    <motion.div
                      className="h-full bg-neutral-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(internship.match_details.semantic_similarity * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Semantic</span>
                    <span className="text-neutral-400">{Math.round(internship.match_details.semantic_similarity * 100)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
                    <motion.div
                      className="h-full bg-neutral-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(internship.match_details.skills_match * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Skills</span>
                    <span className="text-neutral-400">{Math.round(internship.match_details.skills_match * 100)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
                    <motion.div
                      className="h-full bg-neutral-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(internship.match_details.domain_relevance * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Domain</span>
                    <span className="text-neutral-400">{Math.round(internship.match_details.domain_relevance * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InternshipCarousel;
