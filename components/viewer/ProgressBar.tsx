'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentSlide: number;
  totalSlides: number;
  className?: string;
}

export default function ProgressBar({
  currentSlide,
  totalSlides,
  className = '',
}: ProgressBarProps) {
  const progress = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 text-xs text-white/70">
        <span>Slide {currentSlide + 1} of {totalSlides}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
