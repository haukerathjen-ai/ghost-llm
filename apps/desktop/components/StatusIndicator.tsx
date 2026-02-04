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
        color: '#3b82f6',
        dotColor: '#3b82f6',
        pulse: true,
      };
    }
    if (message.includes('Screenshot')) {
      return {
        label: 'Screenshot erstellt',
        color: '#8b5cf6',
        dotColor: '#8b5cf6',
        pulse: false,
      };
    }
    if (message.includes('Transkribiere')) {
      return {
        label: 'Transkribiere...',
        color: '#6366f1',
        dotColor: '#6366f1',
        pulse: true,
      };
    }
    if (message.includes('Claude')) {
      return {
        label: 'Claude denkt...',
        color: '#6366f1',
        dotColor: '#6366f1',
        pulse: true,
      };
    }
    if (message.includes('Tippe')) {
      return {
        label: 'Tippe...',
        color: '#10b981',
        dotColor: '#10b981',
        pulse: true,
      };
    }
    if (message.includes('Fehler')) {
      return {
        label: 'Fehler aufgetreten',
        color: '#ef4444',
        dotColor: '#ef4444',
        pulse: false,
      };
    }

    // Default states based on state
    if (statusData.state === 'recording') {
      return {
        label: 'Aufnahme läuft',
        color: '#3b82f6',
        dotColor: '#3b82f6',
        pulse: true,
      };
    }
    if (statusData.state === 'processing') {
      return {
        label: 'Verarbeite...',
        color: '#6366f1',
        dotColor: '#6366f1',
        pulse: true,
      };
    }
    return {
      label: 'Bereit',
      color: '#10b981',
      dotColor: '#10b981',
      pulse: false,
    };
  };

  const config = getStatusConfig();
  const displayMessage = statusData.message || config.label;

  return (
    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
      {/* Status Indicator Dot */}
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: config.dotColor,
        flexShrink: 0,
        animation: config.pulse ? 'pulse 2s ease-in-out infinite' : 'none',
      }} />

      {/* Status Text */}
      <div style={{ textAlign: 'left' }}>
        <div style={{
          fontSize: '15px',
          color: '#111827',
          fontWeight: '600',
        }}>
          {displayMessage}
        </div>
        {config.pulse && (
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '2px',
          }}>
            Aktiv
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
