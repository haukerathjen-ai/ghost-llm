// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { EventEmitter } from 'events';
import { AudioRecorder } from './audio';
import { transcribeAudio } from './transcribe';
import { captureScreen } from './vision';
import { enrichTextWithVision } from './enrich';
import { ghostTyper } from './ghost';

export type RecordingState = 'idle' | 'recording' | 'processing';

export interface RecordingManagerConfig {
  strategyId: string;
  typingSpeed?: number;
}

/**
 * RecordingManager orchestrates the entire workflow:
 * 1. Hotkey -> Start Recording + Sound
 * 2. Hotkey again -> Stop Recording + Screenshot + Transcribe
 * 3. Send to Claude Vision for enrichment
 * 4. Ghost type the result
 */
export class RecordingManager extends EventEmitter {
  private audioRecorder: AudioRecorder;
  private state: RecordingState = 'idle';
  private config: RecordingManagerConfig;

  constructor(config: RecordingManagerConfig) {
    super();
    this.config = config;
    this.audioRecorder = new AudioRecorder();

    // Forward audio recorder events
    this.audioRecorder.on('recording-started', () => {
      this.emit('status', { state: 'recording', message: 'Recording audio...' });
    });

    this.audioRecorder.on('recording-stopped', (data) => {
      this.emit('status', { state: 'processing', message: 'Processing audio...', duration: data.duration });
    });

    this.audioRecorder.on('audio-level', (level) => {
      this.emit('audio-level', level);
    });

    this.audioRecorder.on('error', (error) => {
      this.handleError(error);
    });
  }

  /**
   * Toggles recording state - starts if idle, stops and processes if recording
   */
  public async toggleRecording(): Promise<void> {
    if (this.state === 'idle') {
      await this.startRecording();
    } else if (this.state === 'recording') {
      await this.stopAndProcess();
    } else {
      console.warn('[RecordingManager] Cannot toggle while processing');
    }
  }

  /**
   * Starts audio recording
   */
  public async startRecording(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error('Recording already in progress or processing');
    }

    try {
      console.log('[RecordingManager] Starting recording...');
      this.state = 'recording';
      this.audioRecorder.startRecording();
      this.emit('status', { state: 'recording', message: 'Recording started' });
    } catch (error) {
      this.state = 'idle';
      this.handleError(error as Error);
    }
  }

  /**
   * Stops recording and processes the complete workflow
   */
  public async stopAndProcess(): Promise<void> {
    if (this.state !== 'recording') {
      throw new Error('No recording in progress');
    }

    try {
      console.log('[RecordingManager] Stopping recording and processing...');
      this.state = 'processing';
      this.emit('status', { state: 'processing', message: 'Processing...' });

      // Step 1: Stop recording and get audio buffer
      const audioBuffer = this.audioRecorder.stopRecording();
      console.log('[RecordingManager] Audio recording stopped');

      // Step 2: Capture screenshot (RAM only)
      this.emit('status', { state: 'processing', message: 'Capturing screenshot...' });
      const screenshot = await captureScreen();
      console.log('[RecordingManager] Screenshot captured');

      // Step 3: Transcribe audio using Whisper
      this.emit('status', { state: 'processing', message: 'Transcribing audio...' });
      const transcribedText = await transcribeAudio(audioBuffer);
      console.log('[RecordingManager] Transcription complete:', transcribedText);

      // Step 4: Enrich with Claude Vision (sends both text and screenshot)
      this.emit('status', { state: 'processing', message: 'Enriching with AI...' });
      const enrichedText = await enrichTextWithVision(
        transcribedText,
        screenshot,
        this.config.strategyId
      );
      console.log('[RecordingManager] Enrichment complete');

      // Step 5: Ghost type the result
      this.emit('status', { state: 'processing', message: 'Typing result...' });
      
      // Set typing speed if configured
      if (this.config.typingSpeed) {
        ghostTyper.setTypingSpeed(this.config.typingSpeed);
      }

      await ghostTyper.typeText(enrichedText);
      console.log('[RecordingManager] Ghost typing complete');

      // Emit completion event with results
      this.emit('complete', {
        transcription: transcribedText,
        enrichedText: enrichedText,
        timestamp: new Date().toISOString(),
      });

      // Reset to idle state
      this.state = 'idle';
      this.emit('status', { state: 'idle', message: 'Ready' });

    } catch (error) {
      this.state = 'idle';
      this.handleError(error as Error);
      this.emit('status', { state: 'idle', message: 'Ready' });
    }
  }

  /**
   * Updates the active strategy
   */
  public setStrategy(strategyId: string): void {
    console.log(`[RecordingManager] Strategy changed to: ${strategyId}`);
    this.config.strategyId = strategyId;
  }

  /**
   * Updates the typing speed
   */
  public setTypingSpeed(speed: number): void {
    console.log(`[RecordingManager] Typing speed changed to: ${speed}ms`);
    this.config.typingSpeed = speed;
    ghostTyper.setTypingSpeed(speed);
  }

  /**
   * Gets the current recording state
   */
  public getState(): RecordingState {
    return this.state;
  }

  /**
   * Checks if currently recording
   */
  public isRecording(): boolean {
    return this.state === 'recording';
  }

  /**
   * Checks if currently processing
   */
  public isProcessing(): boolean {
    return this.state === 'processing';
  }

  /**
   * Handles errors and emits error events
   */
  private handleError(error: Error): void {
    console.error('[RecordingManager] Error:', error);
    this.emit('error', {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.audioRecorder.removeAllListeners();
    this.removeAllListeners();
    this.state = 'idle';
  }
}

// Export singleton instance
let recordingManagerInstance: RecordingManager | null = null;

export function getRecordingManager(config?: RecordingManagerConfig): RecordingManager {
  if (!recordingManagerInstance && config) {
    recordingManagerInstance = new RecordingManager(config);
  } else if (!recordingManagerInstance) {
    throw new Error('RecordingManager not initialized. Provide config on first call.');
  }
  return recordingManagerInstance;
}

export function resetRecordingManager(): void {
  if (recordingManagerInstance) {
    recordingManagerInstance.destroy();
    recordingManagerInstance = null;
  }
}
