'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, X, Edit2, Eye } from 'lucide-react';
import { SlideDeck } from '@/lib/schemas/deck-schema';
import EditableSlideRenderer from './EditableSlideRenderer';
import { updateSlideTitle, updateSlideContent, cloneDeck } from '@/lib/utils/slide-editor';

interface DeckViewerProps {
  deck: SlideDeck;
  onClose?: () => void;
  onDeckUpdate?: (updatedDeck: SlideDeck) => void;
}

export default function DeckViewer({ deck, onClose, onDeckUpdate }: DeckViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedDeck, setEditedDeck] = useState<SlideDeck>(cloneDeck(deck));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalSlides = editedDeck.slides.length;

  // Update edited deck when original deck changes
  useEffect(() => {
    setEditedDeck(cloneDeck(deck));
  }, [deck]);

  // Scroll to specific slide
  const scrollToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides && slideRefs.current[index]) {
      slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSlideIndex(index);
    }
  };

  const goToNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      scrollToSlide(currentSlideIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentSlideIndex > 0) {
      scrollToSlide(currentSlideIndex - 1);
    }
  };

  // Handle scroll to detect current slide
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Find which slide is currently in view
    for (let i = 0; i < slideRefs.current.length; i++) {
      const slide = slideRefs.current[i];
      if (slide) {
        const slideTop = slide.offsetTop - container.offsetTop;
        const slideBottom = slideTop + slide.offsetHeight;
        
        // Check if slide is in the center of viewport
        const viewportCenter = scrollPosition + containerHeight / 2;
        
        if (viewportCenter >= slideTop && viewportCenter < slideBottom) {
          if (currentSlideIndex !== i) {
            setCurrentSlideIndex(i);
          }
          break;
        }
      }
    }
  };

  // Handle slide title update
  const handleTitleChange = (slideId: string, newTitle: string) => {
    const updated = updateSlideTitle(editedDeck, slideId, newTitle);
    setEditedDeck(updated);
    if (onDeckUpdate) {
      onDeckUpdate(updated);
    }
  };

  // Handle slide content update
  const handleContentChange = (slideId: string, newContent: string) => {
    const updated = updateSlideContent(editedDeck, slideId, newContent);
    setEditedDeck(updated);
    if (onDeckUpdate) {
      onDeckUpdate(updated);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevious();
      }
      if (e.key === 'Escape') {
        if (isEditMode) {
          setIsEditMode(false);
        } else if (onClose) {
          onClose();
        }
      }
      // Page Up/Down for quick navigation
      if (e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        goToPrevious();
      }
      // Toggle edit mode with 'e' key
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        setIsEditMode(!isEditMode);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, totalSlides, isEditMode]);

  // Scroll to first slide on mount
  useEffect(() => {
    scrollToSlide(0);
  }, []);

  const currentSlide = editedDeck.slides[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-colors ${
        isEditMode ? 'bg-gradient-to-b from-blue-900/90 to-transparent' : 'bg-gradient-to-b from-black/90 to-transparent'
      } p-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-white font-semibold text-lg truncate">
              {editedDeck.title}
            </h1>
            {isEditMode && (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                EDIT MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                isEditMode
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">View</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Edit</span>
                </>
              )}
            </button>
            <div className="text-white text-sm">
              {currentSlideIndex + 1} / {totalSlides}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ scrollPaddingTop: '80px' }}
      >
        {editedDeck.slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="snap-start snap-always min-h-screen w-full flex items-center justify-center"
          >
            <EditableSlideRenderer
              slide={slide}
              theme={editedDeck.theme}
              isEditMode={isEditMode}
              onTitleChange={(title) => handleTitleChange(slide.id, title)}
              onContentChange={(content) => handleContentChange(slide.id, content)}
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons - Floating */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none p-4 z-10">
        <button
          onClick={goToPrevious}
          disabled={currentSlideIndex === 0}
          className={`
            pointer-events-auto p-3 rounded-full bg-white/20 backdrop-blur-sm
            text-white transition-all mb-auto mt-20
            ${currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/30'}
          `}
          aria-label="Previous slide"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentSlideIndex === totalSlides - 1}
          className={`
            pointer-events-auto p-3 rounded-full bg-white/20 backdrop-blur-sm
            text-white transition-all mt-auto mb-20
            ${currentSlideIndex === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/30'}
          `}
          aria-label="Next slide"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Indicators - Bottom */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-colors ${
        isEditMode ? 'bg-gradient-to-t from-blue-900/90 to-transparent' : 'bg-gradient-to-t from-black/90 to-transparent'
      } p-4`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 justify-center flex-wrap">
            {editedDeck.slides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToSlide(index)}
                className={`
                  h-2 rounded-full transition-all
                  ${index === currentSlideIndex
                    ? 'bg-white w-8'
                    : 'bg-white/40 w-2 hover:bg-white/60'
                  }
                `}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="text-white text-xs text-center mt-2 opacity-75">
            {isEditMode ? (
              <>Edit Mode: Click on text to edit • Press 'E' to toggle • Esc to exit</>
            ) : (
              <>Scroll down or use arrow keys to navigate • Press 'E' to edit</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
