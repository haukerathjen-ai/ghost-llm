// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

/**
 * Type definitions for Ghost LLM Electron API
 * This file extends the Window interface with the ghostAPI object
 */

import type {
  RecordingStatus,
  TranscriptionResult,
  HistoryEntry,
  AppSettings,
  ActivityLogEntry,
} from '@shared/types';

// Error event interface
interface GhostError {
  message: string;
  name: string;
  timestamp: string;
}

// Abort event interface
interface GhostAbortedEvent {
  timestamp: string;
  message: string;
}

interface GhostAPI {
  // Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  onRecordingStatus: (callback: (status: RecordingStatus) => void) => () => void;
  onTranscriptionComplete: (callback: (result: TranscriptionResult) => void) => () => void;
  
  // Settings
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Strategy
  setStrategy: (strategyId: string) => Promise<void>;
  
  // History
  getHistory: () => Promise<HistoryEntry[]>;
  
  // Activity Log
  onActivityLog: (callback: (entry: ActivityLogEntry) => void) => () => void;
  
  // Error handling (Safe Error Reporting)
  onGhostError: (callback: (error: GhostError) => void) => () => void;
  
  // Emergency Stop
  onGhostAborted: (callback: (event: GhostAbortedEvent) => void) => () => void;
  
  // System checks
  checkSoxAvailable: () => Promise<boolean>;
  checkAPIKeys: () => Promise<{ openai: boolean; anthropic: boolean }>;
  getLocalTranscriptionCapabilities: () => Promise<{
    pythonAvailable: boolean;
    pythonVersion?: string;
    whisperInstalled: boolean;
    gpuAvailable?: boolean;
    gpuName?: string;
  }>;
  
  // Utility
  send: (channel: string, ...args: any[]) => void;
}

declare global {
  interface Window {
    ghostAPI: GhostAPI;
  }
}

export {};
