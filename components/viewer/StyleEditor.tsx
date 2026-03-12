'use client';

import { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { SlideDeck } from '@/lib/schemas/deck-schema';
import { StylePreset, stylePresets, getPresetById } from '@/lib/presets/style-presets';
import StylePreviewCard from '@/components/creator/StylePreviewCard';

interface StyleEditorProps {
  deck: SlideDeck;
  onStyleChange: (updatedDeck: SlideDeck) => void;
  onClose: () => void;
}

export default function StyleEditor({ deck, onStyleChange, onClose }: StyleEditorProps) {
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | null>(null);
  const [filter, setFilter] = useState<'all' | 'dark' | 'light' | 'specialty'>('all');

  // Find current preset by matching theme colors
  const findCurrentPreset = (): StylePreset | null => {
    return stylePresets.find(preset => 
      preset.theme.primaryColor === deck.theme.primaryColor &&
      preset.theme.backgroundColor === deck.theme.backgroundColor
    ) || null;
  };

  const currentPreset = findCurrentPreset();
  const filteredPresets =
    filter === 'all'
      ? stylePresets
      : stylePresets.filter(p => p.category === filter);

  const handleApplyStyle = () => {
    if (!selectedPreset) return;

    const updatedDeck: SlideDeck = {
      ...deck,
      theme: selectedPreset.theme,
    };

    onStyleChange(updatedDeck);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Change Presentation Style</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Current Style Info */}
        {currentPreset && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Current style:</span> {currentPreset.name}
            </p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 flex-wrap">
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <StylePreviewCard
                key={preset.id}
                preset={preset}
                isSelected={selectedPreset?.id === preset.id}
                onSelect={() => setSelectedPreset(preset)}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedPreset
              ? `Selected: ${selectedPreset.name} - ${selectedPreset.description}`
              : 'Select a style to apply'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyStyle}
              disabled={!selectedPreset}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors
                ${selectedPreset
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Apply Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
