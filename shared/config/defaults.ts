// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// shared/config/defaults.ts

export interface AppSettings {
  typingSpeed: number;
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  typingSpeed: 100,
  theme: 'dark'
};

export const HOTKEY_ACCELERATOR = 'CommandOrControl+Shift+G';

export const AUDIO_CONFIG = {
  sampleRate: 16000, // Optimal for Whisper (native training rate)
  channels: 1,
  audioType: 'raw',
  preprocessing: {
    enabled: true,
    normalize: true,
    noiseGate: true,
    highPassFilter: true,
  },
  validation: {
    enabled: true,
    minConfidence: 30,
    checkHallucinations: true,
  }
} as const;

export const API_CONFIG = {
  whisperModel: 'whisper-1',
  claudeModel: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.3
} as const;

export const TRANSCRIPTION_CONFIG = {
  mode: 'auto' as 'local' | 'cloud' | 'auto', // auto = local first, fallback to cloud
  localModel: 'medium' as 'tiny' | 'base' | 'small' | 'medium' | 'large',
  language: 'de',
  cpuThreads: 8,
  gpuEnabled: true
} as const;

export const TYPING_DELAY_BEFORE_START = 500;