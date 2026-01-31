// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { EventEmitter } from 'events';
import { spawn, ChildProcess, execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { createWriteStream } from 'fs';

// @ts-ignore - node-audiorecorder doesn't have type definitions
import AudioRecorder from 'node-audiorecorder';
// @ts-ignore - mic doesn't have complete type definitions
import mic from 'mic';

interface RecorderConfig {
  sampleRate: number;
  channels: number;
  bitwidth: number;
}

export class AudioRecorder extends EventEmitter {
  private config: RecorderConfig;
  private recordingProcess: ChildProcess | null = null;
  private isRecording: boolean = false;
  private tempFilePath: string | null = null;
  private recordingStartTime: number = 0;

  constructor() {
    super();
    this.config = {
      sampleRate: 16000, // Optimal for Whisper (native training rate)
      channels: 1,
      bitwidth: 16,
    };
  }

  /**
   * Check which default microphone Windows is using
   */
  private async checkDefaultMicrophone(): Promise<void> {
    try {
      console.log('[Audio] Checking default Windows microphone...');
      
      const psScript = `
Add-Type -AssemblyName System.Speech
$devices = [System.Management.ManagementObjectSearcher]::new("SELECT * FROM Win32_SoundDevice WHERE Status='OK'").Get()
foreach ($device in $devices) {
    if ($device.Name -match "Mic|Audio|Sound") {
        Write-Output "Device: $($device.Name) - Status: $($device.Status)"
    }
}

# Also try NAudio approach to list recording devices
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class AudioDeviceInfo {
    [DllImport("winmm.dll", CharSet = CharSet.Auto)]
    public static extern int waveInGetNumDevs();
    
    [DllImport("winmm.dll", CharSet = CharSet.Auto)]
    public static extern int waveInGetDevCaps(IntPtr deviceId, ref WAVEINCAPS caps, int cbwic);
    
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct WAVEINCAPS {
        public ushort wMid;
        public ushort wPid;
        public uint vDriverVersion;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
        public string szPname;
        public uint dwFormats;
        public ushort wChannels;
        public ushort wReserved1;
    }
    
    public static string GetDefaultDevice() {
        int numDevices = waveInGetNumDevs();
        if (numDevices > 0) {
            WAVEINCAPS caps = new WAVEINCAPS();
            waveInGetDevCaps(IntPtr.Zero, ref caps, Marshal.SizeOf(typeof(WAVEINCAPS)));
            return caps.szPname;
        }
        return "No device found";
    }
    
    public static int GetDeviceCount() {
        return waveInGetNumDevs();
    }
}
'@

Write-Output "Recording Devices: $([AudioDeviceInfo]::GetDeviceCount())"
Write-Output "Default Device: $([AudioDeviceInfo]::GetDefaultDevice())"
`;

      const result = await new Promise<string>((resolve, reject) => {
        const process = spawn('powershell.exe', [
          '-NoProfile',
          '-ExecutionPolicy', 'Bypass',
          '-Command',
          psScript,
        ], { stdio: ['pipe', 'pipe', 'pipe'] });

        let output = '';
        process.stdout?.on('data', (data) => {
          output += data.toString();
        });

        process.stderr?.on('data', (data) => {
          const errStr = data.toString();
          if (!errStr.includes('Warning')) {
            console.error('[Audio] Device check stderr:', errStr);
          }
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Device check failed with code ${code}`));
          }
        });

        process.on('error', reject);
      });

      console.log('[Audio] Windows microphone info:\n', result.trim());
    } catch (error) {
      console.error('[Audio] Failed to check microphone:', (error as Error).message);
    }
  }

  /**
   * Starts audio recording using the best available method
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    try {
      // Check default microphone BEFORE starting recording
      await this.checkDefaultMicrophone();

      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // Create temporary file path
      const tempFileName = `ghost-audio-${randomBytes(8).toString('hex')}.wav`;
      this.tempFilePath = join(tmpdir(), tempFileName);

      console.log('[Audio] Recording will be saved to:', this.tempFilePath);

      // Preference order: SoX > mic (Pure Node.js) > PowerShell MCI
      if (this.isSoxAvailable()) {
        this.startSoxRecording();
      } else {
        this.startMicRecording(); // Use mic package - works natively on Windows
      }

      this.emit('recording-started');
    } catch (error) {
      this.isRecording = false;
      this.handleRecordingError(error as Error);
    }
  }

  /**
   * Check if SoX is available and get the correct path
   */
  private getSoxPath(): string | null {
    // Try common SoX installation paths on Windows
    const commonPaths = [
      'sox', // System PATH
      'C:\\Program Files (x86)\\sox-14-4-2\\sox.exe',
      'C:\\Program Files\\sox-14-4-2\\sox.exe',
      'C:\\sox\\sox.exe',
    ];

    for (const soxPath of commonPaths) {
      try {
        execSync(`"${soxPath}" --version`, { stdio: 'pipe' });
        console.log(`[Audio] ✅ SoX found at: ${soxPath}`);
        return soxPath;
      } catch {
        // Continue to next path
      }
    }

    console.warn('[Audio] ⚠️ SoX not found in common paths');
    return null;
  }

  /**
   * Check if SoX is available
   */
  private isSoxAvailable(): boolean {
    return this.getSoxPath() !== null;
  }

  /**
   * Start recording using mic package - Pure Node.js solution for Windows
   */
  private startMicRecording(): void {
    console.log('[Audio] Using mic package for recording (Pure Node.js)');
    console.log('[Audio] Target format: 16kHz, 16-bit, Mono');
    
    try {
      const micInstance = mic({
        rate: '16000', // Optimal for Whisper API
        channels: '1',
        exitOnSilence: 0,
        fileType: 'wav',
        encoding: 'signed-integer',
        bitwidth: '16',
        device: 'default'
      });

      const micInputStream = micInstance.getAudioStream();
      const fileStream = createWriteStream(this.tempFilePath!);

      micInputStream.pipe(fileStream);

      micInputStream.on('error', (error: Error) => {
        console.error('[Audio] Mic input stream error:', error);
        this.handleRecordingError(error);
      });

      fileStream.on('error', (error: Error) => {
        console.error('[Audio] File stream error:', error);
        this.handleRecordingError(error);
      });

      micInstance.start();
      
      // Store the mic instance (cast to any to store in recordingProcess)
      this.recordingProcess = micInstance as any;

      console.log('[Audio] Mic recording started successfully');

    } catch (error) {
      console.error('[Audio] Mic package failed:', error);
      console.log('[Audio] Falling back to PowerShell MCI...');
      this.startPowerShellRecording();
    }
  }

  /**
   * Start recording using SoX (Sound eXchange) - most reliable cross-platform
   */
  private startSoxRecording(): void {
    console.log('[Audio] Using SoX for recording');
    
    const soxPath = this.getSoxPath() || 'sox';
    
    // Windows-specific: Use waveaudio driver with default device
    // Format parameters MUST come before the output file
    const soxArgs = [
      '-t', 'waveaudio',  // Input: Windows audio driver
      '-d',               // Input: Default device
      '-r', this.config.sampleRate.toString(),  // Output: 16000 Hz
      '-c', this.config.channels.toString(),    // Output: 1 channel (mono)
      '-b', this.config.bitwidth.toString(),    // Output: 16 bits
      this.tempFilePath!, // Output file
    ];

    // Log the exact command being executed
    console.log(`[Audio] 🎙️ Executing SoX command:`);
    console.log(`[Audio]   ${soxPath} ${soxArgs.join(' ')}`);
    console.log(`[Audio]   Output file: ${this.tempFilePath}`);
    console.log(`[Audio]   Using Windows waveaudio driver for better compatibility`);
    
    this.recordingProcess = spawn(soxPath, soxArgs, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false 
    });

    this.recordingProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('[Audio] SoX stdout:', output.trim());
    });

    this.recordingProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      // SoX outputs progress to stderr
      if (output.includes('In:')) {
        console.log('[Audio] 📊 SoX recording in progress - capturing audio...');
      } else if (output.trim()) {
        console.log('[Audio] SoX stderr:', output.trim());
      }
    });

    this.recordingProcess.on('close', (code) => {
      console.log(`[Audio] SoX process closed with code ${code}`);
    });

    this.recordingProcess.on('error', (error) => {
      console.error('[Audio] ❌ SoX error:', error);
      console.log('[Audio] Falling back to mic package...');
      this.startMicRecording();
    });

    console.log('[Audio] ✅ SoX recording started with waveaudio driver');
  }

  /**
   * Start recording using PowerShell with improved MCI and error handling
   */
  private startPowerShellRecording(): void {
    console.log('[Audio] Using PowerShell MCI for recording');
    console.log('[Audio] Target format: 16kHz, 16-bit, Mono');
    
    const outputPath = this.tempFilePath!.replace(/\\/g, '\\\\');
    
    // Improved PowerShell script with better error handling and device selection
    const psScript = `
Add-Type -AssemblyName PresentationCore

# Audio recording using MCI with better error handling
$code = @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

public class SimpleRecorder {
    [DllImport("winmm.dll", EntryPoint = "mciSendStringW", CharSet = CharSet.Unicode)]
    private static extern int mciSendString(string command, StringBuilder returnString, int returnSize, IntPtr callback);

    private string alias = "ghostrecorder";
    private StringBuilder returnBuffer = new StringBuilder(256);

    public void StartRecording(string filePath) {
        // Close any existing instance
        mciSendString("close " + alias, null, 0, IntPtr.Zero);
        
        // Open new waveaudio device
        int result = mciSendString("open new type waveaudio alias " + alias, returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            throw new Exception("Failed to open waveaudio device: " + result + " - " + returnBuffer.ToString());
        }
        
        // Set format to milliseconds
        result = mciSendString("set " + alias + " time format milliseconds", returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        
        // Set audio format: 16-bit, 16000Hz, Mono
        result = mciSendString("set " + alias + " bitspersample 16", returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            Console.WriteLine("Warning: Could not set bitspersample: " + result);
        }
        
        result = mciSendString("set " + alias + " samplespersec 16000", returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            Console.WriteLine("Warning: Could not set samplespersec: " + result);
        }
        
        result = mciSendString("set " + alias + " channels 1", returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            Console.WriteLine("Warning: Could not set channels: " + result);
        }
        
        // Start recording
        result = mciSendString("record " + alias, returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            throw new Exception("Failed to start recording: " + result + " - " + returnBuffer.ToString());
        }
        
        Console.WriteLine("MCI Recording started successfully");
    }

    public void StopRecording(string filePath) {
        // Stop recording
        int result = mciSendString("stop " + alias, returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            Console.WriteLine("Warning: Stop command returned: " + result);
        }
        
        // Save to file
        result = mciSendString("save " + alias + " \\"" + filePath + "\\"", returnBuffer, returnBuffer.Capacity, IntPtr.Zero);
        if (result != 0) {
            Console.WriteLine("Error: Save command failed: " + result + " - " + returnBuffer.ToString());
        } else {
            Console.WriteLine("File saved successfully to: " + filePath);
        }
        
        // Close device
        mciSendString("close " + alias, null, 0, IntPtr.Zero);
        
        // Verify file was created
        if (File.Exists(filePath)) {
            FileInfo fi = new FileInfo(filePath);
            Console.WriteLine("Saved file size: " + fi.Length + " bytes");
        } else {
            Console.WriteLine("ERROR: File was not created!");
        }
    }
}
'@

Add-Type -TypeDefinition $code -Language CSharp

$recorder = New-Object SimpleRecorder
$filePath = "${outputPath}"

try {
    $recorder.StartRecording($filePath)
    Write-Host "RECORDING_STARTED"
    
    # Keep running until terminated
    while ($true) {
        Start-Sleep -Milliseconds 100
    }
} catch {
    Write-Host "ERROR: $_"
    exit 1
} finally {
    try {
        $recorder.StopRecording($filePath)
        Write-Host "RECORDING_STOPPED"
    } catch {
        Write-Host "ERROR stopping: $_"
    }
}
`;

    this.recordingProcess = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      psScript,
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    this.recordingProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('RECORDING_STARTED')) {
        console.log('[Audio] PowerShell MCI recording started');
      }
      if (output.includes('RECORDING_STOPPED')) {
        console.log('[Audio] PowerShell MCI recording stopped');
      }
    });

    this.recordingProcess.stderr?.on('data', (data) => {
      const errStr = data.toString().trim();
      if (errStr && !errStr.includes('Warning') && errStr.length > 0) {
        console.error('[Audio] PowerShell stderr:', errStr);
      }
    });

    this.recordingProcess.on('error', (error) => {
      this.handleRecordingError(error);
    });
  }

  /**
   * Stops audio recording and returns WAV formatted buffer
   */
  public async stopRecording(): Promise<Buffer> {
    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    const recordingDuration = Date.now() - this.recordingStartTime;
    console.log(`[Audio] Stopping recording after ${recordingDuration}ms`);

    try {
      this.isRecording = false;

      // Kill the recording process gracefully
      if (this.recordingProcess) {
        try {
          // Check if it's a mic instance
          if (typeof (this.recordingProcess as any).stop === 'function') {
            console.log('[Audio] Stopping mic instance...');
            (this.recordingProcess as any).stop();
          } else {
            // For SoX or other processes, send Ctrl+C equivalent
            this.recordingProcess.kill('SIGINT');
            
            // Force kill if still running
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!this.recordingProcess.killed) {
              this.recordingProcess.kill('SIGTERM');
            }
          }
        } catch (killError) {
          console.warn('[Audio] Error stopping process:', (killError as Error).message);
        }
        
        // Wait longer for file to be written (mic needs time to flush)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.recordingProcess = null;
      }

      // Try to read the recorded file
      if (this.tempFilePath) {
        try {
          // Check if file exists and has content
          const stats = await fs.stat(this.tempFilePath);
          
          // IMPORTANT: Log file size in the exact format requested
          console.log(`[Audio] Recorded file size: ${stats.size} bytes`);
          
          // Validate file size
          if (stats.size < 10240) { // Less than 10KB
            console.error(`[Audio] ⚠️ WARNING: File is too small (${stats.size} bytes < 10KB)! No audio was captured.`);
            console.error('[Audio] This indicates the microphone is not recording properly.');
            console.error('[Audio] Possible causes:');
            console.error('[Audio]   - Wrong default microphone selected in Windows');
            console.error('[Audio]   - Microphone permissions not granted');
            console.error('[Audio]   - PowerShell MCI not capturing from correct device');
          }
          
          if (stats.size > 44) { // 44 = WAV header size
            const audioBuffer = await fs.readFile(this.tempFilePath);
            
            // Validate WAV format
            await this.validateWavFormat(audioBuffer);
            
            // Clean up temp file
            try {
              await fs.unlink(this.tempFilePath);
            } catch (e) {
              // Ignore cleanup errors
            }

            this.tempFilePath = null;
            this.emit('recording-stopped', { duration: recordingDuration });
            
            return audioBuffer;
          } else {
            console.error('[Audio] Recording file is empty or too small');
          }
        } catch (fileError) {
          console.error('[Audio] Recording file not found:', (fileError as Error).message);
        }
      }

      // If we get here, return empty WAV
      console.warn('[Audio] Returning empty audio buffer');
      this.emit('recording-stopped', { duration: 0 });
      return this.createEmptyWav();
      
    } catch (error) {
      this.isRecording = false;
      throw new Error(`Failed to stop recording: ${(error as Error).message}`);
    }
  }

  /**
   * Validates that the WAV file has the correct format for Whisper
   */
  private async validateWavFormat(buffer: Buffer): Promise<void> {
    try {
      // Check WAV header
      const riffHeader = buffer.toString('ascii', 0, 4);
      const waveHeader = buffer.toString('ascii', 8, 12);
      
      if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
        console.error('[Audio] ⚠️ Invalid WAV format! RIFF/WAVE headers not found.');
        return;
      }
      
      // Read format chunk
      const fmtChunkStart = 12;
      const audioFormat = buffer.readUInt16LE(20); // Should be 1 for PCM
      const numChannels = buffer.readUInt16LE(22);
      const sampleRate = buffer.readUInt32LE(24);
      const bitsPerSample = buffer.readUInt16LE(34);
      
      console.log('[Audio] WAV Format Check:');
      console.log(`[Audio]   - Format: ${audioFormat === 1 ? 'PCM' : 'Unknown (' + audioFormat + ')'}`);
      console.log(`[Audio]   - Channels: ${numChannels} (should be 1 for Mono)`);
      console.log(`[Audio]   - Sample Rate: ${sampleRate}Hz (should be 16000 or 44100)`);
      console.log(`[Audio]   - Bits per Sample: ${bitsPerSample} (should be 16)`);
      
      // Validate format for Whisper
      if (audioFormat !== 1) {
        console.error('[Audio] ⚠️ WARNING: Audio format is not PCM! Whisper may not work.');
      }
      if (numChannels !== 1) {
        console.warn('[Audio] ⚠️ WARNING: Audio is not Mono! Expected 1 channel, got', numChannels);
      }
      if (sampleRate !== 16000 && sampleRate !== 44100) {
        console.warn(`[Audio] ⚠️ WARNING: Unusual sample rate ${sampleRate}Hz. Expected 16000 or 44100.`);
      }
      if (bitsPerSample !== 16) {
        console.warn(`[Audio] ⚠️ WARNING: Expected 16-bit audio, got ${bitsPerSample}-bit.`);
      }
      
      // Check for silence (all zeros in data section)
      const dataStart = buffer.indexOf('data');
      if (dataStart > 0) {
        const dataSize = buffer.readUInt32LE(dataStart + 4);
        const audioData = buffer.slice(dataStart + 8, dataStart + 8 + Math.min(dataSize, 1000));
        
        let nonZeroCount = 0;
        for (let i = 0; i < audioData.length; i++) {
          if (audioData[i] !== 0) {
            nonZeroCount++;
          }
        }
        
        const nonZeroPercent = (nonZeroCount / audioData.length) * 100;
        console.log(`[Audio] Non-zero audio samples: ${nonZeroPercent.toFixed(1)}%`);
        
        if (nonZeroPercent < 1) {
          console.error('[Audio] ⚠️ CRITICAL: Audio appears to be SILENCE (< 1% non-zero samples)!');
          console.error('[Audio] This will cause Whisper hallucinations like "Untertitel der Amara.org-Community"');
        }
      }
      
    } catch (error) {
      console.error('[Audio] Failed to validate WAV format:', (error as Error).message);
    }
  }

  /**
   * Creates an empty WAV file buffer (silence)
   */
  private createEmptyWav(): Buffer {
    const { sampleRate, channels, bitwidth } = this.config;
    const bitsPerSample = bitwidth;
    const blockAlign = channels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    
    // 1 second of silence
    const duration = 1;
    const dataSize = sampleRate * channels * (bitsPerSample / 8) * duration;
    const pcmBuffer = Buffer.alloc(dataSize, 0);

    const wavHeader = Buffer.alloc(44);

    // RIFF header
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
    wavHeader.write('WAVE', 8);

    // fmt chunk
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
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
   * Handles recording errors
   */
  private handleRecordingError(error: Error): void {
    this.isRecording = false;
    
    if (this.recordingProcess) {
      try {
        this.recordingProcess.kill();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.recordingProcess = null;
    }

    let errorMessage = error.message || 'Unknown recording error';

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
