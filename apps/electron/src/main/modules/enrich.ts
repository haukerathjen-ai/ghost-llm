// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import Anthropic from '@anthropic-ai/sdk';
import { getPromptForStrategy } from '@shared/strategies';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Enriches text using Claude AI based on the selected strategy
 * @param text - The input text to enrich
 * @param strategyId - The ID of the strategy to use
 * @returns Promise<string> - The enriched text
 */
export async function enrichText(
  text: string,
  strategyId: string
): Promise<string> {
  try {
    console.log(`[Enrich] Starting enrichment with strategy: ${strategyId}`);

    // Get the prompt for the strategy
    const prompt = getPromptForStrategy(strategyId, text);

    if (!prompt) {
      throw new Error(`Strategy with id "${strategyId}" not found`);
    }

    console.log(`[Enrich] Sending request to Claude API`);
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the enriched text from response
    const enrichedText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    console.log(`[Enrich] Successfully enriched text (${enrichedText.length} chars)`);
    
    return enrichedText;
  } catch (error) {
    console.error('[Enrich] Error during text enrichment:', error);
    
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `Claude API Error (${error.status}): ${error.message}`
      );
    }
    
    throw new Error(
      `Failed to enrich text: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Builds the complete prompt by combining strategy template and user text
 * @param template - The strategy template
 * @param userText - The user's input text
 * @returns string - The complete prompt
 */
function buildPrompt(template: string, userText: string): string {
  // Replace placeholder in template with user text if it exists
  if (template.includes('{text}')) {
    return template.replace('{text}', userText);
  }
  
  // Otherwise append user text to template
  return `${template}\n\n${userText}`;
}