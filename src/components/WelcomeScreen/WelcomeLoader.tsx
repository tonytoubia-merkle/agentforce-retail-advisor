import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
  'Studying your beauty profile\u2026',
  'Reviewing your recent favorites\u2026',
  'Curating personalized picks\u2026',
  'Preparing your experience\u2026',
  'Setting the scene\u2026',
];

export const WelcomeLoader: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
    >
      {/* Subtle shimmer bar */}
      <div className="w-48 h-[2px] rounded-full overflow-hidden mb-10 bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '50%' }}
        />
      </div>

      {/* Cycling status message */}
      <div className="h-8 relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="text-white/60 text-sm font-light tracking-wide text-center"
          >
            {LOADING_MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
