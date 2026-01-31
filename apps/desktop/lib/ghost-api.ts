// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

/**
 * Ghost API wrapper for communicating with the Electron main process
 */

interface SettingsData {
  typingSpeed: number;
  beepVolume: number;
  theme: 'dark' | 'darker';
}

interface APIKeyStatus {
  openai: boolean;
  anthropic: boolean;
}

interface GhostAPIClient {
  loadSettings: () => Promise<SettingsData | null>;
  saveSettings: (settings: SettingsData) => Promise<void>;
  checkAPIKeys: () => Promise<APIKeyStatus>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setStrategy: (strategyId: string) => Promise<void>;
  getHistory: () => Promise<any[]>;
}

// Window API interface
interface WindowGhostAPI {
  // Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  onRecordingStatus: (callback: (status: any) => void) => void;
  onTranscriptionComplete: (callback: (result: any) => void) => void;
  
  // Settings
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
  
  // Strategy
  setStrategy: (strategyId: string) => Promise<void>;
  
  // History
  getHistory: () => Promise<any[]>;
  
  // System checks
  checkSoxAvailable: () => Promise<boolean>;
  checkAPIKeys: () => Promise<{ openai: boolean; anthropic: boolean }>;
  
  // Listener cleanup
  removeListener?: (event: string, callback: Function) => void;
}

// Get window API safely
function getWindowAPI(): WindowGhostAPI | undefined {
  if (typeof window !== 'undefined') {
    return (window as any).ghostAPI as WindowGhostAPI | undefined;
  }
  return undefined;
}

/**
 * Ghost API client for frontend-to-backend communication
 */
export const ghostAPI: GhostAPIClient = {
  /**
   * Load settings from Electron store
   */
  loadSettings: async (): Promise<SettingsData | null> => {
    const api = getWindowAPI();
    if (api?.getSettings) {
      try {
        const settings = await api.getSettings();
        return settings as SettingsData;
      } catch (error) {
        console.error('[GhostAPI] Failed to load settings:', error);
        return null;
      }
    }
    
    // Fallback for browser mode (development)
    console.warn('[GhostAPI] Running in browser mode - using localStorage');
    const stored = localStorage.getItem('ghost-llm-settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Save settings to Electron store
   */
  saveSettings: async (settings: SettingsData): Promise<void> => {
    const api = getWindowAPI();
    if (api?.saveSettings) {
      try {
        await api.saveSettings(settings);
        return;
      } catch (error) {
        console.error('[GhostAPI] Failed to save settings:', error);
        throw error;
      }
    }
    
    // Fallback for browser mode (development)
    console.warn('[GhostAPI] Running in browser mode - using localStorage');
    localStorage.setItem('ghost-llm-settings', JSON.stringify(settings));
  },

  /**
   * Start audio recording
   */
  startRecording: async (): Promise<void> => {
    const api = getWindowAPI();
    if (api?.startRecording) {
      try {
        await api.startRecording();
      } catch (error) {
        console.error('[GhostAPI] Failed to start recording:', error);
        throw error;
      }
    } else {
      console.warn('[GhostAPI] Recording not available in browser mode');
    }
  },

  /**
   * Stop audio recording and process
   */
  stopRecording: async (): Promise<void> => {
    const api = getWindowAPI();
    if (api?.stopRecording) {
      try {
        await api.stopRecording();
      } catch (error) {
        console.error('[GhostAPI] Failed to stop recording:', error);
        throw error;
      }
    } else {
      console.warn('[GhostAPI] Recording not available in browser mode');
    }
  },

  /**
   * Set active strategy
   */
  setStrategy: async (strategyId: string): Promise<void> => {
    const api = getWindowAPI();
    if (api?.setStrategy) {
      try {
        await api.setStrategy(strategyId);
      } catch (error) {
        console.error('[GhostAPI] Failed to set strategy:', error);
        throw error;
      }
    } else {
      console.warn('[GhostAPI] Strategy setting not available in browser mode');
    }
  },

  /**
   * Get transcription history
   */
  getHistory: async (): Promise<any[]> => {
    const api = getWindowAPI();
    if (api?.getHistory) {
      try {
        return await api.getHistory();
      } catch (error) {
        console.error('[GhostAPI] Failed to get history:', error);
        return [];
      }
    }
    
    // Fallback for browser mode
    console.warn('[GhostAPI] History not available in browser mode');
    return [];
  },

  /**
   * Check API keys status from .env
   */
  checkAPIKeys: async (): Promise<APIKeyStatus> => {
    const api = getWindowAPI();
    if (api?.checkAPIKeys) {
      try {
        return await api.checkAPIKeys();
      } catch (error) {
        console.error('[GhostAPI] Failed to check API keys:', error);
        return { openai: false, anthropic: false };
      }
    }
    
    // Fallback for browser mode
    console.warn('[GhostAPI] API key check not available in browser mode');
    return { openai: false, anthropic: false };
  },
};

export default ghostAPI;
