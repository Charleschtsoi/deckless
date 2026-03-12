'use client';

import { motion } from 'framer-motion';
import { Slide } from '@/lib/schemas/deck-schema';

interface SlideThumbnailsProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
  };
}

export default function SlideThumbnails({
  slides,
  currentSlideIndex,
  onSlideSelect,
  theme,
}: SlideThumbnailsProps) {
  const primaryColor = theme?.primaryColor || '#3b82f6';
  const bgColor = theme?.backgroundColor || '#ffffff';

  return (
    <div className="flex gap-2 justify-center flex-wrap px-2">
      {slides.map((slide, index) => {
        const isActive = index === currentSlideIndex;
        const slideTitle = slide.title || `Slide ${index + 1}`;
        const firstLine = slide.content.split('\n')[0]?.substring(0, 30) || '';

        return (
          <motion.button
            key={slide.id}
            onClick={() => onSlideSelect(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all
              ${isActive
                ? 'border-white shadow-lg'
                : 'border-white/30 hover:border-white/60'
              }
            `}
            style={{
              backgroundColor: bgColor,
            }}
            aria-label={`Go to slide ${index + 1}: ${slideTitle}`}
          >
            {/* Thumbnail Content */}
            <div className="w-full h-full p-1 flex flex-col items-center justify-center text-xs">
              <div
                className="font-bold truncate w-full text-center"
                style={{ color: primaryColor }}
              >
                {index + 1}
              </div>
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </div>

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
