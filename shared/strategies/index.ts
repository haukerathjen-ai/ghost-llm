// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// shared/strategies/index.ts

import { formatterStrategy } from './formatter';
import { extractorStrategy } from './extractor';
import { converterStrategy } from './converter';
import { validatorStrategy } from './validator';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  examples?: string[];
  parameters?: Record<string, any>;
}

// Export all strategies as array
export const STRATEGIES: Strategy[] = [
  formatterStrategy,
  extractorStrategy,
  converterStrategy,
  validatorStrategy,
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

// Get prompt template by strategy ID
export function getPromptTemplate(id: string): string {
  const strategy = getStrategy(id);
  return strategy?.promptTemplate || '';
}

// Re-export individual strategy modules
export { formatterStrategy } from './formatter';
export { extractorStrategy } from './extractor';
export { converterStrategy } from './converter';
export { validatorStrategy } from './validator';