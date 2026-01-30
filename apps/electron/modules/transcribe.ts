// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import OpenAI from 'openai';
import { promises as fs } from 'fs';
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
    
    console.log(`[Transcribe] Writing audio buffer to temporary file: ${tempFilePath}`);
    await fs.writeFile(tempFilePath, audioBuffer);

    // Attempt transcription with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Transcribe] Attempt ${attempt}/${MAX_RETRIES} - Sending to Whisper API`);
        
        const fileStream = await fs.readFile(tempFilePath);
        const file = new File([fileStream], tempFileName, { type: 'audio/wav' });
        
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: 'whisper-1',
        });

        const duration = Date.now() - startTime;
        console.log(`[Transcribe] Successfully transcribed audio in ${duration}ms`);
        console.log(`[Transcribe] Transcribed text length: ${transcription.text.length} characters`);

        return transcription.text;

      } catch (error) {
        lastError = error as Error;
        console.error(`[Transcribe] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          console.log(`[Transcribe] Retrying in ${delay}ms...`);
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
        console.log(`[Transcribe] Cleaned up temporary file: ${tempFilePath}`);
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