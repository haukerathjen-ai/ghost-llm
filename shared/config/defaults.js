"use strict";
// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPING_DELAY_BEFORE_START = exports.API_CONFIG = exports.AUDIO_CONFIG = exports.HOTKEY_ACCELERATOR = exports.DEFAULT_SETTINGS = void 0;
exports.DEFAULT_SETTINGS = {
    typingSpeed: 100,
    useClipboard: false,
    theme: 'dark'
};
exports.HOTKEY_ACCELERATOR = 'CommandOrControl+Shift+G';
exports.AUDIO_CONFIG = {
    sampleRate: 16000,
    channels: 1,
    audioType: 'raw'
};
exports.API_CONFIG = {
    whisperModel: 'whisper-1',
    claudeModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.3
};
exports.TYPING_DELAY_BEFORE_START = 500;
//# sourceMappingURL=defaults.js.map