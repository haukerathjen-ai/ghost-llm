// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

'use client';

import React from 'react';

interface StatusData {
  state: 'idle' | 'recording' | 'processing';
  message?: string;
}

interface StatusIndicatorProps {
  status: StatusData | string | null;
  size?: 'small' | 'medium' | 'large';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'medium' }) => {
  // Normalize status to StatusData format
  const statusData: StatusData = typeof status === 'string' 
    ? { state: status as 'idle' | 'recording' | 'processing', message: '' }
    : status || { state: 'idle', message: '' };

  const getStatusConfig = () => {
    const message = statusData.message || '';
    
    // Determine status based on message content
    if (message.includes('Aufnahme')) {
      return {
        label: 'Aufnahme läuft',
        color: '#00f0ff',
        glowColor: '#00f0ff',
        pulse: true,
      };
    }
    if (message.includes('Screenshot')) {
      return {
        label: 'Screenshot erstellt',
        color: '#9333ea',
        glowColor: '#9333ea',
        pulse: false,
      };
    }
    if (message.includes('Transkribiere')) {
      return {
        label: 'Transkribiere...',
        color: '#ff00ff',
        glowColor: '#ff00ff',
        pulse: true,
      };
    }
    if (message.includes('Claude')) {
      return {
        label: 'Claude denkt...',
        color: '#ff00ff',
        glowColor: '#ff00ff',
        pulse: true,
      };
    }
    if (message.includes('Tippe')) {
      return {
        label: 'Tippe...',
        color: '#00ff41',
        glowColor: '#00ff41',
        pulse: true,
      };
    }
    if (message.includes('Fehler')) {
      return {
        label: 'Fehler aufgetreten',
        color: '#ff0000',
        glowColor: '#ff0000',
        pulse: false,
      };
    }
    
    // Default states based on state
    if (statusData.state === 'recording') {
      return {
        label: 'Aufnahme läuft',
        color: '#00f0ff',
        glowColor: '#00f0ff',
        pulse: true,
      };
    }
    if (statusData.state === 'processing') {
      return {
        label: 'Verarbeite...',
        color: '#ff00ff',
        glowColor: '#ff00ff',
        pulse: true,
      };
    }
    return {
      label: 'Bereit',
      color: '#00ff41',
      glowColor: '#00ff41',
      pulse: false,
    };
  };

  const config = getStatusConfig();
  const displayMessage = statusData.message || config.label;

  return (
    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      {/* Cyberpunk Status Indicator */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Ring */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: `2px solid ${config.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: config.pulse ? 'neonGlow 2s ease-in-out infinite' : 'none',
        }}>
          {/* Inner Dot */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${config.color} 0%, ${config.color}88 100%)`,
            boxShadow: `0 0 20px ${config.glowColor}, 0 0 30px ${config.glowColor}88, inset 0 0 10px ${config.glowColor}`,
            animation: config.pulse ? 'glowPulse 1.5s ease-in-out infinite' : 'none',
          }} />
          
          {/* Scanlines */}
          {config.pulse && (
            <>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '2px',
                background: config.color,
                top: '30%',
                opacity: 0.3,
                animation: 'scanline 3s linear infinite',
              }} />
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '2px',
                background: config.color,
                top: '70%',
                opacity: 0.3,
                animation: 'scanline 3s linear infinite reverse',
              }} />
            </>
          )}
        </div>
      </div>
      
      {/* Status Text */}
      <div style={{ textAlign: 'left' }}>
        <div style={{ 
          fontSize: '16px', 
          color: config.color,
          fontFamily: 'monospace',
          fontWeight: '600',
          textShadow: `0 0 10px ${config.glowColor}88`,
          letterSpacing: '0.5px',
        }}>
          {displayMessage}
        </div>
        {config.pulse && (
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            fontFamily: 'monospace',
            marginTop: '4px',
            letterSpacing: '1px',
          }}>
            &gt; AKTIV
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
