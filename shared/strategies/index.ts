// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// shared/strategies/index.ts

import { CODER_STRATEGY, getCoderPrompt } from './coder';
import { FORMATTER_STRATEGY, getFormatterPrompt } from './formatter';
import { SUMMARIZER_STRATEGY, getSummarizerPrompt } from './summarizer';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Export all strategies as array
export const STRATEGIES: Strategy[] = [
  CODER_STRATEGY,
  FORMATTER_STRATEGY,
  SUMMARIZER_STRATEGY,
];

// Export strategies as map for quick lookup
export const STRATEGIES_MAP = new Map<string, Strategy>(
  STRATEGIES.map(strategy => [strategy.id, strategy])
);

// Default strategy ID
export const DEFAULT_STRATEGY_ID = 'formatter';

// Get strategy by ID
export function getStrategy(id: string): Strategy | undefined {
  return STRATEGIES_MAP.get(id);
}

// Get prompt function by strategy ID
export function getPromptForStrategy(id: string, text: string): string {
  switch (id) {
    case 'coder':
      return getCoderPrompt(text);
    case 'formatter':
      return getFormatterPrompt(text);
    case 'summarizer':
      return getSummarizerPrompt(text);
    default:
      return getFormatterPrompt(text);
  }
}

// Re-export individual strategy modules
export { CODER_STRATEGY, getCoderPrompt } from './coder';
export { FORMATTER_STRATEGY, getFormatterPrompt } from './formatter';
export { SUMMARIZER_STRATEGY, getSummarizerPrompt } from './summarizer';
