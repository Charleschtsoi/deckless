'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, X as XIcon } from 'lucide-react';
import { Slide } from '@/lib/schemas/deck-schema';
import { getTitleSizeClass, getContentSizeClass, getLineHeightClass, isContentTooLong } from '@/lib/utils/text-sizing';

interface EditableSlideRendererProps {
  slide: Slide;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  isEditMode: boolean;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
}

export default function EditableSlideRenderer({
  slide,
  theme,
  isEditMode,
  onTitleChange,
  onContentChange,
}: EditableSlideRendererProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editedTitle, setEditedTitle] = useState(slide.title || '');
  const [editedContent, setEditedContent] = useState(slide.content);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const bgColor = theme?.backgroundColor || '#ffffff';
  const textColor = theme?.textColor || '#1f2937';
  const primaryColor = theme?.primaryColor || '#3b82f6';
  
  // Get dynamic text sizes based on content length
  const titleSizeClass = slide.title ? getTitleSizeClass(slide.title) : 'text-4xl sm:text-5xl md:text-6xl';
  const contentSizeClass = getContentSizeClass(slide.content);
  const lineHeightClass = getLineHeightClass(slide.content);
  const contentTooLong = isContentTooLong(slide.content);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
      contentTextareaRef.current.setSelectionRange(
        contentTextareaRef.current.value.length,
        contentTextareaRef.current.value.length
      );
    }
  }, [editingContent]);

  const handleTitleSave = () => {
    if (onTitleChange && editedTitle.trim()) {
      onTitleChange(editedTitle.trim());
    }
    setEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(slide.title || '');
    setEditingTitle(false);
  };

  const handleContentSave = () => {
    if (onContentChange && editedContent.trim()) {
      onContentChange(editedContent.trim());
    }
    setEditingContent(false);
  };

  const handleContentCancel = () => {
    setEditedContent(slide.content);
    setEditingContent(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleContentCancel();
    }
    // Allow Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleContentSave();
    }
  };

  const renderEditableTitle = () => {
    if (!slide.title && !isEditMode) return null;

    if (editingTitle && isEditMode) {
      return (
        <div className="w-full max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="flex items-center gap-2 mb-2">
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              className={`flex-1 ${titleSizeClass} font-bold border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              style={{ color: primaryColor }}
            />
            <button
              onClick={handleTitleSave}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              aria-label="Save title"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={handleTitleCancel}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              aria-label="Cancel editing"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative group ${isEditMode ? 'cursor-pointer' : ''}`}
        onClick={() => isEditMode && setEditingTitle(true)}
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${titleSizeClass} font-bold mb-8 sm:mb-12 leading-tight ${
            isEditMode ? 'hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors' : ''
          }`}
          style={{ color: primaryColor }}
        >
          {slide.title || 'Untitled Slide'}
        </motion.h2>
        {isEditMode && !editingTitle && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    );
  };

  const renderEditableContent = () => {
    if (editingContent && isEditMode) {
      return (
        <div className="w-full max-w-3xl mx-auto">
          <textarea
            ref={contentTextareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleContentKeyDown}
            rows={10}
            className={`w-full ${contentSizeClass} ${lineHeightClass} border-2 border-blue-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y`}
            style={{ minHeight: '200px' }}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleContentSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleContentCancel}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <XIcon className="w-4 h-4" />
              Cancel
            </button>
            <span className="text-sm text-gray-500 ml-4">
              Press Ctrl/Cmd + Enter to save, Esc to cancel
            </span>
          </div>
        </div>
      );
    }

    // Get dynamic text sizes based on content length
    const contentSizeClass = getContentSizeClass(slide.content);
    const lineHeightClass = getLineHeightClass(slide.content);
    const contentTooLong = isContentTooLong(slide.content);
    
    return (
      <div
        className={`w-full max-w-3xl mx-auto space-y-4 ${
          isEditMode ? 'cursor-pointer group' : ''
        }`}
        onClick={() => isEditMode && setEditingContent(true)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${contentSizeClass} ${lineHeightClass} ${
            isEditMode ? 'hover:bg-gray-100 rounded-lg px-4 py-2 transition-colors' : ''
          } ${contentTooLong ? 'overflow-y-auto max-h-[60vh]' : ''}`}
        >
          {slide.content.split('\n').map((line, index) => (
            line.trim() && (
              <p key={index} className="mb-4">
                {line.startsWith('•') ? line : `• ${line}`}
              </p>
            )
          ))}
        </motion.div>
        {isEditMode && !editingContent && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-gray-400 text-sm">
            <Edit2 className="w-4 h-4" />
            <span>Click to edit</span>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (slide.layout) {
      case 'centered':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen w-full text-center px-6 py-20">
            {renderEditableTitle()}
            {renderEditableContent()}
          </div>
        );

      case 'split':
        return (
          <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-20">
            <div className="flex flex-col justify-center space-y-6">
              {renderEditableTitle()}
              {renderEditableContent()}
            </div>
            <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[300px]">
              {slide.imageRef ? (
                <img
                  src={slide.imageRef}
                  alt={slide.title || 'Slide image'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-lg">No image</div>
              )}
            </div>
          </div>
        );

      case 'grid':
        return (
          <div className="min-h-screen w-full px-6 py-20">
            {renderEditableTitle()}
            {editingContent && isEditMode ? (
              renderEditableContent()
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto ${
                  isEditMode ? 'cursor-pointer group' : ''
                }`}
                onClick={() => isEditMode && setEditingContent(true)}
              >
                {slide.content.split('\n').filter(Boolean).map((item, index) => {
                  const itemSizeClass = getContentSizeClass(item);
                  const itemLineHeight = getLineHeightClass(item);
                  return (
                    <div
                      key={index}
                      className={`p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm ${
                        isEditMode ? 'hover:bg-gray-100 transition-colors' : ''
                      }`}
                    >
                      <p className={`${itemSizeClass} ${itemLineHeight}`}>{item}</p>
                    </div>
                  );
                })}
                {isEditMode && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-gray-400 text-sm col-span-full justify-center mt-2">
                    <Edit2 className="w-4 h-4" />
                    <span>Click to edit content</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col justify-center min-h-screen w-full px-6 py-20">
            {renderEditableTitle()}
            {renderEditableContent()}
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
