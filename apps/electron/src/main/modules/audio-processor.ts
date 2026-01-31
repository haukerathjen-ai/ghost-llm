// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

/**
 * Audio Pre-Processing Module
 * Improves audio quality before sending to Whisper API
 */

interface AudioMetrics {
  rmsLevel: number;
  peakLevel: number;
  silencePercentage: number;
  duration: number;
}

/**
 * Analyzes audio buffer and returns metrics
 */
export function analyzeAudio(audioBuffer: Buffer): AudioMetrics {
  // WAV header is 44 bytes
  const headerSize = 44;
  const audioData = audioBuffer.slice(headerSize);
  
  // Read audio format from WAV header
  const sampleRate = audioBuffer.readUInt32LE(24);
  const channels = audioBuffer.readUInt16LE(22);
  const bitsPerSample = audioBuffer.readUInt16LE(34);
  
  // Calculate number of samples
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(audioData.length / (bytesPerSample * channels));
  
  // Calculate duration in seconds
  const duration = totalSamples / sampleRate;
  
  let sumSquares = 0;
  let peak = 0;
  let silentSamples = 0;
  const silenceThreshold = 100; // Lowered from 500 - more sensitive to actual audio
  
  // Analyze audio samples (assuming 16-bit PCM)
  for (let i = 0; i < audioData.length - 1; i += 2) {
    const sample = audioData.readInt16LE(i);
    const absSample = Math.abs(sample);
    
    sumSquares += sample * sample;
    peak = Math.max(peak, absSample);
    
    if (absSample < silenceThreshold) {
      silentSamples++;
    }
  }
  
  const rmsLevel = Math.sqrt(sumSquares / totalSamples);
  const peakLevel = peak;
  const silencePercentage = (silentSamples / totalSamples) * 100;
  
  return {
    rmsLevel,
    peakLevel,
    silencePercentage,
    duration,
  };
}

/**
 * Normalizes audio to optimal volume level
 * Increases quiet audio, reduces loud audio
 */
export function normalizeAudio(audioBuffer: Buffer, targetRMS: number = 3000): Buffer {
  console.log('[AudioProcessor] Normalizing audio...');
  
  const headerSize = 44;
  const header = audioBuffer.slice(0, headerSize);
  const audioData = Buffer.from(audioBuffer.slice(headerSize));
  
  // Calculate current RMS
  const metrics = analyzeAudio(audioBuffer);
  console.log(`[AudioProcessor] Current RMS: ${metrics.rmsLevel.toFixed(0)}, Target: ${targetRMS}`);
  
  // If audio is already silent, don't process
  if (metrics.silencePercentage > 90) {
    console.warn('[AudioProcessor] ⚠️ Audio is mostly silence - skipping normalization');
    return audioBuffer;
  }
  
  // Calculate gain factor
  const gainFactor = metrics.rmsLevel > 0 ? targetRMS / metrics.rmsLevel : 1;
  
  // Limit gain to reasonable values (prevent extreme amplification)
  const limitedGain = Math.min(Math.max(gainFactor, 0.5), 4.0);
  
  console.log(`[AudioProcessor] Applying gain factor: ${limitedGain.toFixed(2)}x`);
  
  // Apply gain to each sample
  for (let i = 0; i < audioData.length - 1; i += 2) {
    let sample = audioData.readInt16LE(i);
    sample = Math.round(sample * limitedGain);
    
    // Prevent clipping
    sample = Math.max(-32768, Math.min(32767, sample));
    
    audioData.writeInt16LE(sample, i);
  }
  
  // Combine header and processed audio
  return Buffer.concat([header, audioData]);
}

/**
 * Applies a simple noise gate to remove background noise
 * Samples below threshold are set to zero
 * Uses adaptive threshold based on audio RMS level
 */
export function applyNoiseGate(audioBuffer: Buffer, adaptiveThreshold: number): Buffer {
  console.log('[AudioProcessor] Applying noise gate...');
  
  const headerSize = 44;
  const header = audioBuffer.slice(0, headerSize);
  const audioData = Buffer.from(audioBuffer.slice(headerSize));
  
  console.log(`[AudioProcessor] Using noise gate threshold: ${adaptiveThreshold.toFixed(0)}`);
  
  let gatedSamples = 0;
  
  // Apply gate to each sample
  for (let i = 0; i < audioData.length - 1; i += 2) {
    const sample = audioData.readInt16LE(i);
    const absSample = Math.abs(sample);
    
    if (absSample < adaptiveThreshold) {
      audioData.writeInt16LE(0, i);
      gatedSamples++;
    }
  }
  
  const totalSamples = audioData.length / 2;
  const gatePercentage = (gatedSamples / totalSamples) * 100;
  console.log(`[AudioProcessor] Noise gate removed ${gatePercentage.toFixed(1)}% of samples`);
  
  // Combine header and processed audio
  return Buffer.concat([header, audioData]);
}

/**
 * Applies a simple high-pass filter to remove low-frequency noise (< 80Hz)
 * Useful for removing rumble and electrical hum
 */
export function applyHighPassFilter(audioBuffer: Buffer, cutoffFreq: number = 80): Buffer {
  console.log('[AudioProcessor] Applying high-pass filter...');
  
  const headerSize = 44;
  const header = audioBuffer.slice(0, headerSize);
  const audioData = Buffer.from(audioBuffer.slice(headerSize));
  
  const sampleRate = audioBuffer.readUInt32LE(24);
  
  // Simple first-order IIR high-pass filter
  const RC = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = RC / (RC + dt);
  
  let prevInput = 0;
  let prevOutput = 0;
  
  // Apply filter to each sample
  for (let i = 0; i < audioData.length - 1; i += 2) {
    const input = audioData.readInt16LE(i);
    const output = alpha * (prevOutput + input - prevInput);
    
    // Prevent clipping
    const clipped = Math.max(-32768, Math.min(32767, Math.round(output)));
    
    audioData.writeInt16LE(clipped, i);
    
    prevInput = input;
    prevOutput = output;
  }
  
  console.log('[AudioProcessor] High-pass filter applied');
  
  // Combine header and processed audio
  return Buffer.concat([header, audioData]);
}

/**
 * Detects if audio is mostly silence
 */
export function isSilentAudio(audioBuffer: Buffer, silenceThreshold: number = 95): boolean {
  const metrics = analyzeAudio(audioBuffer);
  console.log(`[AudioProcessor] Silence detection: ${metrics.silencePercentage.toFixed(1)}% silent (threshold: ${silenceThreshold}%)`);
  
  // Only reject if VERY silent (>95% instead of >85%)
  return metrics.silencePercentage > silenceThreshold;
}

/**
 * Complete audio preprocessing pipeline
 * Applies all enhancements in optimal order
 */
export function preprocessAudio(audioBuffer: Buffer): Buffer {
  console.log('[AudioProcessor] Starting audio preprocessing pipeline...');
  
  const startTime = Date.now();
  
  // Step 1: Analyze original audio
  const originalMetrics = analyzeAudio(audioBuffer);
  console.log('[AudioProcessor] Original audio metrics:');
  console.log(`  - RMS Level: ${originalMetrics.rmsLevel.toFixed(0)}`);
  console.log(`  - Peak Level: ${originalMetrics.peakLevel}`);
  console.log(`  - Silence: ${originalMetrics.silencePercentage.toFixed(1)}%`);
  console.log(`  - Duration: ${originalMetrics.duration.toFixed(2)}s`);
  
  // Step 2: Check if audio is valid
  if (isSilentAudio(audioBuffer, 90)) {
    console.error('[AudioProcessor] ⚠️ Audio is mostly SILENCE - preprocessing skipped');
    return audioBuffer;
  }
  
  // Step 3: Calculate adaptive noise gate threshold from ORIGINAL audio
  const thresholdPercent = 10; // 10% of RMS (lowered from 15% for better preservation)
  const adaptiveThreshold = Math.max(30, originalMetrics.rmsLevel * (thresholdPercent / 100));
  console.log(`[AudioProcessor] Calculated adaptive threshold: ${adaptiveThreshold.toFixed(0)} (${thresholdPercent}% of RMS ${originalMetrics.rmsLevel.toFixed(0)})`);
  
  // Step 4: Apply noise gate (remove background noise)
  // Skipping high-pass filter as it weakens speech signal too much
  let processed = applyNoiseGate(audioBuffer, adaptiveThreshold);
  
  // Step 5: Normalize audio (optimize volume)
  processed = normalizeAudio(processed, 3000);
  
  // Step 6: Analyze processed audio
  const processedMetrics = analyzeAudio(processed);
  console.log('[AudioProcessor] Processed audio metrics:');
  console.log(`  - RMS Level: ${processedMetrics.rmsLevel.toFixed(0)}`);
  console.log(`  - Peak Level: ${processedMetrics.peakLevel}`);
  console.log(`  - Silence: ${processedMetrics.silencePercentage.toFixed(1)}%`);
  
  const duration = Date.now() - startTime;
  console.log(`[AudioProcessor] ✅ Preprocessing completed in ${duration}ms`);
  
  return processed;
}
