'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function GenerateButton({
  onClick,
  disabled = false,
  loading = false,
}: GenerateButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`
        w-full py-4 px-6
        rounded-lg font-semibold text-base
        flex items-center justify-center gap-2
        transition-all duration-200
        ${isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }
      `}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-5 h-5" />
          </motion.div>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <span>Generate Presentation</span>
        </>
      )}
    </motion.button>
  );
}
