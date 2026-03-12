'use client';

import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function PromptInput({
  value,
  onChange,
  placeholder = 'Describe your presentation idea...',
  maxLength = 1000,
  disabled = false,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className="w-full">
      <label
        htmlFor="prompt-input"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Presentation Context
      </label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-gray-400">
          <FileText className="w-5 h-5" />
        </div>
        <textarea
          id="prompt-input"
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={6}
          className={`
            w-full pl-10 pr-4 py-3
            border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-none overflow-hidden
            text-base text-gray-900
            placeholder:text-gray-400
            transition-all duration-200
          `}
        />
      </div>
      <div className="mt-2 flex justify-between items-center text-xs">
        <span className="text-gray-500">
          Be specific about your topic, audience, and key points
        </span>
        <span
          className={`
            font-medium
            ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}
          `}
        >
          {remainingChars} remaining
        </span>
      </div>
    </div>
  );
}
