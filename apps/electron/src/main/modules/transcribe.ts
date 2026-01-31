// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import OpenAI from 'openai';
import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { preprocessAudio, isSilentAudio, analyzeAudio } from './audio-processor';
import { validateTranscription, postProcessTranscription, logValidationResult } from './transcribe-validator';
import { transcribeAudioLocal } from './transcribe-local';
import { getStore } from './store';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Transcribes audio buffer using local or cloud Whisper
 * @param audioBuffer - WAV audio buffer to transcribe
 * @returns Promise resolving to transcribed text
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    console.log('[Transcribe] Analyzing audio before transcription...');
    
    // Step 1: Check if audio is silent (before processing)
    if (isSilentAudio(audioBuffer)) {
      throw new Error('Silent recording detected - no audio captured from microphone');
    }
    
    // Step 2: SKIP audio pre-processing - use raw audio directly
    // Audio processing (normalization, noise gate) seems to cause distortion
    console.log('[Transcribe] ⚠️ Skipping audio pre-processing - using raw audio');
    const processedAudio = audioBuffer; // Use raw audio instead of preprocessAudio(audioBuffer)
    
    // Step 3: Get transcription mode from settings
    const store = getStore();
    const transcriptionMode = store.get('transcriptionMode', 'auto') as 'local' | 'cloud' | 'auto';
    const localModel = store.get('localWhisperModel', 'large-v3') as string;
    const cpuThreads = store.get('whisperCpuThreads', 8) as number;
    
    console.log(`[Transcribe] Mode: ${transcriptionMode}, Local Model: ${localModel}`);
    
    // Step 4: Try local transcription first (if mode is 'local' or 'auto')
    if (transcriptionMode === 'local' || transcriptionMode === 'auto') {
      // User feedback for model loading
      if (localModel === 'medium') {
        console.log('[Transcribe] 📥 Lade Medium-Modell (1.5GB) - Bitte warten...');
      } else if (localModel === 'large') {
        console.log('[Transcribe] 📥 Lade Large-Modell (3GB) - Bitte warten...');
      } else if (localModel === 'large-v3') {
        console.log('[Transcribe] 📥 Lade Large-v3 Modell (High Precision) - Dies kann einen Moment dauern...');
      }
      
      const localResult = await tryLocalTranscription(processedAudio, localModel, cpuThreads);
      
      if (localResult.success && localResult.text) {
        return localResult.text;
      }
      
      // If local failed and mode is 'local' only, throw error
      if (transcriptionMode === 'local') {
        throw new Error(`Local transcription failed: ${localResult.error}`);
      }
      
      // If auto mode, fall back to cloud - SILENT transition, only show cloud icon
      if (transcriptionMode === 'auto') {
        console.log('[Transcribe] ☁️ Cloud-Modus aktiv');
      }
    }
    
    // Step 5: Use cloud transcription (OpenAI Whisper API)
    return await transcribeWithCloud(processedAudio);
    
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
 * Try local transcription using faster-whisper
 */
async function tryLocalTranscription(
  processedAudio: Buffer,
  modelSize: string,
  cpuThreads: number
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // Create temporary file for local transcription
    const tempFileName = `whisper-local-${randomBytes(16).toString('hex')}.wav`;
    const tempFilePath = join(tmpdir(), tempFileName);
    
    await fs.writeFile(tempFilePath, processedAudio);
    
    console.log('[Transcribe] Attempting local transcription...');
    const result = await transcribeAudioLocal(tempFilePath, modelSize, 'de', cpuThreads);
    
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    if (result.success && result.text) {
      // Post-process the transcription
      let transcribedText = postProcessTranscription(result.text);
      
      console.log(`[Transcribe] ✅ Local transcription successful: "${transcribedText}"`);
      
      return { success: true, text: transcribedText };
    } else {
      return { 
        success: false, 
        error: result.error || 'Unknown error'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Transcribe using OpenAI Whisper API (Cloud)
 */
async function transcribeWithCloud(processedAudio: Buffer): Promise<string> {
  // Elegant, minimal logging for cloud mode
  console.log('[Transcribe] ☁️ Cloud-Transkription...');
  
  let tempFilePath: string | null = null;
  
  try {
    
    // Create temporary file from processed buffer
    const tempFileName = `whisper-cloud-${randomBytes(16).toString('hex')}.wav`;
    tempFilePath = join(tmpdir(), tempFileName);
    
    await fs.writeFile(tempFilePath, processedAudio);

    // Attempt transcription with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Transcribe] Attempt ${attempt}/${MAX_RETRIES} - Sending to Whisper API`);
        console.log(`[Transcribe] Audio file size: ${processedAudio.length} bytes`);
        
        // Use createReadStream for Node.js compatibility (File is browser-only)
        const fileStream = createReadStream(tempFilePath);
        
        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          language: 'de', // Explicitly set German language for better accuracy
          temperature: 0.2, // Slight randomness to reduce hallucinations (0 can be too strict)
          response_format: 'verbose_json', // Get detailed response with confidence scores
          prompt: `Deutscher Nutzer diktiert technische Anweisungen für:
- Programmierung: JavaScript, TypeScript, Python, React, Node.js, HTML, CSS, SQL
- Code-Review, Debugging, Fehlerbehebung
- Text-Formatierung, Dokumentation, Markdown
- Häufige Befehle: "schreibe", "korrigiere", "erkläre", "formatiere", "analysiere", "debugge"
- Achte besonders auf deutsche Umlaute (ä, ö, ü, ß) und Fachbegriffe
- Technische Begriffe: API, Interface, Component, Function, Variable, Array, Object
`.trim(), // Enhanced context-aware prompt for better technical term recognition
        });

        let transcribedText = transcription.text;
        console.log(`[Transcribe] Raw transcription result: "${transcribedText}"`);

        // Step 4: Validate transcription quality
        const audioMetrics = analyzeAudio(processedAudio);
        const validation = validateTranscription(transcribedText, {
          duration: audioMetrics.duration,
          rmsLevel: audioMetrics.rmsLevel,
        });
        
        logValidationResult(validation, transcribedText);
        
        // Step 5: Post-process transcription (fix common issues)
        transcribedText = postProcessTranscription(transcribedText);
        console.log(`[Transcribe] Post-processed result: "${transcribedText}"`);

        // Step 6: Check if validation passed
        if (!validation.isValid) {
          console.warn(`[Transcribe] ⚠️ Transcription validation failed (confidence: ${validation.confidence}%)`);
          console.warn('[Transcribe] Issues:', validation.issues.join(', '));
          
          // If confidence is very low, throw error
          if (validation.confidence < 30) {
            throw new Error(`Transcription quality too low (${validation.confidence}% confidence): ${validation.issues[0]}`);
          }
        }

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
      `Cloud transcription failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    );

  } catch (error) {
    console.error(`[Transcribe] Cloud transcription error:`, error);
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