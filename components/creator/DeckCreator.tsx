'use client';

import { useState } from 'react';
import PromptInput from './PromptInput';
import ImageUpload from './ImageUpload';
import GenerateButton from './GenerateButton';
import StylePresetSelector from './StylePresetSelector';
import DeckViewer from '@/components/viewer/DeckViewer';
import { ProcessedImage } from '@/lib/utils/image-handler';
import { SlideDeck } from '@/lib/schemas/deck-schema';
import { StylePreset, getDefaultPreset } from '@/lib/presets/style-presets';

export default function DeckCreator() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(getDefaultPreset());
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<SlideDeck | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a presentation context');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('stylePresetId', selectedStyle.id);
      
      // Add images as base64 data
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image.base64);
        formData.append(`image_${index}_name`, image.name);
        formData.append(`image_${index}_mime`, image.mimeType);
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate presentation' }));
        throw new Error(errorData.error || 'Failed to generate presentation');
      }

      const data = await response.json();
      setGeneratedDeck(data);
      
      // TODO: Navigate to viewer or show success message
      // For now, we'll just log it
      console.log('Generated deck:', data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = prompt.trim().length > 0 && !loading;

  // Handle deck updates from viewer
  const handleDeckUpdate = (updatedDeck: SlideDeck) => {
    setGeneratedDeck(updatedDeck);
  };

  // Show viewer if deck is generated
  if (generatedDeck) {
    return (
      <DeckViewer
        deck={generatedDeck}
        onClose={() => {
          setGeneratedDeck(null);
          // Optionally reset form
          // setPrompt('');
          // setImages([]);
        }}
        onDeckUpdate={handleDeckUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Presentation
          </h1>
          <p className="text-gray-600">
            Describe your idea and upload images to generate a beautiful slide deck
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Prompt Input */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            disabled={loading}
          />

          {/* Image Upload */}
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            disabled={loading}
          />

          {/* Style Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Presentation Style
              </label>
              <button
                type="button"
                onClick={() => setShowStyleSelector(!showStyleSelector)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                disabled={loading}
              >
                {showStyleSelector ? 'Hide Styles' : 'Choose Style'}
              </button>
            </div>
            {showStyleSelector ? (
              <StylePresetSelector
                onSelect={(preset) => {
                  setSelectedStyle(preset);
                  setShowStyleSelector(false);
                }}
                initialPreset={selectedStyle}
              />
            ) : (
              <div
                onClick={() => setShowStyleSelector(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: selectedStyle.theme.backgroundColor }}
                  >
                    <div
                      className="w-full h-full rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ color: selectedStyle.theme.primaryColor }}
                    >
                      {selectedStyle.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedStyle.name}</p>
                    <p className="text-sm text-gray-600">{selectedStyle.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {selectedStyle.previewColors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={loading}
          />
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your API keys are required. Configure them in your environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
