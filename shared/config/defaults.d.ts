export interface AppSettings {
    typingSpeed: number;
    useClipboard: boolean;
    theme: 'dark' | 'light';
}
export declare const DEFAULT_SETTINGS: AppSettings;
export declare const HOTKEY_ACCELERATOR = "CommandOrControl+Shift+G";
export declare const AUDIO_CONFIG: {
    readonly sampleRate: 16000;
    readonly channels: 1;
    readonly audioType: "raw";
};
export declare const API_CONFIG: {
    readonly whisperModel: "whisper-1";
    readonly claudeModel: "claude-3-5-sonnet-20241022";
    readonly maxTokens: 4096;
    readonly temperature: 0.3;
};
export declare const TYPING_DELAY_BEFORE_START = 500;
//# sourceMappingURL=defaults.d.ts.map