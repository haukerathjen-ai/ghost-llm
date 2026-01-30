```typescript
import Store from 'electron-store';
import { defaultSettings } from '@shared/config/defaults';

export interface TranscriptionRecord {
  id: string;
  timestamp: number;
  audioFile?: string;
  transcription: string;
  strategy: string;
  duration?: number;
  language?: string;
}

export interface AppSettings {
  apiKey?: string;
  model?: string;
  language?: string;
  outputFormat?: string;
  autoSave?: boolean;
  darkMode?: boolean;
  [key: string]: any;
}

interface StoreSchema {
  history: TranscriptionRecord[];
  settings: AppSettings;
  activeStrategy: string;
}

export class AppStore {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'app-store',
      encryptionKey: process.env.STORE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
      schema: {
        history: {
          type: 'array',
          default: [],
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              timestamp: { type: 'number' },
              audioFile: { type: 'string' },
              transcription: { type: 'string' },
              strategy: { type: 'string' },
              duration: { type: 'number' },
              language: { type: 'string' },
            },
            required: ['id', 'timestamp', 'transcription', 'strategy'],
          },
        },
        settings: {
          type: 'object',
          default: defaultSettings,
        },
        activeStrategy: {
          type: 'string',
          default: 'default',
        },
      },
    });
  }

  // History methods
  getHistory(): TranscriptionRecord[] {
    return this.store.get('history', []);
  }

  addToHistory(record: TranscriptionRecord): void {
    const history = this.getHistory();
    history.unshift(record); // Add to beginning
    
    // Keep only last 100 records
    if (history.length > 100) {
      history.splice(100);
    }
    
    this.store.set('history', history);
  }

  clearHistory(): void {
    this.store.set('history', []);
  }

  // Settings methods
  getSettings(): AppSettings {
    return this.store.get('settings', defaultSettings);
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    this.store.set('settings', updatedSettings);
  }

  // Active strategy methods
  getActiveStrategy(): string {
    return this.store.get('activeStrategy', 'default');
  }

  setActiveStrategy(id: string): void {
    this.store.set('activeStrategy', id);
  }

  // Utility methods
  reset(): void {
    this.store.clear();
  }

  getAll(): StoreSchema {
    return this.store.store;
  }
}

// Export singleton instance
export const appStore = new AppStore();
```