// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { EventEmitter } from 'events';
import * as recorder from 'node-record-lpcm16';
import { Readable } from 'stream';

interface RecorderConfig {
  sampleRate: number;
  channels: number;
  audioType: string;
}

export class AudioRecorder extends EventEmitter {
  private config: RecorderConfig;
  private recording: Readable | null = null;
  private audioChunks: Buffer[] = [];
  private isRecording: boolean = false;

  constructor() {
    super();
    this.config = {
      sampleRate: 16000,
      channels: 1,
      audioType: 'raw',
    };
  }

  /**
   * Starts audio recording
   */
  public startRecording(): void {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    try {
      this.audioChunks = [];
      this.isRecording = true;

      this.recording = recorder.record({
        sampleRate: this.config.sampleRate,
        channels: this.config.channels,
        audioType: this.config.audioType,
        silence: '10.0',
        threshold: 0,
      });

      if (!this.recording) {
        throw new Error('Failed to initialize audio recording stream');
      }

      this.recording.on('data', (chunk: Buffer) => {
        this.audioChunks.push(chunk);
        this.emitAudioLevel(chunk);
      });

      this.recording.on('error', (error: Error) => {
        this.handleRecordingError(error);
      });

      this.emit('recording-started');
    } catch (error) {
      this.isRecording = false;
      this.handleRecordingError(error as Error);
    }
  }

  /**
   * Stops audio recording and returns WAV formatted buffer
   */
  public stopRecording(): Buffer {
    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    try {
      if (this.recording) {
        recorder.stop();
        this.recording = null;
      }

      this.isRecording = false;

      const audioBuffer = Buffer.concat(this.audioChunks);
      const wavBuffer = this.createWavBuffer(audioBuffer);

      this.emit('recording-stopped', { duration: this.calculateDuration(audioBuffer) });

      return wavBuffer;
    } catch (error) {
      this.isRecording = false;
      throw new Error(`Failed to stop recording: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a WAV file buffer from raw PCM data
   */
  private createWavBuffer(pcmBuffer: Buffer): Buffer {
    const { sampleRate, channels } = this.config;
    const bitsPerSample = 16;
    const blockAlign = channels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;

    const wavHeader = Buffer.alloc(44);

    // RIFF header
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
    wavHeader.write('WAVE', 8);

    // fmt chunk
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // fmt chunk size
    wavHeader.writeUInt16LE(1, 20); // audio format (1 = PCM)
    wavHeader.writeUInt16LE(channels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);

    return Buffer.concat([wavHeader, pcmBuffer]);
  }

  /**
   * Calculates the duration of the audio in seconds
   */
  private calculateDuration(buffer: Buffer): number {
    const { sampleRate, channels } = this.config;
    const bytesPerSample = 2; // 16-bit audio
    const totalSamples = buffer.length / (bytesPerSample * channels);
    return totalSamples / sampleRate;
  }

  /**
   * Emits audio level for VU meter visualization
   */
  private emitAudioLevel(chunk: Buffer): void {
    try {
      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < chunk.length; i += 2) {
        const sample = chunk.readInt16LE(i);
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / (chunk.length / 2));
      const level = Math.min(100, (rms / 32768) * 100); // Normalize to 0-100

      this.emit('audio-level', level);
    } catch (error) {
      // Silently handle audio level calculation errors
    }
  }

  /**
   * Handles recording errors including missing audio devices
   */
  private handleRecordingError(error: Error): void {
    this.isRecording = false;
    
    if (this.recording) {
      try {
        recorder.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.recording = null;
    }

    let errorMessage = error.message || 'Unknown recording error';

    // Check for common audio device errors
    if (
      errorMessage.includes('ENOENT') ||
      errorMessage.includes('sox') ||
      errorMessage.includes('rec')
    ) {
      errorMessage = 'Audio recording software not found. Please install sox or arecord.';
    } else if (
      errorMessage.includes('device') ||
      errorMessage.includes('audio') ||
      errorMessage.includes('microphone')
    ) {
      errorMessage = 'No audio input device found. Please connect a microphone.';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.name = 'AudioRecordingError';

    this.emit('error', enhancedError);
    throw enhancedError;
  }

  /**
   * Returns whether recording is currently active
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Gets the current recording configuration
   */
  public getConfig(): RecorderConfig {
    return { ...this.config };
  }
}