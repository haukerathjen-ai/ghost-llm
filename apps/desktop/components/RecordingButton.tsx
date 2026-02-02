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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      {/* Outer Neon Ring */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Animated Neon Ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: isRecording ? '3px solid #00f0ff' : '3px solid #00f0ff55',
          animation: isRecording ? 'neonPulse 2s ease-in-out infinite' : 'none',
          transition: 'all 0.3s ease',
        }} />
        
        {/* Secondary Ring */}
        <div style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '50%',
          border: isRecording ? '2px solid #ff00ff' : '2px solid #ff00ff33',
          animation: isRecording ? 'neonPulse 2s ease-in-out infinite reverse' : 'none',
          transition: 'all 0.3s ease',
        }} />

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
            background: isRecording 
              ? 'linear-gradient(135deg, #ff00ff 0%, #00f0ff 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: isRecording ? '2px solid #00f0ff' : '2px solid #00f0ff55',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.3s ease',
            boxShadow: isRecording 
              ? '0 0 20px #00f0ff, 0 0 40px #00f0ff, inset 0 0 20px #ff00ff44'
              : '0 0 10px #00f0ff44, inset 0 0 10px #00f0ff22',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isRecording) {
              e.currentTarget.style.boxShadow = '0 0 20px #00f0ff, 0 0 30px #00f0ff88, inset 0 0 15px #00f0ff33';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !isRecording) {
              e.currentTarget.style.boxShadow = '0 0 10px #00f0ff44, inset 0 0 10px #00f0ff22';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {/* Scanline Effect */}
          {isRecording && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 0%, #00f0ff44 50%, transparent 100%)',
              height: '20%',
              animation: 'scanline 2s linear infinite',
              pointerEvents: 'none',
            }} />
          )}
          
          {/* Icon */}
          {isRecording ? (
            <Square 
              style={{ 
                width: '28px', 
                height: '28px', 
                color: '#ffffff',
                filter: 'drop-shadow(0 0 5px #ffffff)',
              }} 
              fill="#ffffff" 
            />
          ) : (
            <Mic 
              style={{ 
                width: '32px', 
                height: '32px', 
                color: '#00f0ff',
                filter: 'drop-shadow(0 0 5px #00f0ff)',
              }} 
            />
          )}
        </button>
      </div>
      
      {/* Keyboard Shortcut */}
      <div style={{ 
        fontSize: '11px', 
        color: '#00f0ff',
        fontFamily: 'monospace',
        letterSpacing: '2px',
        textShadow: '0 0 10px #00f0ff',
        opacity: 0.8,
      }}>
        ⌘⇧G
      </div>
    </div>
  );
};

export default RecordingButton;
