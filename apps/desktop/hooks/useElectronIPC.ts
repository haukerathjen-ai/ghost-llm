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

interface UseElectronIPCReturn {
  isRecording: boolean;
  status: RecordingStatus | null;
  currentTranscription: TranscriptionResult | null;
  history: HistoryEntry[];
  historyPreview: HistoryEntry[];
  settings: AppSettings | null;
  strategy: string | null;
  activityLog: ActivityLogEntry[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setStrategy: (strategy: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export function useElectronIPC(): UseElectronIPCReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<RecordingStatus | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  // Check if Electron API is available
  const isElectronAvailable = typeof window !== 'undefined' && window.ghostAPI;

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

    // Subscribe to events and store cleanup functions
    const cleanupRecordingStatus = window.ghostAPI.onRecordingStatus(handleRecordingStatus);
    const cleanupTranscriptionComplete = window.ghostAPI.onTranscriptionComplete(handleTranscriptionComplete);
    const cleanupActivityLog = window.ghostAPI.onActivityLog(handleActivityLog);

    // Load initial data
    loadInitialData();

    // Cleanup listeners on unmount
    return () => {
      cleanupRecordingStatus();
      cleanupTranscriptionComplete();
      cleanupActivityLog();
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
    currentTranscription,
    history,
    historyPreview: history,
    settings,
    strategy: null, // Strategy is managed separately, not part of AppSettings
    activityLog,
    startRecording,
    stopRecording,
    setStrategy,
    refreshHistory,
  };
}
