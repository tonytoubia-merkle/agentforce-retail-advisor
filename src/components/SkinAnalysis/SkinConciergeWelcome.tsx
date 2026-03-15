import { motion } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';
import { useConversation } from '@/contexts/ConversationContext';

interface SkinConciergeWelcomeProps {
  onDismiss: () => void;
}

export const SkinConciergeWelcome: React.FC<SkinConciergeWelcomeProps> = ({ onDismiss }) => {
  const { openSkinAnalysis } = useScene();
  const { sendMessage } = useConversation();

  const handleAnalyze = () => {
    onDismiss();
    openSkinAnalysis();
  };

  const handleChat = () => {
    onDismiss();
    sendMessage("I'd like to describe my skin concerns.");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-10 flex flex-col items-center justify-center px-6"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.1) 100%)',
        }}
      />

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-white/70 tracking-wide uppercase">AI Skin Analysis</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-5xl md:text-6xl font-light text-white tracking-tight leading-tight mb-4"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          Know your skin.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-lg text-white/70 font-light leading-relaxed mb-12"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
        >
          Take a quick photo for an AI-powered skin analysis, or describe your concerns and I'll build you a personalized routine.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary: Analyze */}
          <button
            onClick={handleAnalyze}
            className="group flex items-center gap-3 px-7 py-4 bg-white text-stone-900 rounded-2xl font-medium text-base hover:bg-white/95 hover:shadow-2xl hover:shadow-black/30 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            {/* Camera icon */}
            <svg className="w-5 h-5 text-stone-700 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Analyze My Skin
          </button>

          {/* Secondary: Chat */}
          <button
            onClick={handleChat}
            className="flex items-center gap-3 px-7 py-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-2xl font-medium text-base backdrop-blur-sm transition-all duration-200 w-full sm:w-auto justify-center"
          >
            {/* Chat icon */}
            <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Describe My Concerns
          </button>
        </motion.div>

        {/* Reassurance */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 text-xs text-white/35 font-light tracking-wide"
        >
          Photos are analyzed instantly and never stored.
        </motion.p>
      </div>
    </motion.div>
  );
};
