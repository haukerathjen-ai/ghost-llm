// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { spawn } from 'child_process';
import { join } from 'path';
import { app } from 'electron';
import { existsSync, readFileSync, unlinkSync } from 'fs';

interface LocalTranscriptionResult {
  success: boolean;
  text?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
  language?: string;
  language_probability?: number;
  duration?: number;
  device?: string;
  gpu_name?: string;
  model_size?: string;
  error?: string;
  fallback_to_cloud?: boolean;
}

/**
 * Check if Python is installed and accessible
 */
export async function checkPythonAvailability(): Promise<{ available: boolean; version?: string; path?: string }> {
  return new Promise((resolve) => {
    // Try different Python commands (python3 preferred, then python)
    const pythonCommands = ['python3', 'python'];
    
    const tryCommand = (index: number) => {
      if (index >= pythonCommands.length) {
        resolve({ available: false });
        return;
      }
      
      const cmd = pythonCommands[index];
      const process = spawn(cmd, ['--version'], { shell: true });
      
      let output = '';
      
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.includes('Python')) {
          const version = output.trim().replace('Python ', '');
          console.log(`[Transcribe Local] Python found: ${cmd} (version ${version})`);
          resolve({ available: true, version, path: cmd });
        } else {
          // Try next command
          tryCommand(index + 1);
        }
      });
      
      process.on('error', () => {
        // Try next command
        tryCommand(index + 1);
      });
    };
    
    tryCommand(0);
  });
}

/**
 * Check if faster-whisper is installed
 */
export async function checkFasterWhisperInstalled(pythonPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Don't use shell: true - causes argument parsing issues on Windows
    const process = spawn(pythonPath, ['-c', 'import faster_whisper; print("OK")']);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      // Log for debugging
      if (code !== 0 || !stdout.includes('OK')) {
        console.log(`[Transcribe Local] Check failed - code: ${code}, stdout: "${stdout.trim()}", stderr: "${stderr.trim()}"`);
      }
      
      const isInstalled = code === 0 && stdout.includes('OK');
      console.log(`[Transcribe Local] faster-whisper installed: ${isInstalled}`);
      resolve(isInstalled);
    });
    
    process.on('error', (error) => {
      console.error(`[Transcribe Local] Check error:`, error);
      resolve(false);
    });
  });
}

/**
 * Transcribe audio using local Whisper model
 * @param audioFilePath - Path to WAV audio file (16kHz, mono, 16-bit)
 * @param modelSize - Model size (tiny, base, small, medium, large)
 * @param language - Language code (de for German)
 * @param cpuThreads - Number of CPU threads to use
 * @returns Promise resolving to transcription result
 */
export async function transcribeAudioLocal(
  audioFilePath: string,
  modelSize: string = 'medium',
  language: string = 'de',
  cpuThreads: number = 8
): Promise<LocalTranscriptionResult> {
  console.log('[Transcribe Local] Starting local transcription...');
  console.log(`[Transcribe Local] Audio file: ${audioFilePath}`);
  console.log(`[Transcribe Local] Model: ${modelSize}, Language: ${language}`);
  
  // Check Python availability
  const pythonCheck = await checkPythonAvailability();
  
  if (!pythonCheck.available) {
    // Silent fallback - Python not found
    console.log('[Transcribe Local] ☁️ Cloud-Modus aktiv (Python nicht gefunden)');
    return {
      success: false,
      error: 'Python not installed',
      fallback_to_cloud: true
    };
  }
  
  console.log(`[Transcribe Local] Python gefunden: ${pythonCheck.path} (${pythonCheck.version})`);
  
  // Check faster-whisper installation
  const whisperInstalled = await checkFasterWhisperInstalled(pythonCheck.path!);
  
  if (!whisperInstalled) {
    // Silent fallback - faster-whisper not installed
    console.log('[Transcribe Local] ☁️ Cloud-Modus aktiv (faster-whisper nicht installiert)');
    return {
      success: false,
      error: 'faster-whisper not installed',
      fallback_to_cloud: true
    };
  }
  
  // Get Python script path
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const scriptPath = isDev
    ? join(process.cwd(), 'apps', 'electron', 'python', 'whisper_local.py')
    : join(process.resourcesPath, 'python', 'whisper_local.py');
  
  console.log(`[Transcribe Local] Python script path: ${scriptPath}`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Spawn Python process WITHOUT shell (more reliable exit codes on Windows)
    const pythonProcess = spawn(
      pythonCheck.path!,
      [scriptPath, audioFilePath, modelSize, language, cpuThreads.toString()],
      { 
        shell: false,  // Changed from true - shell wrapping can cause exit code issues
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      
      // Log stderr in real-time (contains progress info)
      const lines = output.split('\n').filter((line: string) => line.trim());
      lines.forEach((line: string) => {
        console.log(line);
      });
    });
    
    pythonProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      // Debug logging for exit code
      console.log(`[Transcribe Local] Python process exited with code: ${code}`);
      console.log(`[Transcribe Local] stdout length: ${stdout.length}, stderr length: ${stderr.length}`);
      
      // NUCLEAR OPTION: Check for JSON result file first
      // Python writes to file because Windows loses stdout on CUDA crashes
      const resultFilePath = audioFilePath.replace('.wav', '.json');
      let jsonContent = stdout.trim();
      
      if (!jsonContent && existsSync(resultFilePath)) {
        console.log(`[Transcribe Local] 📄 Reading result from file: ${resultFilePath}`);
        try {
          jsonContent = readFileSync(resultFilePath, 'utf-8');
          // Clean up the result file
          try {
            unlinkSync(resultFilePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        } catch (readError) {
          console.log(`[Transcribe Local] ⚠️ Could not read result file: ${readError}`);
        }
      }
      
      // Try to parse JSON output regardless of exit code
      // (CUDA cleanup can cause crashes AFTER successful output)
      if (jsonContent) {
        console.log(`[Transcribe Local] Attempting to parse JSON output (${jsonContent.length} chars)...`);
        try {
          // Parse JSON output
          const result: LocalTranscriptionResult = JSON.parse(jsonContent);
          
          if (result.success) {
            console.log(`[Transcribe Local] ✅ Transkription erfolgreich in ${duration}ms`);
            console.log(`[Transcribe Local] Resultat: "${result.text}"`);
            console.log(`[Transcribe Local] Device: ${result.device} ${result.gpu_name ? `(${result.gpu_name})` : ''}`);
            console.log(`[Transcribe Local] Sprache: ${result.language} (${(result.language_probability! * 100).toFixed(1)}%)`);
            
            // SUCCESS - ignore exit code (CUDA cleanup can cause crashes)
            if (code !== 0) {
              console.log(`[Transcribe Local] ⚠️ Exit code ${code} ignored (CUDA cleanup issue)`);
            }
            resolve(result);
            return;
          } else if (result.fallback_to_cloud) {
            // Silent fallback - error already logged by Python script with cloud emoji
            console.log(`[Transcribe Local] Wechsel zu Cloud-API...`);
            resolve(result);
            return;
          }
        } catch (parseError) {
          // If we have output but can't parse it, fall through to error handling
          console.log('[Transcribe Local] ⚠️ Failed to parse Python output, falling back to cloud');
          console.log(`[Transcribe Local] Raw output: ${jsonContent.substring(0, 200)}...`);
        }
      }
      
      // Only trigger cloud fallback if no valid JSON was received
      console.log('[Transcribe Local] ☁️ Cloud-Modus aktiv (Prozess-Fehler)');
      resolve({
        success: false,
        error: `Python process failed with code ${code}`,
        fallback_to_cloud: true
      });
    });
    
    pythonProcess.on('error', (error) => {
      // Silent fallback for spawn errors
      console.log('[Transcribe Local] ☁️ Cloud-Modus aktiv (Python-Start fehlgeschlagen)');
      resolve({
        success: false,
        error: `Failed to spawn Python process`,
        fallback_to_cloud: true
      });
    });
  });
}

/**
 * Get system capabilities for local transcription
 */
export async function getLocalTranscriptionCapabilities(): Promise<{
  pythonAvailable: boolean;
  pythonVersion?: string;
  whisperInstalled: boolean;
  gpuAvailable?: boolean;
  gpuName?: string;
}> {
  const pythonCheck = await checkPythonAvailability();
  
  if (!pythonCheck.available) {
    return {
      pythonAvailable: false,
      whisperInstalled: false
    };
  }
  
  const whisperInstalled = await checkFasterWhisperInstalled(pythonCheck.path!);
  
  // Check GPU availability via Python
  let gpuAvailable = false;
  let gpuName: string | undefined;
  
  if (whisperInstalled) {
    try {
      const gpuCheck = await new Promise<{ available: boolean; name?: string }>((resolve) => {
        const process = spawn(
          pythonCheck.path!,
          ['-c', 'import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "")'],
          { shell: true }
        );
        
        let output = '';
        
        process.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            const lines = output.trim().split('\n');
            const available = lines[0] === 'True';
            const name = lines[1] || undefined;
            resolve({ available, name });
          } else {
            resolve({ available: false });
          }
        });
        
        process.on('error', () => {
          resolve({ available: false });
        });
      });
      
      gpuAvailable = gpuCheck.available;
      gpuName = gpuCheck.name;
    } catch (error) {
      console.error('[Transcribe Local] Failed to check GPU:', error);
    }
  }
  
  return {
    pythonAvailable: true,
    pythonVersion: pythonCheck.version,
    whisperInstalled,
    gpuAvailable,
    gpuName
  };
}
