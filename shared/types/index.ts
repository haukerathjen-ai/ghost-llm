```typescript
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
```