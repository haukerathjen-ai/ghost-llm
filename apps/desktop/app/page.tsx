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
  const { status, isRecording, startRecording, stopRecording } = useElectronIPC();
  const [soxAvailable, setSoxAvailable] = useState<boolean | null>(null);
  const [strategy] = useState<string>('coder');

  useEffect(() => {
    // Check if SoX is available
    if (typeof window !== 'undefined' && window.ghostAPI) {
      window.ghostAPI.checkSoxAvailable().then(setSoxAvailable).catch(() => setSoxAvailable(false));
    }
  }, []);

  // Get system status message
  const systemStatus = soxAvailable === null 
    ? 'Checking audio engine...'
    : soxAvailable 
      ? 'System bereit' 
      : 'Audio-Engine (SoX) nicht gefunden';

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

        {/* Status Section */}
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
            Status
          </h2>
          <StatusIndicator status={status} size="medium" />
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {systemStatus}
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

        {/* Current Strategy */}
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '12px' }}>
            Aktive Strategie
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff' }}></div>
            <span style={{ fontSize: '18px', fontWeight: '500', color: '#ffffff', textTransform: 'capitalize' }}>
              {strategy}
            </span>
          </div>
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
          
          {/* Activity List */}
          <div>
            <div style={{ fontSize: '14px', color: '#94a3b8', padding: '32px 0', textAlign: 'center' }}>
              Keine Aktivität
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
