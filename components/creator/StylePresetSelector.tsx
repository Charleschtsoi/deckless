'use client';

import { useState } from 'react';
import { stylePresets, StylePreset, getDefaultPreset } from '@/lib/presets/style-presets';
import StylePreviewCard from './StylePreviewCard';

interface StylePresetSelectorProps {
  onSelect: (preset: StylePreset) => void;
  initialPreset?: StylePreset;
}

export default function StylePresetSelector({
  onSelect,
  initialPreset,
}: StylePresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<StylePreset>(
    initialPreset || getDefaultPreset()
  );
  const [filter, setFilter] = useState<'all' | 'dark' | 'light' | 'specialty'>('all');

  const filteredPresets =
    filter === 'all'
      ? stylePresets
      : stylePresets.filter(p => p.category === filter);

  const handleSelect = (preset: StylePreset) => {
    setSelectedPreset(preset);
    onSelect(preset);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose a Style
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Select a visual style for your presentation. Each style has been curated to avoid generic AI aesthetics.
        </p>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'dark', 'light', 'specialty'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => (
          <StylePreviewCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPreset.id === preset.id}
            onSelect={() => handleSelect(preset)}
          />
        ))}
      </div>

      {/* Selected Style Info */}
      {selectedPreset && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Selected:</span> {selectedPreset.name} - {selectedPreset.description}
          </p>
        </div>
      )}
    </div>
  );
}
