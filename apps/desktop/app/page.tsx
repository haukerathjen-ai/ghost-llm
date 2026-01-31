'use client';

// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useElectronIPC } from '@/hooks/useElectronIPC';
import StatusIndicator from '@/components/StatusIndicator';
import RecordingButton from '@/components/RecordingButton';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { status, isRecording, startRecording, stopRecording, activityLog } = useElectronIPC();
  const [soxAvailable, setSoxAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('System bereit');
  const [apiKeysOk, setApiKeysOk] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if SoX is available
    if (typeof window !== 'undefined' && window.ghostAPI) {
      window.ghostAPI.checkSoxAvailable().then(setSoxAvailable).catch(() => setSoxAvailable(false));
      
      // Check API keys status
      window.ghostAPI.checkAPIKeys().then((status) => {
        setApiKeysOk(status.openai && status.anthropic);
      }).catch(() => setApiKeysOk(false));
    }
  }, []);


  // Update status message based on recording state
  useEffect(() => {
    if (soxAvailable === null) {
      setStatusMessage('Checking audio engine...');
    } else if (!soxAvailable) {
      setStatusMessage('Audio-Engine (SoX) nicht gefunden');
    } else if (isRecording) {
      setStatusMessage('Aufnahme läuft...');
    } else if (status && typeof status === 'object' && 'message' in status) {
      // Use message from RecordingManager status events
      setStatusMessage((status as any).message);
    } else {
      setStatusMessage('System bereit');
    }
  }, [soxAvailable, isRecording, status]);

  // Format timestamp for activity log
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      {/* Centered Container */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '80px 24px' }}>
        {/* Header */}
        <header style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>
              Ghost LLM
            </h1>
            <Link 
              href="/settings"
              style={{ padding: '8px', color: '#94a3b8' }}
            >
              <Settings style={{ width: '20px', height: '20px' }} />
            </Link>
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Designed by Human | Developed by AI
          </p>
        </header>

        {/* API Keys Warning */}
        {apiKeysOk === false && (
          <div style={{ 
            backgroundColor: '#ef444420', 
            border: '1px solid #ef4444', 
            padding: '16px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', color: '#fca5a5', fontWeight: '500', marginBottom: '4px' }}>
                API-Keys in .env fehlen!
              </div>
              <div style={{ fontSize: '12px', color: '#fca5a5' }}>
                Fügen Sie OPENAI_API_KEY und ANTHROPIC_API_KEY in die .env-Datei ein und starten Sie die App neu.
              </div>
            </div>
          </div>
        )}

        {/* Status Section */}
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
            Status
          </h2>
          <StatusIndicator status={status} size="medium" />
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Recording Control */}
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
            Aufnahme
          </h2>
          <RecordingButton 
            isRecording={isRecording} 
            onToggle={isRecording ? stopRecording : startRecording} 
          />
        </div>

        {/* Activity Log */}
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
              Aktivitäts-Log
            </h2>
            <Link 
              href="/history"
              style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'none' }}
            >
              Alle anzeigen
            </Link>
          </div>
          
          {/* Activity List - Show last 5 entries, newest first */}
          <div>
            {activityLog.length === 0 ? (
              <div style={{ fontSize: '14px', color: '#94a3b8', padding: '32px 0', textAlign: 'center' }}>
                Keine Aktivität
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activityLog.map((entry, index) => (
                  <div key={index} style={{ fontSize: '14px', color: '#94a3b8' }}>
                    <span style={{ color: '#64748b' }}>[{formatTime(entry.timestamp)}]</span>
                    {' - '}
                    <span>{entry.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
