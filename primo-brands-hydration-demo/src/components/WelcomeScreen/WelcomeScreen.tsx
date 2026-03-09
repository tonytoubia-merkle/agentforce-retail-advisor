import { motion } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';

export const WelcomeScreen: React.FC = () => {
  const { scene, dismissWelcome } = useScene();
  const { welcomeData } = scene;

  if (!welcomeData) return null;

  // If the agent sent a long message, demote it to subtext and use a short fallback headline
  let headline = welcomeData.message;
  let subtext = welcomeData.subtext;
  if (headline && headline.length > 40) {
    subtext = headline + (subtext ? ` ${subtext}` : '');
    // Extract a short greeting if possible (up to first punctuation)
    const short = headline.match(/^[^.!?]+[.!?]/)?.[0];
    headline = short && short.length <= 40 ? short : 'Welcome!';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-40 flex items-center justify-center cursor-pointer"
      onClick={dismissWelcome}
    >
      {/* Radial scrim — strongest behind centered text, fades at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)',
        }}
      />
      <div className="relative z-10 text-center px-8 max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-6xl font-light text-white tracking-tight"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          {headline}
        </motion.h1>
        {subtext && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-6 text-lg md:text-xl text-white/80 font-light leading-relaxed"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}
          >
            {subtext}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-10 text-sm text-white/40 font-light"
        >
          Tap anywhere to continue
        </motion.p>
      </div>
    </motion.div>
  );
};
