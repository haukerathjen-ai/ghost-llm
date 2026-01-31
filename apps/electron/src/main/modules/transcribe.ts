// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import OpenAI from 'openai';
import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Transcribes audio buffer using OpenAI Whisper API
 * @param audioBuffer - WAV audio buffer to transcribe
 * @returns Promise resolving to transcribed text
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    // Create temporary file from buffer
    const tempFileName = `whisper-${randomBytes(16).toString('hex')}.wav`;
    tempFilePath = join(tmpdir(), tempFileName);
    
    await fs.writeFile(tempFilePath, audioBuffer);

    // Attempt transcription with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Transcribe] Attempt ${attempt}/${MAX_RETRIES} - Sending to Whisper API`);
        console.log(`[Transcribe] Audio file size: ${audioBuffer.length} bytes`);
        
        // Use createReadStream for Node.js compatibility (File is browser-only)
        const fileStream = createReadStream(tempFilePath);
        
        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          language: 'de', // Explicitly set German language for better accuracy
          prompt: 'Transkribiere den deutschen Sprachbefehl genau.', // Context hint for Whisper
        });

        const transcribedText = transcription.text;
        console.log(`[Transcribe] Transcription result: "${transcribedText}"`);

        // Detect Whisper hallucinations (Amara.org, silent audio, etc.)
        const hallucinationPatterns = [
          /amara\.org/i,
          /untertitel/i,
          /community/i,
          /subtitle/i,
          /www\./i,
        ];

        const isHallucination = hallucinationPatterns.some(pattern => 
          pattern.test(transcribedText)
        );

        if (isHallucination) {
          console.error('');
          console.error('═══════════════════════════════════════════════════════════');
          console.error('[Ghost Error] Silent recording detected! Checking Microphone permissions....');
          console.error('═══════════════════════════════════════════════════════════');
          console.error('[Ghost Error] Whisper returned hallucination text (typical for silence):');
          console.error(`[Ghost Error]   "${transcribedText}"`);
          console.error('');
          console.error('[Ghost Error] This usually means:');
          console.error('[Ghost Error]   1. The microphone did not capture any audio');
          console.error('[Ghost Error]   2. Windows microphone permissions are not granted');
          console.error('[Ghost Error]   3. Wrong microphone is selected as default in Windows');
          console.error('[Ghost Error]   4. Microphone is muted or volume is too low');
          console.error('');
          console.error('[Ghost Error] Please check:');
          console.error('[Ghost Error]   - Windows Settings > Privacy > Microphone (enable for apps)');
          console.error('[Ghost Error]   - Sound Control Panel > Recording > Set correct default mic');
          console.error('[Ghost Error]   - Test microphone in Windows Sound Recorder first');
          console.error('═══════════════════════════════════════════════════════════');
          console.error('');
          
          throw new Error('Silent recording detected - no audio captured from microphone');
        }

        return transcribedText;

      } catch (error) {
        lastError = error as Error;
        console.error(`[Transcribe] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          await sleep(delay);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Transcription failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Transcribe] Fatal error after ${duration}ms:`, error);
    throw error;

  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error(`[Transcribe] Failed to clean up temporary file:`, cleanupError);
      }
    }
  }
}

/**
 * Helper function to delay execution
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}