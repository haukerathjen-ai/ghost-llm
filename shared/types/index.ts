// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// Shared TypeScript interfaces and types

export interface TranscriptionRecord {
  id: string;
  timestamp: Date;
  originalText: string;
  enrichedText: string;
  strategyId: string;
  duration: number;
}

export interface AppSettings {
  typingSpeed: number;
  beepVolume: number;
  theme: 'dark' | 'darker';
}

export interface APIKeyStatus {
  openai: boolean;
  anthropic: boolean;
}

export type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'enriching' | 'typing';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  audioFile?: string;
  transcription: string;
  enrichedText?: string;
  strategy: string;
  duration?: number;
  language?: string;
}

export interface ActivityLogEntry {
  timestamp: Date;
  action: string;
}
