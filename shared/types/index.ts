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
  openaiKey: string;
  anthropicKey: string;
  typingSpeed: number;
  useClipboard: boolean;
  theme: 'dark' | 'darker';
}

export type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'enriching' | 'typing';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
}