import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@/contexts/ConversationContext';

const LOADING_MESSAGES = [
  'Studying your beauty profile\u2026',
  'Reviewing your recent favorites\u2026',
  'Curating personalized picks\u2026',
  'Preparing your experience\u2026',
  'Setting the scene\u2026',
];

export const WelcomeLoader: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [queued, setQueued] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useConversation();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const submit = () => {
    const text = draft.trim();
    if (!text || queued) return;
    setQueued(true);
    setDraft('');
    // sendMessage acquires the send lock, so it will wait for the in-flight
    // welcome message to finish before seq=2 is sent — no extra sequencing needed.
    sendMessage(text);
  };

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

      {/* Queue-ahead input */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="mt-10 w-full max-w-sm px-4"
      >
        {queued ? (
          <p className="text-center text-white/40 text-xs tracking-wide">
            Got it — sending when ready&hellip;
          </p>
        ) : (
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Start typing while your experience loads…"
              className="flex-1 bg-transparent text-white/80 text-sm placeholder-white/30 outline-none min-w-0"
            />
            {draft && (
              <button
                onClick={submit}
                className="text-white/50 hover:text-white/90 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
