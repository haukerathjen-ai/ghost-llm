'use client';

// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { useEffect, useState, useCallback } from 'react';
import type {
  RecordingStatus,
  TranscriptionResult,
  HistoryEntry,
  AppSettings,
  ActivityLogEntry,
} from '@shared/types';

// Extended status with pipeline phase
interface PipelineStatus {
  state: string;
  message: string;
}

// Error interface
interface GhostError {
  message: string;
  name: string;
  timestamp: string;
}

interface UseElectronIPCReturn {
  isRecording: boolean;
  status: RecordingStatus | null;
  pipelineStatus: PipelineStatus | null;
  currentTranscription: TranscriptionResult | null;
  history: HistoryEntry[];
  historyPreview: HistoryEntry[];
  settings: AppSettings | null;
  strategy: string | null;
  activityLog: ActivityLogEntry[];
  errorMessage: string | null;
  clearError: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setStrategy: (strategy: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export function useElectronIPC(): UseElectronIPCReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<RecordingStatus | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if Electron API is available
  const isElectronAvailable = typeof window !== 'undefined' && window.ghostAPI;

  // Clear error message
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Event handlers
  useEffect(() => {
    if (!isElectronAvailable) {
      console.warn('Electron API not available. Running in browser mode.');
      return;
    }

    // Recording status listener
    const handleRecordingStatus = (newStatus: RecordingStatus) => {
      setStatus(newStatus);
      setIsRecording(newStatus === 'recording');
    };

    // Transcription complete listener
    const handleTranscriptionComplete = (result: TranscriptionResult) => {
      setCurrentTranscription(result);
      setIsRecording(false);
      // Refresh history after new transcription
      refreshHistory();
    };

    // Activity log listener - keep only last 5 entries, newest first
    const handleActivityLog = (entry: ActivityLogEntry) => {
      setActivityLog((prev) => {
        const newLog = [entry, ...prev].slice(0, 5);
        return newLog;
      });
    };

    // Pipeline status listener (for visual feedback)
    const handleStatusChange = (statusUpdate: any) => {
      setPipelineStatus({
        state: statusUpdate.state || 'idle',
        message: statusUpdate.message || '',
      });
      // Also update simple recording status
      if (statusUpdate.state === 'recording') {
        setIsRecording(true);
      } else if (statusUpdate.state === 'idle') {
        setIsRecording(false);
      }
    };

    // Error listener (Safe Error Reporting)
    const handleGhostError = (error: GhostError) => {
      setErrorMessage(error.message);
      // Auto-clear error after 8 seconds
      setTimeout(() => setErrorMessage(null), 8000);
    };

    // Abort listener (Emergency Stop)
    const handleGhostAborted = () => {
      setPipelineStatus({ state: 'idle', message: '🛑 Abgebrochen' });
      setIsRecording(false);
    };

    // Subscribe to events and store cleanup functions
    const cleanupRecordingStatus = window.ghostAPI.onRecordingStatus(handleRecordingStatus);
    const cleanupTranscriptionComplete = window.ghostAPI.onTranscriptionComplete(handleTranscriptionComplete);
    const cleanupActivityLog = window.ghostAPI.onActivityLog(handleActivityLog);
    const cleanupGhostError = window.ghostAPI.onGhostError(handleGhostError);
    const cleanupGhostAborted = window.ghostAPI.onGhostAborted(handleGhostAborted);

    // Load initial data
    loadInitialData();

    // Cleanup listeners on unmount
    return () => {
      cleanupRecordingStatus();
      cleanupTranscriptionComplete();
      cleanupActivityLog();
      cleanupGhostError();
      cleanupGhostAborted();
    };
  }, [isElectronAvailable]);

  // Load initial settings and history
  const loadInitialData = async () => {
    if (!isElectronAvailable) return;

    try {
      const [userSettings, transcriptionHistory] = await Promise.all([
        window.ghostAPI.getSettings().catch(() => null),
        window.ghostAPI.getHistory().catch(() => []),
      ]);

      setSettings(userSettings);
      setHistory(transcriptionHistory);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('Cannot start recording: Electron API not available');
      return;
    }

    try {
      await window.ghostAPI.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, [isElectronAvailable]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('Cannot stop recording: Electron API not available');
      return;
    }

    try {
      await window.ghostAPI.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  }, [isElectronAvailable]);

  // Set transcription strategy
  const setStrategy = useCallback(
    async (strategy: string) => {
      if (!isElectronAvailable) {
        console.error('Cannot set strategy: Electron API not available');
        return;
      }

      try {
        await window.ghostAPI.setStrategy(strategy);
        // Strategy is managed in Electron store, not part of AppSettings
      } catch (error) {
        console.error('Failed to set strategy:', error);
      }
    },
    [isElectronAvailable]
  );

  // Refresh history
  const refreshHistory = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('Cannot refresh history: Electron API not available');
      return;
    }

    try {
      const transcriptionHistory = await window.ghostAPI.getHistory();
      setHistory(transcriptionHistory);
    } catch (error) {
      console.error('Failed to refresh history:', error);
    }
  }, [isElectronAvailable]);

  return {
    isRecording,
    status,
    pipelineStatus,
    currentTranscription,
    history,
    historyPreview: history,
    settings,
    strategy: null, // Strategy is managed separately, not part of AppSettings
    activityLog,
    errorMessage,
    clearError,
    startRecording,
    stopRecording,
    setStrategy,
    refreshHistory,
  };
}
