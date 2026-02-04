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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Main Button */}
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRecording ? '#dc2626' : '#111827',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = isRecording ? '#b91c1c' : '#1f2937';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = isRecording ? '#dc2626' : '#111827';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {/* Icon */}
        {isRecording ? (
          <Square
            style={{
              width: '28px',
              height: '28px',
              color: '#ffffff',
            }}
            fill="#ffffff"
          />
        ) : (
          <Mic
            style={{
              width: '32px',
              height: '32px',
              color: '#ffffff',
            }}
          />
        )}
      </button>

      {/* Keyboard Shortcut */}
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        fontFamily: 'monospace',
      }}>
        ⌘⇧G
      </div>
    </div>
  );
};

export default RecordingButton;
