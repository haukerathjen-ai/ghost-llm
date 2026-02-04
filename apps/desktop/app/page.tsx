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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<{ state: string; message?: string } | null>(null);

  const clearError = () => setErrorMessage(null);

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

  // Get current pipeline phase for visual feedback
  const getPipelinePhase = () => {
    if (!pipelineStatus) return 'idle';
    return pipelineStatus.state;
  };

  const pipelinePhases = ['recording', 'transcribing', 'enriching', 'typing'];
  const currentPhase = getPipelinePhase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827', position: 'relative' }}>
      {/* Error Toast */}
      {errorMessage && (
        <div
          onClick={clearError}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#ffffff',
            color: '#dc2626',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxWidth: '400px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px', color: '#dc2626' }}>Fehler</div>
              <div style={{ fontSize: '13px', color: '#991b1b' }}>{errorMessage}</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>Klicken zum Schließen</div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Container */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Header */}
        <header style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.025em',
            }}>
              Ghost LLM
            </h1>
            <Link
              href="/settings"
              style={{
                padding: '10px',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              <Settings style={{ width: '20px', height: '20px' }} />
            </Link>
          </div>
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
          }}>
            Designed by Human | Developed by AI
          </p>
        </header>

        {/* API Keys Warning */}
        {apiKeysOk === false && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '16px',
            marginBottom: '24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600', marginBottom: '4px' }}>
                API-Keys in .env fehlen!
              </div>
              <div style={{ fontSize: '13px', color: '#991b1b' }}>
                Fügen Sie OPENAI_API_KEY und ANTHROPIC_API_KEY in die .env-Datei ein und starten Sie die App neu.
              </div>
            </div>
          </div>
        )}

        {/* Status Section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px',
          }}>
            Status
          </h2>
          <StatusIndicator status={status} size="medium" />

          {/* Pipeline Progress */}
          {currentPhase !== 'idle' && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
              }}>
                Pipeline-Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {pipelinePhases.map((phase, index) => {
                  const isActive = phase === currentPhase;
                  const isPast = pipelinePhases.indexOf(currentPhase) > index;
                  return (
                    <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        backgroundColor: isActive
                          ? '#111827'
                          : isPast
                          ? '#10b981'
                          : '#f3f4f6',
                        color: isActive || isPast ? '#ffffff' : '#9ca3af',
                        transition: 'all 0.3s ease',
                        border: `2px solid ${isActive ? '#111827' : isPast ? '#10b981' : '#e5e7eb'}`,
                      }}>
                        {phase === 'recording' && '🎙️'}
                        {phase === 'transcribing' && '🎤'}
                        {phase === 'enriching' && '🧠'}
                        {phase === 'typing' && '⌨️'}
                      </div>
                      {index < pipelinePhases.length - 1 && (
                        <div style={{
                          width: '20px',
                          height: '2px',
                          backgroundColor: isPast ? '#10b981' : '#e5e7eb',
                          transition: 'background 0.3s ease',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
                {pipelineStatus?.message || 'Verarbeite...'}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {statusMessage}
            </p>
            {/* Emergency Stop Hint */}
            {currentPhase === 'typing' && (
              <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '12px' }}>
                💡 Tipp: Drücke <strong style={{ color: '#111827' }}>F10</strong> zum Abbrechen (Emergency Stop)
              </p>
            )}
          </div>
        </div>

        {/* Recording Control */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            Aufnahme
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RecordingButton
              isRecording={isRecording}
              onToggle={isRecording ? stopRecording : startRecording}
            />
          </div>
        </div>

        {/* Activity Log */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
            }}>
              Aktivitäts-Log
            </h2>
          </div>

          {/* Activity List */}
          <div>
            {activityLog.length === 0 ? (
              <div style={{
                fontSize: '13px',
                color: '#9ca3af',
                padding: '32px 0',
                textAlign: 'center',
              }}>
                Keine Aktivität
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activityLog.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                  >
                    <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>[{formatTime(entry.timestamp)}]</span>
                    {' '}
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
