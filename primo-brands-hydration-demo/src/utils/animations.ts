import type { Variants } from 'framer-motion';
import type { SceneLayout } from '@/types/scene';

export const sceneAnimationVariants: Record<SceneLayout, Variants> = {
  'conversation-centered': {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      scale: 1.02,
      transition: { duration: 0.3, ease: 'easeIn' }
    },
  },
  'product-hero': {
    initial: { opacity: 0, y: 40 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    },
  },
  'product-grid': {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0 },
  },
  'checkout': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

export const productCardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.2 }
  },
};
