'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  status?: string;
  error?: boolean;
}

export default function GenerateButton({
  onClick,
  disabled = false,
  loading = false,
  status = '',
  error = false,
}: GenerateButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonText = () => {
    if (loading && status) {
      return status;
    }
    if (loading) {
      return 'Generating...';
    }
    if (error) {
      return 'Try Again';
    }
    return 'Generate Presentation';
  };

  const getButtonIcon = () => {
    if (loading) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-5 h-5" />
        </motion.div>
      );
    }
    if (error) {
      return <AlertCircle className="w-5 h-5" />;
    }
    return <Sparkles className="w-5 h-5" />;
  };

  const getButtonStyle = () => {
    if (isDisabled && !error) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    if (error) {
      return 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl';
    }
    return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl';
  };

  return (
    <div className="w-full">
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
          ${getButtonStyle()}
        `}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </motion.button>
      
      {/* Status indicator below button */}
      {loading && status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <p className="text-xs text-gray-600">{status}</p>
        </motion.div>
      )}
    </div>
  );
}
