'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useState } from 'react';
import AIAvatar from './AIAvatar';

const TypewriterText = () => {
  const controls = useAnimationControls();
  const [text, setText] = useState('');
  const fullText = "Hello, I'm PathFinder, your AI assistant to find the perfect internship at EFREI. Let me help you discover opportunities that match your skills and aspirations.";
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        controls.start({ opacity: 1 });
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <AIAvatar />
        <div className="flex-1 space-y-4">
          <motion.div 
            className="relative rounded-2xl rounded-tl-none border border-neutral-800 bg-neutral-900/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm leading-relaxed text-neutral-300">
              {text}
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-1 w-[2px] h-4 bg-neutral-400"
              />
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={controls}
            className="flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-neutral-700"
                animate={{
                  scale: [0.5, 1, 0.5],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TypewriterText;
