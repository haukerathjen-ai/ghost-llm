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
        textColor: 'text-white',
      };
    }
    if (message.includes('Screenshot')) {
      return {
        label: 'Screenshot erstellt',
        textColor: 'text-white',
      };
    }
    if (message.includes('Transkribiere')) {
      return {
        label: 'Transkribiere...',
        textColor: 'text-white',
      };
    }
    if (message.includes('Claude')) {
      return {
        label: 'Claude denkt...',
        textColor: 'text-white',
      };
    }
    if (message.includes('Tippe')) {
      return {
        label: 'Tippe...',
        textColor: 'text-white',
      };
    }
    if (message.includes('Fehler')) {
      return {
        label: 'Fehler aufgetreten',
        textColor: 'text-slate-400',
      };
    }
    
    // Default states based on state
    if (statusData.state === 'recording') {
      return {
        label: 'Aufnahme läuft',
        textColor: 'text-white',
      };
    }
    if (statusData.state === 'processing') {
      return {
        label: 'Verarbeite...',
        textColor: 'text-white',
      };
    }
    return {
      label: 'Bereit',
      textColor: 'text-white',
    };
  };

  const config = getStatusConfig();
  const displayMessage = statusData.message || config.label;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '16px', color: '#ffffff' }}>
        {displayMessage}
      </div>
    </div>
  );
};

export default StatusIndicator;
