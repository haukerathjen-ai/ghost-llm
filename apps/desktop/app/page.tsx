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
    <div className="cyber-grid" style={{ minHeight: '100vh', backgroundColor: '#0a0a14', color: '#ffffff', position: 'relative' }}>
      {/* Error Toast (Cyberpunk Style) */}
      {errorMessage && (
        <div 
          onClick={clearError}
          style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '2px solid #ff0000',
            boxShadow: '0 0 20px #ff000088, 0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            maxWidth: '400px',
            cursor: 'pointer',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px', textShadow: '0 0 10px #ff0000' }}>Fehler</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>{errorMessage}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }}>Klicken zum Schließen</div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Container */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '80px 24px' }}>
        {/* Header - Cyberpunk Style */}
        <header style={{ marginBottom: '64px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h1 style={{ 
              fontSize: '42px', 
              fontWeight: 'bold', 
              background: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 50%, #00f0ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px #00f0ff88',
              letterSpacing: '2px',
            }}>
              GHOST LLM
            </h1>
            <Link 
              href="/settings"
              style={{ 
                padding: '10px', 
                color: '#00f0ff',
                border: '2px solid #00f0ff33',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.boxShadow = '0 0 15px #00f0ff88';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff33';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Settings style={{ width: '20px', height: '20px', filter: 'drop-shadow(0 0 5px #00f0ff)' }} />
            </Link>
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: '#00f0ff', 
            fontFamily: 'monospace',
            letterSpacing: '1px',
            textShadow: '0 0 10px #00f0ff88',
          }}>
            &gt; Designed by Human | Developed by AI
          </p>
        </header>

        {/* API Keys Warning - Cyberpunk Style */}
        {apiKeysOk === false && (
          <div style={{ 
            background: 'linear-gradient(135deg, #ef444420 0%, #7f1d1d20 100%)',
            border: '2px solid #ff00ff', 
            padding: '16px', 
            marginBottom: '24px',
            borderRadius: '8px',
            boxShadow: '0 0 20px #ff00ff44, inset 0 0 20px #ff00ff11',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', color: '#ff00ff', fontWeight: '600', marginBottom: '4px', textShadow: '0 0 10px #ff00ff' }}>
                API-Keys in .env fehlen!
              </div>
              <div style={{ fontSize: '12px', color: '#fca5a5', fontFamily: 'monospace' }}>
                Fügen Sie OPENAI_API_KEY und ANTHROPIC_API_KEY in die .env-Datei ein und starten Sie die App neu.
              </div>
            </div>
          </div>
        )}

        {/* Status Section - Cyberpunk Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #00f0ff44', 
          borderRadius: '12px',
          padding: '28px', 
          marginBottom: '24px',
          boxShadow: '0 0 30px #00f0ff22, inset 0 0 30px #00f0ff11',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Corner Accents */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', borderTop: '3px solid #00f0ff', borderLeft: '3px solid #00f0ff' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', borderTop: '3px solid #ff00ff', borderRight: '3px solid #ff00ff' }} />
          
          <h2 style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            color: '#00f0ff', 
            marginBottom: '20px',
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00f0ff',
          }}>
            &gt; STATUS
          </h2>
          <StatusIndicator status={status} size="medium" />
          
          {/* Pipeline Progress (Visual Feedback) */}
          {currentPhase !== 'idle' && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #00f0ff22' }}>
              <div style={{ 
                fontSize: '10px', 
                color: '#00f0ff', 
                marginBottom: '16px', 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                fontFamily: 'monospace',
                textShadow: '0 0 5px #00f0ff',
              }}>
                &gt; PIPELINE-STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {pipelinePhases.map((phase, index) => {
                  const isActive = phase === currentPhase;
                  const isPast = pipelinePhases.indexOf(currentPhase) > index;
                  return (
                    <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        background: isActive 
                          ? 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)'
                          : isPast 
                          ? 'linear-gradient(135deg, #00ff41 0%, #00f0ff 100%)'
                          : '#1e293b',
                        border: isActive ? '2px solid #00f0ff' : isPast ? '2px solid #00ff41' : '2px solid #1e293b',
                        color: isActive || isPast ? '#ffffff' : '#64748b',
                        transition: 'all 0.3s ease',
                        boxShadow: isActive 
                          ? '0 0 20px #00f0ff, 0 0 30px #ff00ff'
                          : isPast 
                          ? '0 0 15px #00ff41'
                          : 'none',
                        animation: isActive ? 'neonPulse 1.5s ease-in-out infinite' : 'none',
                      }}>
                        {phase === 'recording' && '🎙️'}
                        {phase === 'transcribing' && '🎤'}
                        {phase === 'enriching' && '🧠'}
                        {phase === 'typing' && '⌨️'}
                      </div>
                      {index < pipelinePhases.length - 1 && (
                        <div style={{
                          width: '24px',
                          height: '3px',
                          background: isPast 
                            ? 'linear-gradient(90deg, #00ff41 0%, #00f0ff 100%)'
                            : '#1e293b',
                          transition: 'background 0.3s ease',
                          boxShadow: isPast ? '0 0 10px #00ff41' : 'none',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px', fontSize: '13px', color: '#00f0ff', fontFamily: 'monospace', textShadow: '0 0 5px #00f0ff88' }}>
                {pipelineStatus?.message || '&gt; Verarbeite...'}
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #00f0ff22' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace' }}>
              &gt; {statusMessage}
            </p>
            {/* Emergency Stop Hint */}
            {currentPhase === 'typing' && (
              <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '12px', fontFamily: 'monospace', textShadow: '0 0 5px #f59e0b' }}>
                💡 Tipp: Drücke <strong style={{ color: '#ff00ff', textShadow: '0 0 10px #ff00ff' }}>F10</strong> zum Abbrechen (Emergency Stop)
              </p>
            )}
          </div>
        </div>

        {/* Recording Control - Cyberpunk Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #ff00ff44', 
          borderRadius: '12px',
          padding: '32px', 
          marginBottom: '24px',
          boxShadow: '0 0 30px #ff00ff22, inset 0 0 30px #ff00ff11',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Corner Accents */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', borderBottom: '3px solid #ff00ff', borderLeft: '3px solid #ff00ff' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', borderBottom: '3px solid #00f0ff', borderRight: '3px solid #00f0ff' }} />
          
          <h2 style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            color: '#ff00ff', 
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily: 'monospace',
            textShadow: '0 0 10px #ff00ff',
          }}>
            &gt; AUFNAHME
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RecordingButton 
              isRecording={isRecording} 
              onToggle={isRecording ? stopRecording : startRecording} 
            />
          </div>
        </div>

        {/* Activity Log - Cyberpunk Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #00ff4144', 
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 0 30px #00ff4122, inset 0 0 30px #00ff4111',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scanline effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00f0ff05 2px, #00f0ff05 4px)',
            pointerEvents: 'none',
          }} />
          
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <h2 style={{ 
              fontSize: '11px', 
              textTransform: 'uppercase', 
              letterSpacing: '2px', 
              color: '#00ff41',
              fontFamily: 'monospace',
              textShadow: '0 0 10px #00ff41',
            }}>
              &gt; AKTIVITÄTS-LOG
            </h2>
          </div>
          
          {/* Activity List - Show last 5 entries, newest first */}
          <div style={{ position: 'relative' }}>
            {activityLog.length === 0 ? (
              <div style={{ 
                fontSize: '13px', 
                color: '#64748b', 
                padding: '32px 0', 
                textAlign: 'center',
                fontFamily: 'monospace',
              }}>
                &gt; Keine Aktivität
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activityLog.map((entry, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      fontSize: '13px', 
                      color: '#94a3b8',
                      fontFamily: 'monospace',
                      padding: '8px 12px',
                      background: '#00f0ff08',
                      border: '1px solid #00f0ff22',
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f0ff';
                      e.currentTarget.style.boxShadow = '0 0 10px #00f0ff44';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#00f0ff22';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>[{formatTime(entry.timestamp)}]</span>
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
