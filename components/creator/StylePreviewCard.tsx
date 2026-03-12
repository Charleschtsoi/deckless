'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { StylePreset } from '@/lib/presets/style-presets';

interface StylePreviewCardProps {
  preset: StylePreset;
  isSelected: boolean;
  onSelect: () => void;
}

export default function StylePreviewCard({
  preset,
  isSelected,
  onSelect,
}: StylePreviewCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Mini Slide Preview */}
      <div
        className="w-full h-32 rounded-lg mb-3 p-3 flex flex-col justify-between"
        style={{
          backgroundColor: preset.theme.backgroundColor,
          color: preset.theme.textColor,
        }}
      >
        <div
          className="text-sm font-bold truncate"
          style={{ color: preset.theme.primaryColor }}
        >
          Sample Title
        </div>
        <div className="text-xs space-y-1">
          <div className="h-1 rounded" style={{ backgroundColor: preset.theme.primaryColor, width: '60%' }} />
          <div className="h-1 rounded" style={{ backgroundColor: preset.theme.secondaryColor, width: '40%' }} />
        </div>
      </div>

      {/* Style Name */}
      <h3 className="font-semibold text-base mb-1 text-gray-900">
        {preset.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3">
        {preset.description}
      </p>

      {/* Color Swatches */}
      <div className="flex gap-2">
        {preset.previewColors.map((color, index) => (
          <div
            key={index}
            className="w-8 h-8 rounded-full border border-gray-200"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Category Badge */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className={`
          text-xs px-2 py-1 rounded-full
          ${preset.category === 'dark'
            ? 'bg-gray-800 text-white'
            : preset.category === 'light'
            ? 'bg-gray-100 text-gray-700'
            : 'bg-purple-100 text-purple-700'
          }
        `}>
          {preset.category}
        </span>
      </div>
    </motion.button>
  );
}
