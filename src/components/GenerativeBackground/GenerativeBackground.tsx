import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingShimmer } from './LoadingShimmer';
import type { SceneBackground, SceneSetting } from '@/types/scene';

interface GenerativeBackgroundProps {
  background: SceneBackground;
  setting: SceneSetting;
}

export const GenerativeBackground: React.FC<GenerativeBackgroundProps> = ({
  background,
}) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [previousImage, setPreviousImage] = useState<string | null>(null);

  useEffect(() => {
    if (background.type === 'image' || background.type === 'generative') {
      if (background.value && background.value !== currentImage) {
        setPreviousImage(currentImage);
        setCurrentImage(background.value);
      }
    }
  }, [background.value, currentImage, background.type]);

  if (background.type === 'gradient') {
    return (
      <div
        className="absolute inset-0 -z-10 transition-all duration-1000"
        style={{ background: background.value }}
      />
    );
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <AnimatePresence>
        {previousImage && previousImage !== currentImage && (
          <motion.img
            key={`prev-${previousImage}`}
            src={previousImage}
            alt=""
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>

      {currentImage && (
        <motion.img
          key={`curr-${currentImage}`}
          src={currentImage}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {background.isLoading && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/70 to-black/60" />
          <LoadingShimmer />
        </>
      )}

      {!background.isLoading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
      )}
    </div>
  );
};
