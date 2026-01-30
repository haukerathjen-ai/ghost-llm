// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// Type declarations for node-record-lpcm16

declare module 'node-record-lpcm16' {
  import { Readable } from 'stream';

  export interface RecordingOptions {
    sampleRate?: number;
    channels?: number;
    audioType?: string;
    silence?: string;
    threshold?: number;
    device?: string | null;
  }

  export function record(options?: RecordingOptions): Readable | null;
  export function stop(): void;
}
