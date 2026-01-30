"use strict";
// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummarizerPrompt = exports.SUMMARIZER_STRATEGY = exports.getFormatterPrompt = exports.FORMATTER_STRATEGY = exports.getCoderPrompt = exports.CODER_STRATEGY = exports.DEFAULT_STRATEGY_ID = exports.STRATEGIES_MAP = exports.STRATEGIES = void 0;
exports.getStrategy = getStrategy;
exports.getPromptForStrategy = getPromptForStrategy;
// shared/strategies/index.ts
const coder_1 = require("./coder");
const formatter_1 = require("./formatter");
const summarizer_1 = require("./summarizer");
// Export all strategies as array
exports.STRATEGIES = [
    coder_1.CODER_STRATEGY,
    formatter_1.FORMATTER_STRATEGY,
    summarizer_1.SUMMARIZER_STRATEGY,
];
// Export strategies as map for quick lookup
exports.STRATEGIES_MAP = new Map(exports.STRATEGIES.map(strategy => [strategy.id, strategy]));
// Default strategy ID
exports.DEFAULT_STRATEGY_ID = 'formatter';
// Get strategy by ID
function getStrategy(id) {
    return exports.STRATEGIES_MAP.get(id);
}
// Get prompt function by strategy ID
function getPromptForStrategy(id, text) {
    switch (id) {
        case 'coder':
            return (0, coder_1.getCoderPrompt)(text);
        case 'formatter':
            return (0, formatter_1.getFormatterPrompt)(text);
        case 'summarizer':
            return (0, summarizer_1.getSummarizerPrompt)(text);
        default:
            return (0, formatter_1.getFormatterPrompt)(text);
    }
}
// Re-export individual strategy modules
var coder_2 = require("./coder");
Object.defineProperty(exports, "CODER_STRATEGY", { enumerable: true, get: function () { return coder_2.CODER_STRATEGY; } });
Object.defineProperty(exports, "getCoderPrompt", { enumerable: true, get: function () { return coder_2.getCoderPrompt; } });
var formatter_2 = require("./formatter");
Object.defineProperty(exports, "FORMATTER_STRATEGY", { enumerable: true, get: function () { return formatter_2.FORMATTER_STRATEGY; } });
Object.defineProperty(exports, "getFormatterPrompt", { enumerable: true, get: function () { return formatter_2.getFormatterPrompt; } });
var summarizer_2 = require("./summarizer");
Object.defineProperty(exports, "SUMMARIZER_STRATEGY", { enumerable: true, get: function () { return summarizer_2.SUMMARIZER_STRATEGY; } });
Object.defineProperty(exports, "getSummarizerPrompt", { enumerable: true, get: function () { return summarizer_2.getSummarizerPrompt; } });
//# sourceMappingURL=index.js.map