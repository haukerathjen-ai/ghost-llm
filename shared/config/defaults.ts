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
  sampleRate: 16000,
  channels: 1,
  audioType: 'raw'
} as const;

export const API_CONFIG = {
  whisperModel: 'whisper-1',
  claudeModel: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.3
} as const;

export const TYPING_DELAY_BEFORE_START = 500;