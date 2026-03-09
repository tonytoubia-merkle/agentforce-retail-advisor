import { motion } from 'framer-motion';

interface SuggestedActionsProps {
  actions: string[];
  onSelect: (action: string) => void;
}

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({ actions, onSelect }) => {
  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-3 mb-2"
    >
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          className="px-3 py-1.5 rounded-full text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
        >
          {action}
        </button>
      ))}
    </motion.div>
  );
};
