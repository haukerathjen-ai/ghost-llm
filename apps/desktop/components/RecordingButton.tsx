// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import React from 'react';
import { Mic, Square } from 'lucide-react';

interface RecordingButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onToggle,
  disabled = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    onToggle();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          w-16 h-16 flex items-center justify-center
          ${
            disabled
              ? 'bg-slate-800 cursor-not-allowed opacity-50'
              : isRecording
              ? 'bg-slate-200 hover:bg-white'
              : 'bg-slate-200 hover:bg-white'
          }
        `}
        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? (
          <Square className="w-6 h-6 text-[#0a0a0a]" fill="#0a0a0a" />
        ) : (
          <Mic className="w-6 h-6 text-[#0a0a0a]" />
        )}
      </button>
      
      <div className="text-xs text-slate-500">
        ⌘⇧G
      </div>
    </div>
  );
};

export default RecordingButton;
