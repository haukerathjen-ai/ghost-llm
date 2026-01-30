// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import React from 'react';
import { Circle, Loader2, Check } from 'lucide-react';

type Status = 'idle' | 'recording' | 'processing' | 'typing';

interface StatusIndicatorProps {
  status: Status;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: <Circle className="w-12 h-12 text-gray-400" />,
          text: 'Bereit',
          className: '',
        };
      case 'recording':
        return {
          icon: <Circle className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />,
          text: 'Aufnahme läuft...',
          className: 'recording-pulse',
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
          text: 'Verarbeitung...',
          className: '',
        };
      case 'typing':
        return {
          icon: <Check className="w-12 h-12 text-green-500 animate-bounce" />,
          text: 'Eingabe erfolgt',
          className: 'typewriter',
        };
      default:
        return {
          icon: <Circle className="w-12 h-12 text-gray-400" />,
          text: 'Unbekannt',
          className: '',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col items-center justify-center min-w-[120px] p-4">
      <div className={`relative flex items-center justify-center ${config.className}`}>
        {/* Outer ring for recording effect */}
        {status === 'recording' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-300 rounded-full animate-ping opacity-75" />
          </div>
        )}
        
        {/* Icon */}
        <div className="relative z-10">
          {config.icon}
        </div>
      </div>

      {/* Status text */}
      <div className="mt-4 text-center">
        <p className={`text-sm font-medium ${
          status === 'idle' ? 'text-gray-600' :
          status === 'recording' ? 'text-red-600' :
          status === 'processing' ? 'text-blue-600' :
          status === 'typing' ? 'text-green-600' : 'text-gray-600'
        }`}>
          {config.text}
        </p>
      </div>

      <style jsx>{`
        @keyframes typewriter {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .typewriter {
          animation: typewriter 1s ease-in-out infinite;
        }

        .recording-pulse {
          animation: recordingPulse 2s ease-in-out infinite;
        }

        @keyframes recordingPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default StatusIndicator;