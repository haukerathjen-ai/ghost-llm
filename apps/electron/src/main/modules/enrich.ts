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
      model: 'claude-sonnet-4-20250514',
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
 * Enriches text using Claude Vision API with screenshot context
 * @param text - The transcribed text from user
 * @param screenshotBase64 - Base64-encoded PNG screenshot
 * @param strategyId - The ID of the strategy to use
 * @returns Promise<string> - The enriched text
 */
export async function enrichTextWithVision(
  text: string,
  screenshotBase64: string,
  strategyId: string
): Promise<string> {
  try {
    console.log(`[Enrich] Starting vision enrichment with strategy: ${strategyId}`);
    console.log(`[Enrich] Transcribed text: "${text}"`);

    // Get the strategy prompt template (WITHOUT inserting text yet)
    // We'll handle text insertion in the vision prompt directly
    const basePrompt = getPromptForStrategy(strategyId, '');

    if (!basePrompt) {
      throw new Error(`Strategy with id "${strategyId}" not found`);
    }

    // Create vision-enhanced system prompt
    const visionPrompt = `You are Ghost LLM, an AI assistant that responds intelligently to voice commands.

=== CRITICAL: USER'S SPOKEN REQUEST (MOST IMPORTANT) ===
The user said via voice input:
"${text}"

This is what you MUST respond to! The user's voice input is the PRIMARY instruction.

=== SCREEN CONTEXT (SECONDARY) ===
A screenshot is provided as additional context ONLY. Use it to understand the situation, but react primarily to the voice command.

=== STRATEGY GUIDANCE (${strategyId}) ===
${basePrompt}

=== CRITICAL DECISION RULES (OVERRIDE ALL STRATEGY PROMPTS) ===

ANALYZE THE VOICE INPUT FIRST:

1. Is it a JOKE/ENTERTAINMENT request?
   Keywords: "Witz", "joke", "erzähl", "lustig", "tell me"
   → Output: A short joke or entertainment text (NO CODE, NO MARKDOWN)

2. Is it a QUESTION?
   Keywords: "Wie", "Was", "Warum", "Who", "What", "Why", "How"
   → Output: Direct text answer (NO CODE)

3. Is it GENERAL CONVERSATION?
   → Output: Conversational text response (NO CODE)

4. Is it an EXPLICIT CODE REQUEST?
   Keywords: "schreib code", "create function", "implement", "code for"
   → Output: Code (with proper formatting)

5. Does it mention a SCREEN PROBLEM/BUG and asks to fix it?
   → Output: Fixed code

=== OUTPUT FORMAT (ABSOLUTELY CRITICAL) ===
- Return ONLY the raw content that should be typed
- NO introductions: NO "Hier ist...", NO "Here's...", NO "Antwort:"
- NO markdown formatting UNLESS providing actual code
- NO explanations or commentary
- Just the pure joke/answer/code

REMEMBER: User said "${text}" - React to THESE WORDS primarily!`;

    console.log(`[Enrich] Sending request to Claude Vision API`);
    
    // Call Claude Vision API with image
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: visionPrompt,
            },
          ],
        },
      ],
    });

    // Extract the enriched text from response
    const enrichedText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    console.log(`[Enrich] Successfully enriched with vision (${enrichedText.length} chars)`);
    
    return enrichedText;
  } catch (error) {
    console.error('[Enrich] Error during vision enrichment:', error);
    
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `Claude Vision API Error (${error.status}): ${error.message}`
      );
    }
    
    throw new Error(
      `Failed to enrich with vision: ${error instanceof Error ? error.message : 'Unknown error'}`
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