```tsx
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
  const handleClick = async () => {
    if (disabled) return;
    
    try {
      if (isRecording) {
        await window.ghostAPI.stopRecording();
      } else {
        await window.ghostAPI.startRecording();
      }
      onToggle();
    } catch (error) {
      console.error('Recording toggle error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-20 h-20 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-purple-500/50
          ${
            disabled
              ? 'bg-gray-300 cursor-not-allowed opacity-50'
              : isRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
              : 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-600/60 hover:scale-105'
          }
        `}
        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? (
          <Square className="w-8 h-8 text-white" fill="white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>
      
      <div className="text-xs text-gray-500 font-medium">
        ⌘⇧G
      </div>
    </div>
  );
};

export default RecordingButton;
```