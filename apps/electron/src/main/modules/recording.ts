// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { AudioRecorder } from './audio';
import { transcribeAudio } from './transcribe';
import { captureScreen } from './vision';
import { enrichTextWithVision } from './enrich';
import { ghostTyper } from './ghost';

const execAsync = promisify(exec);

/**
 * Plays a system beep sound to provide audio feedback.
 * Used to signal typing is about to start (second beep).
 */
async function playBeep(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      // Windows: Use PowerShell Console Beep (850 Hz for 200ms - slightly different tone for distinction)
      await execAsync('powershell.exe -ExecutionPolicy Bypass -Command "[console]::Beep(850, 200)"');
    } else if (process.platform === 'darwin') {
      // macOS: Play system sound
      spawn('afplay', ['/System/Library/Sounds/Ping.aiff'], { stdio: 'ignore' });
    } else {
      // Linux: Play system bell
      spawn('paplay', ['/usr/share/sounds/freedesktop/stereo/bell.oga'], { stdio: 'ignore' });
    }
  } catch (error) {
    console.error('[RecordingManager] Failed to play beep:', error);
  }
}

/**
 * Helper function for async delays
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      this.emit('status', { state: 'recording', message: '🎙️ Aufnahme läuft...' });
    });

    this.audioRecorder.on('recording-stopped', (data) => {
      this.emit('status', { state: 'processing', message: '⚙️ Verarbeite Audio...', duration: data.duration });
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
      this.state = 'recording';
      await this.audioRecorder.startRecording(); // Now async to perform device check
      this.emit('status', { state: 'recording', message: 'Recording started' });
      this.emit('activity', { timestamp: new Date(), action: 'Aufnahme gestartet' });
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
      this.state = 'processing';
      this.emit('status', { state: 'processing', message: 'Processing...' });

      // Step 1: Stop recording and get audio buffer
      const audioBuffer = await this.audioRecorder.stopRecording();

      // Step 2: Capture screenshot (RAM only)
      this.emit('status', { state: 'processing', message: '📸 Erstelle Screenshot...' });
      const screenshot = await captureScreen();
      this.emit('activity', { timestamp: new Date(), action: 'Screenshot erstellt' });

      // Step 3: Transcribe audio using Whisper (German-optimized)
      this.emit('status', { state: 'transcribing', message: '🎤 Transkribiere...' });
      this.emit('activity', { timestamp: new Date(), action: '🎤 Transkribiere...' });
      const transcribedText = await transcribeAudio(audioBuffer);
      this.emit('activity', { timestamp: new Date(), action: '✅ Transkription abgeschlossen' });

      // Step 4: Enrich with Claude Vision (sends both text and screenshot)
      this.emit('status', { state: 'enriching', message: '🧠 Claude denkt...' });
      this.emit('activity', { timestamp: new Date(), action: '🧠 Claude analysiert...' });
      const enrichedText = await enrichTextWithVision(
        transcribedText,
        screenshot,
        this.config.strategyId
      );
      this.emit('activity', { timestamp: new Date(), action: '✅ Analyse abgeschlossen' });

      // Step 5: Ghost type the result
      this.emit('status', { state: 'typing', message: '⌨️ Tippe...' });
      this.emit('activity', { timestamp: new Date(), action: '⌨️ Tippe Antwort...' });
      
      // Set typing speed if configured
      if (this.config.typingSpeed) {
        ghostTyper.setTypingSpeed(this.config.typingSpeed);
      }

      // STEALTH MODE: Play second beep to signal typing is about to start
      // Then wait 750ms to ensure OS focus is stable on target application
      await playBeep();
      await delay(750);

      // Additional 500ms safety delay before typing starts
      await delay(500);

      // Type the enriched text character by character
      await ghostTyper.typeText(enrichedText);
      this.emit('activity', { timestamp: new Date(), action: '✅ Typing abgeschlossen' });

      // Emit completion event with results
      this.emit('complete', {
        transcription: transcribedText,
        enrichedText: enrichedText,
        timestamp: new Date().toISOString(),
      });

      // Reset to idle state
      this.state = 'idle';
      this.emit('status', { state: 'idle', message: 'Ready' });
      this.emit('activity', { timestamp: new Date(), action: 'Bereit für nächste Aufnahme' });

    } catch (error) {
      this.state = 'idle';
      this.handleError(error as Error);
      
      // SAFE ERROR REPORTING: Send error via IPC to Dashboard (no typing into active app!)
      // The error is already emitted via handleError() above
      
      this.emit('status', { state: 'idle', message: '❌ Fehler aufgetreten' });
    }
  }

  /**
   * Updates the active strategy
   */
  public setStrategy(strategyId: string): void {
    this.config.strategyId = strategyId;
  }

  /**
   * Updates the typing speed
   */
  public setTypingSpeed(speed: number): void {
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
