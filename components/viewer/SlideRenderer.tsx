'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Slide } from '@/lib/schemas/deck-schema';
import { getAnimationVariants, revealVariants, staggerContainer, staggerItem } from '@/lib/utils/animation-variants';

interface SlideRendererProps {
  slide: Slide;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export default function SlideRenderer({ slide, theme }: SlideRendererProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const bgColor = theme?.backgroundColor || '#ffffff';
  const textColor = theme?.textColor || '#1f2937';
  const primaryColor = theme?.primaryColor || '#3b82f6';
  
  const titleVariants = getAnimationVariants(revealVariants);
  const contentVariants = getAnimationVariants(staggerContainer);

  const renderContent = () => {
    switch (slide.layout) {
      case 'centered':
        return (
          <div ref={ref} className="flex flex-col items-center justify-center min-h-screen w-full text-center px-6 py-20">
            {slide.title && (
              <motion.h2
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={titleVariants}
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 sm:mb-12 leading-tight"
                style={{ color: primaryColor }}
              >
                {slide.title}
              </motion.h2>
            )}
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={contentVariants}
              className="text-xl sm:text-2xl md:text-3xl leading-relaxed max-w-3xl space-y-4"
            >
              {slide.content.split('\n').map((line, index) => (
                line.trim() && (
                  <motion.p key={index} variants={staggerItem} className="mb-4">
                    {line.startsWith('•') ? line : `• ${line}`}
                  </motion.p>
                )
              ))}
            </motion.div>
          </div>
        );

      case 'split':
        return (
          <div ref={ref} className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-20">
            <div className="flex flex-col justify-center space-y-6">
              {slide.title && (
                <motion.h2
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  variants={getAnimationVariants({ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } })}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
                  style={{ color: primaryColor }}
                >
                  {slide.title}
                </motion.h2>
              )}
              <motion.div
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={contentVariants}
                className="text-lg sm:text-xl md:text-2xl leading-relaxed space-y-4"
              >
                {slide.content.split('\n').map((line, index) => (
                  line.trim() && (
                    <motion.p key={index} variants={staggerItem} className="mb-3">
                      {line.startsWith('•') ? line : `• ${line}`}
                    </motion.p>
                  )
                ))}
              </motion.div>
            </div>
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={getAnimationVariants({ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 } } })}
              className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[300px]"
            >
              {slide.imageRef ? (
                <img
                  src={slide.imageRef}
                  alt={slide.title || 'Slide image'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-lg">No image</div>
              )}
            </motion.div>
          </div>
        );

      case 'grid':
        return (
          <div ref={ref} className="min-h-screen w-full px-6 py-20">
            {slide.title && (
              <motion.h2
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={titleVariants}
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 text-center leading-tight"
                style={{ color: primaryColor }}
              >
                {slide.title}
              </motion.h2>
            )}
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={contentVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              {slide.content.split('\n').filter(Boolean).map((item, index) => (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  className="p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm"
                >
                  <p className="text-lg sm:text-xl leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        );

      default:
        return (
          <div ref={ref} className="flex flex-col justify-center min-h-screen w-full px-6 py-20">
            {slide.title && (
              <motion.h2
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={titleVariants}
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 leading-tight"
                style={{ color: primaryColor }}
              >
                {slide.title}
              </motion.h2>
            )}
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={contentVariants}
              className="text-lg sm:text-xl md:text-2xl leading-relaxed space-y-4 max-w-3xl"
            >
              {slide.content.split('\n').map((line, index) => (
                line.trim() && (
                  <motion.p key={index} variants={staggerItem} className="mb-4">
                    {line.startsWith('•') ? line : `• ${line}`}
                  </motion.p>
                )
              ))}
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {renderContent()}
    </div>
  );
}
