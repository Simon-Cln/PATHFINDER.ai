'use client';

import { motion } from 'framer-motion';

const LoadingState = () => {
  const loadingSteps = [
    "Analyzing your CV...",
    "Identifying key skills...",
    "Matching with internships...",
    "Preparing recommendations..."
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      <div className="relative">
        <svg className="w-24 h-24" viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-900/10"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-900/50"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </svg>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-12 h-12 text-gray-900/70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </motion.div>
      </div>

      <div className="space-y-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {loadingSteps.map((step, index) => (
            <motion.p
              key={step}
              className="text-lg font-medium text-gray-900/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 1.5,
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: loadingSteps.length * 1.5 - 0.5
              }}
            >
              {step}
            </motion.p>
          ))}
        </motion.div>

        <motion.div 
          className="flex justify-center space-x-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-gray-900/30"
              variants={{
                hidden: { scale: 0 },
                visible: {
                  scale: [0, 1, 0],
                  transition: {
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }
                }
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingState;
