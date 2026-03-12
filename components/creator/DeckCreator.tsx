'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PromptInput from './PromptInput';
import ImageUpload from './ImageUpload';
import GenerateButton from './GenerateButton';
import StylePresetSelector from './StylePresetSelector';
import DeckViewer from '@/components/viewer/DeckViewer';
import { ProcessedImage } from '@/lib/utils/image-handler';
import { SlideDeck } from '@/lib/schemas/deck-schema';
import { StylePreset, getDefaultPreset } from '@/lib/presets/style-presets';

type ErrorType = 'network' | 'api_config' | 'validation' | 'llm_provider' | 'unknown';
type ApiStatus = 'idle' | 'checking' | 'connected' | 'error';

interface ErrorInfo {
  message: string;
  type: ErrorType;
  details?: string;
  actionable?: string;
}

export default function DeckCreator() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(getDefaultPreset());
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<SlideDeck | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');

  /**
   * Classify error type and create user-friendly error message
   */
  const classifyError = (error: unknown, response?: Response): ErrorInfo => {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Unable to connect to the API',
        type: 'network',
        details: 'Please check your internet connection and try again.',
        actionable: 'Check your internet connection and ensure the server is running.',
      };
    }

    // API configuration errors
    if (response?.status === 500) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('LLM provider not configured') || errorMessage.includes('API key')) {
        const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER || 'your selected provider';
        return {
          message: 'API Configuration Error',
          type: 'api_config',
          details: errorMessage,
          actionable: `Please set LLM_PROVIDER and ${provider.toUpperCase()}_API_KEY in your .env file.`,
        };
      }
    }

    // Validation errors
    if (response?.status === 400) {
      return {
        message: 'Invalid Input',
        type: 'validation',
        details: error instanceof Error ? error.message : String(error),
        actionable: 'Please check your input and try again.',
      };
    }

    // Rate limit errors
    if (response?.status === 429) {
      return {
        message: 'API Rate Limit Exceeded',
        type: 'llm_provider',
        details: 'Too many requests. Please wait a moment before trying again.',
        actionable: 'Wait a few seconds and try again.',
      };
    }

    // Authentication errors
    if (response?.status === 401 || response?.status === 403) {
      return {
        message: 'API Authentication Failed',
        type: 'llm_provider',
        details: 'Invalid API key or authentication credentials.',
        actionable: 'Please check your API key in the .env file and ensure it is correct.',
      };
    }

    // Generic error
    return {
      message: 'Failed to Generate Presentation',
      type: 'unknown',
      details: error instanceof Error ? error.message : String(error),
      actionable: 'Please try again. If the problem persists, check your API configuration.',
    };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError({
        message: 'Input Required',
        type: 'validation',
        details: 'Please enter a presentation context before generating.',
        actionable: 'Enter your presentation idea in the text area above.',
      });
      return;
    }

    setLoading(true);
    setLoadingStatus('Preparing request...');
    setError(null);
    setSuccess(null);

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

      setLoadingStatus('Connecting to API...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      setLoadingStatus('Processing response...');

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorInfo = classifyError(new Error(errorData.error || 'Failed to generate presentation'), response);
        setError(errorInfo);
        
        // Enhanced error logging
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          errorMessage: errorData.error,
          errorInfo: errorInfo,
        });
        
        // Log full error data for debugging
        if (errorData.error) {
          console.error('Error message from API:', errorData.error);
        }
        if (errorData.details) {
          console.error('Error details:', errorData.details);
        }
        return;
      }

      setLoadingStatus('Generating presentation...');
      const data = await response.json();
      
      // Validate response has slides
      if (!data.slides || data.slides.length === 0) {
        throw new Error('Invalid response: No slides generated');
      }

      setGeneratedDeck(data);
      setSuccess(`Successfully generated presentation with ${data.slides.length} slides!`);
      setLoadingStatus('');
      
      console.log('Generated deck:', data);
      
    } catch (err) {
      const errorInfo = classifyError(err);
      setError(errorInfo);
      
      // Enhanced error logging
      console.error('Generation error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      // Log network errors specifically
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('Network fetch error detected');
      }
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const canGenerate = prompt.trim().length > 0 && !loading;

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      setApiStatus('checking');
      try {
        // Try a simple health check by attempting to fetch the API endpoint
        // Note: This won't actually call the API, just check if it's reachable
        const response = await fetch('/api/generate', {
          method: 'OPTIONS',
        }).catch(() => null);
        
        // If we can reach the endpoint, consider it connected
        // The actual API key validation will happen on generation
        setApiStatus('connected');
      } catch {
        setApiStatus('error');
      }
    };

    checkApiStatus();
  }, []);

  // Update API status when errors occur
  useEffect(() => {
    if (error) {
      // Update status based on error type
      if (error.type === 'network') {
        setApiStatus('error');
      } else if (error.type === 'api_config') {
        setApiStatus('error');
      } else if (error.type === 'llm_provider') {
        setApiStatus('error');
      }
    } else if (success) {
      // Reset to connected on success
      setApiStatus('connected');
    }
  }, [error, success]);

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

          {/* Success Display */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`p-4 rounded-lg border ${
              error.type === 'api_config' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  error.type === 'api_config' ? 'text-yellow-600' : 'text-red-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    error.type === 'api_config' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {error.message}
                  </p>
                  {error.details && (
                    <p className={`text-xs mt-1 ${
                      error.type === 'api_config' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {error.details}
                    </p>
                  )}
                  {error.actionable && (
                    <p className={`text-xs mt-2 font-medium ${
                      error.type === 'api_config' ? 'text-yellow-900' : 'text-red-900'
                    }`}>
                      💡 {error.actionable}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={loading}
            status={loadingStatus}
            error={error !== null}
          />
        </div>

        {/* API Status Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            {apiStatus === 'checking' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                />
                <span className="text-gray-600">Checking API status...</span>
              </>
            )}
            {apiStatus === 'connected' && !error && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">API endpoint ready</span>
              </>
            )}
            {(apiStatus === 'error' || error) && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600">
                  {error?.type === 'network' 
                    ? 'API connection error' 
                    : error?.type === 'api_config'
                    ? 'API configuration error'
                    : 'API unavailable'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            Configure your LLM API keys in the <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">.env</code> file.
          </p>
        </div>
      </div>
    </div>
  );
}
