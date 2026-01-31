// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import React from 'react';
import { TranscriptionRecord } from '../types';

interface HistoryListProps {
  items: TranscriptionRecord[];
  limit?: number;
  showFullText: boolean;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  limit,
  showFullText,
}) => {
  const displayItems = limit ? items.slice(0, limit) : items;

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(timestamp));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (showFullText || text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + '...';
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'local':
        return 'bg-blue-100 text-blue-800';
      case 'cloud':
        return 'bg-green-100 text-green-800';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (displayItems.length === 0) {
    return (
      <div className="empty-state">
        <svg
          className="empty-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3>Keine Einträge vorhanden</h3>
        <p>Starten Sie eine neue Transkription, um die Historie zu füllen.</p>
      </div>
    );
  }

  return (
    <div className="history-list">
      {displayItems.map((item, index) => (
        <div
          key={item.id}
          className="history-card"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="history-card-header">
            <span className="history-time">{formatTime(item.timestamp)}</span>
            <span className={`strategy-badge ${getStrategyColor(item.strategy)}`}>
              {item.strategy}
            </span>
          </div>

          <div className="history-card-body">
            <p className="history-text">{truncateText(item.text)}</p>
          </div>

          <div className="history-card-footer">
            <button
              className="copy-button"
              onClick={() => handleCopy(item.text)}
              aria-label="Text kopieren"
            >
              <svg
                className="copy-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Kopieren
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.2s ease;
        }

        .history-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .history-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .history-time {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .strategy-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .history-card-body {
          margin-bottom: 0.75rem;
        }

        .history-text {
          color: #374151;
          line-height: 1.6;
          margin: 0;
          word-wrap: break-word;
        }

        .history-card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .copy-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border: none;
          border-radius: 0.375rem;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }

        .copy-button:active {
          transform: translateY(0);
        }

        .copy-icon {
          width: 1rem;
          height: 1rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          color: #6b7280;
        }

        .empty-icon {
          width: 4rem;
          height: 4rem;
          margin-bottom: 1rem;
          color: #d1d5db;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          color: #374151;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};