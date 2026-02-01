// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { contextBridge, ipcRenderer } from 'electron';
import type {
  RecordingStatus,
  TranscriptionResult,
  HistoryEntry,
  Strategy,
  AppSettings,
  ActivityLogEntry
} from '@shared/types';

// Error event interface
export interface GhostError {
  message: string;
  name: string;
  timestamp: string;
}

// Abort event interface
export interface GhostAbortedEvent {
  timestamp: string;
  message: string;
}

// Define the API interface that will be exposed to the renderer
export interface GhostAPI {
  send: (channel: string, ...args: any[]) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  onRecordingStatus: (callback: (status: RecordingStatus) => void) => () => void;
  onTranscriptionComplete: (callback: (result: TranscriptionResult) => void) => () => void;
  onActivityLog: (callback: (entry: ActivityLogEntry) => void) => () => void;
  onGhostError: (callback: (error: GhostError) => void) => () => void;
  onGhostAborted: (callback: (event: GhostAbortedEvent) => void) => () => void;
  getHistory: () => Promise<HistoryEntry[]>;
  setStrategy: (strategyId: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  checkSoxAvailable: () => Promise<boolean>;
  checkAPIKeys: () => Promise<{ openai: boolean; anthropic: boolean }>;
  getLocalTranscriptionCapabilities: () => Promise<{
    pythonAvailable: boolean;
    pythonVersion?: string;
    whisperInstalled: boolean;
    gpuAvailable?: boolean;
    gpuName?: string;
  }>;
}

// Expose the API to the renderer process
const ghostAPI: GhostAPI = {
  // Send one-way IPC message to main process
  send: (channel: string, ...args: any[]): void => {
    ipcRenderer.send(channel, ...args);
  },

  // Start recording audio
  startRecording: async (): Promise<void> => {
    return ipcRenderer.invoke('recording:start');
  },

  // Stop recording audio
  stopRecording: async (): Promise<void> => {
    return ipcRenderer.invoke('recording:stop');
  },

  // Listen for recording status updates
  onRecordingStatus: (callback: (status: RecordingStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: RecordingStatus) => {
      callback(status);
    };

    ipcRenderer.on('recording:status', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('recording:status', listener);
    };
  },

  // Listen for transcription completion
  onTranscriptionComplete: (callback: (result: TranscriptionResult) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: TranscriptionResult) => {
      callback(result);
    };

    ipcRenderer.on('transcription:complete', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('transcription:complete', listener);
    };
  },

  // Listen for activity log updates
  onActivityLog: (callback: (entry: ActivityLogEntry) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, entry: ActivityLogEntry) => {
      callback(entry);
    };

    ipcRenderer.on('ghost:activity-log', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('ghost:activity-log', listener);
    };
  },

  // Listen for error events (Safe Error Reporting)
  onGhostError: (callback: (error: GhostError) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: GhostError) => {
      callback(error);
    };

    ipcRenderer.on('ghost:error', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('ghost:error', listener);
    };
  },

  // Listen for abort events (Emergency Stop)
  onGhostAborted: (callback: (event: GhostAbortedEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, abortEvent: GhostAbortedEvent) => {
      callback(abortEvent);
    };

    ipcRenderer.on('ghost:aborted', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('ghost:aborted', listener);
    };
  },

  // Get transcription history
  getHistory: async (): Promise<HistoryEntry[]> => {
    return ipcRenderer.invoke('history:get');
  },

  // Set active strategy
  setStrategy: async (strategyId: string): Promise<void> => {
    return ipcRenderer.invoke('strategy:set', strategyId);
  },

  // Get application settings
  getSettings: async (): Promise<AppSettings> => {
    return ipcRenderer.invoke('settings:get');
  },

  // Save application settings
  saveSettings: async (settings: AppSettings): Promise<void> => {
    return ipcRenderer.invoke('settings:save', settings);
  },

  // Check if SoX is available
  checkSoxAvailable: async (): Promise<boolean> => {
    return ipcRenderer.invoke('system:check-sox');
  },

  // Check API keys status
  checkAPIKeys: async (): Promise<{ openai: boolean; anthropic: boolean }> => {
    return ipcRenderer.invoke('system:check-api-keys');
  },

  // Check local transcription capabilities
  getLocalTranscriptionCapabilities: async (): Promise<{
    pythonAvailable: boolean;
    pythonVersion?: string;
    whisperInstalled: boolean;
    gpuAvailable?: boolean;
    gpuName?: string;
  }> => {
    return ipcRenderer.invoke('transcription:check-local-capabilities');
  },
};

// Expose the API to the renderer process via contextBridge
contextBridge.exposeInMainWorld('ghostAPI', ghostAPI);

// TypeScript declaration for window object
declare global {
  interface Window {
    ghostAPI: GhostAPI;
  }
}
