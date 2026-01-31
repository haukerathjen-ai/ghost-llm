// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

interface GhostTyperConfig {
  typingSpeed?: number; // delay in ms between characters
  initialDelay?: number; // delay before starting to type
}

export class GhostTyper {
  private config: Required<GhostTyperConfig>;
  private platform: NodeJS.Platform;

  constructor(config: GhostTyperConfig = {}) {
    this.config = {
      typingSpeed: config.typingSpeed ?? 30, // 30ms between characters for smooth typing
      initialDelay: config.initialDelay ?? 500, // 0.5 seconds (750ms already in recording.ts)
    };
    this.platform = process.platform;
  }

  /**
   * Types text character by character using OS-native commands
   * @param text Text to type
   * @throws Error if typing fails or platform is unsupported
   */
  async typeText(text: string): Promise<void> {
    try {
      console.log('[GhostTyper] Starting text typing...');

      // Wait for focus switch (user switches to target application)
      await this.delay(this.config.initialDelay);

      // Use platform-specific typing method
      switch (this.platform) {
        case 'win32':
          await this.typeTextWindows(text);
          break;
        case 'darwin':
          await this.typeTextMacOS(text);
          break;
        case 'linux':
          await this.typeTextLinux(text);
          break;
        default:
          throw new Error(`Unsupported platform: ${this.platform}`);
      }

      console.log('[GhostTyper] Text typing completed successfully');
    } catch (error) {
      this.handleError(error, 'typeText');
    }
  }

  /**
   * Types text on Windows using PowerShell SendKeys
   */
  private async typeTextWindows(text: string): Promise<void> {
    console.log(`[GhostTyper] Typing ${text.length} characters on Windows`);
    
    // Use unique placeholders that won't conflict
    const NEWLINE = '\x01NL\x01';
    const LBRACE = '\x01LB\x01';
    const RBRACE = '\x01RB\x01';
    const PLUS = '\x01PL\x01';
    const CARET = '\x01CA\x01';
    const PERCENT = '\x01PC\x01';
    const TILDE = '\x01TI\x01';
    const LBRACKET = '\x01LS\x01';
    const RBRACKET = '\x01RS\x01';
    const LPAREN = '\x01LP\x01';
    const RPAREN = '\x01RP\x01';
    
    // Step 1: Replace ALL special chars with unique placeholders FIRST
    let escapedText = text
      .replace(/\r?\n/g, NEWLINE)
      .replace(/\{/g, LBRACE)
      .replace(/\}/g, RBRACE)
      .replace(/\+/g, PLUS)
      .replace(/\^/g, CARET)
      .replace(/%/g, PERCENT)
      .replace(/~/g, TILDE)
      .replace(/\[/g, LBRACKET)
      .replace(/\]/g, RBRACKET)
      .replace(/\(/g, LPAREN)
      .replace(/\)/g, RPAREN);
    
    // Escape backticks and single quotes for PowerShell
    escapedText = escapedText.replace(/'/g, "''");
    
    // Step 2: Replace placeholders with SendKeys codes
    // Order matters! Do this AFTER escaping quotes
    escapedText = escapedText
      .replace(/\x01NL\x01/g, '{ENTER}')
      .replace(/\x01LB\x01/g, '{{}')
      .replace(/\x01RB\x01/g, '{}}')
      .replace(/\x01PL\x01/g, '{+}')
      .replace(/\x01CA\x01/g, '{^}')
      .replace(/\x01PC\x01/g, '{%}')
      .replace(/\x01TI\x01/g, '{~}')
      .replace(/\x01LS\x01/g, '{[}')
      .replace(/\x01RS\x01/g, '{]}')
      .replace(/\x01LP\x01/g, '{(}')
      .replace(/\x01RP\x01/g, '{)}');

    // Split text into chunks to avoid command length limits
    // Be careful not to split in the middle of a {KEY} sequence
    const chunks = this.splitIntoSendKeysChunks(escapedText, 35);

    console.log(`[GhostTyper] Split into ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[GhostTyper] Typing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);
      
      // Create PowerShell script that sends the whole chunk at once
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${chunk}')`;

      try {
        // Execute PowerShell script using single quotes
        await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, {
          timeout: 30000,
        });
        
        // Small delay between chunks
        await this.delay(30);
      } catch (error) {
        console.error(`[GhostTyper] Error typing chunk ${i + 1}:`, error);
        throw error;
      }
    }
  }

  /**
   * Split text into chunks without breaking SendKeys sequences like {ENTER}
   */
  private splitIntoSendKeysChunks(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let i = 0;
    
    while (i < text.length) {
      // Check if we're at the start of a SendKeys sequence
      if (text[i] === '{') {
        // Find the closing brace
        const closeIndex = text.indexOf('}', i);
        if (closeIndex !== -1) {
          const sequence = text.substring(i, closeIndex + 1);
          
          // If adding this sequence would exceed max, start new chunk
          if (currentChunk.length + sequence.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = '';
          }
          
          currentChunk += sequence;
          i = closeIndex + 1;
          continue;
        }
      }
      
      // Regular character
      if (currentChunk.length >= maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      currentChunk += text[i];
      i++;
    }
    
    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Types text on macOS using AppleScript
   */
  private async typeTextMacOS(text: string): Promise<void> {
    // Escape special characters for AppleScript
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');

    // Create temporary AppleScript file
    const scriptPath = join(tmpdir(), `ghost-typer-${Date.now()}.scpt`);

    // Split text into chunks
    const chunkSize = 100;
    const chunks = this.splitIntoChunks(escapedText, chunkSize);

    try {
      for (const chunk of chunks) {
        const script = `
          tell application "System Events"
            repeat with i from 1 to length of "${chunk}"
              keystroke (character i of "${chunk}")
              delay ${this.config.typingSpeed / 1000}
            end repeat
          end tell
        `;

        await writeFile(scriptPath, script, 'utf-8');
        await execAsync(`osascript "${scriptPath}"`);
      }
    } finally {
      // Clean up temporary script file
      try {
        await unlink(scriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Types text on Linux using xdotool
   */
  private async typeTextLinux(text: string): Promise<void> {
    // Check if xdotool is available
    try {
      await execAsync('which xdotool');
    } catch (error) {
      throw new Error(
        'xdotool is not installed. Please install it: sudo apt-get install xdotool (Debian/Ubuntu) or sudo yum install xdotool (RHEL/Fedora)'
      );
    }

    // Escape special characters for shell
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'");

    // Split text into chunks
    const chunkSize = 100;
    const chunks = this.splitIntoChunks(escapedText, chunkSize);

    for (const chunk of chunks) {
      // Use xdotool to type text with delay
      await execAsync(`xdotool type --delay ${this.config.typingSpeed} "${chunk}"`);
    }
  }

  /**
   * Updates typing speed configuration
   * @param speed New typing speed in ms
   */
  setTypingSpeed(speed: number): void {
    this.config.typingSpeed = speed;
  }

  /**
   * Updates initial delay configuration
   * @param delay New initial delay in ms
   */
  setInitialDelay(delay: number): void {
    this.config.initialDelay = delay;
  }

  /**
   * Helper method to split text into chunks
   */
  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Helper method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handles errors and provides helpful messages
   */
  private handleError(error: unknown, method: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);

    let enhancedMessage = `[GhostTyper.${method}] Failed to execute: ${errorMessage}`;

    // Add platform-specific help
    if (this.platform === 'darwin') {
      enhancedMessage += '\n\nOn macOS, make sure the app has Accessibility permissions:';
      enhancedMessage += '\nSystem Preferences → Security & Privacy → Privacy → Accessibility';
    } else if (this.platform === 'linux') {
      enhancedMessage += '\n\nOn Linux, make sure xdotool is installed:';
      enhancedMessage += '\nsudo apt-get install xdotool (Debian/Ubuntu)';
      enhancedMessage += '\nsudo yum install xdotool (RHEL/Fedora)';
    }

    throw new Error(enhancedMessage);
  }
}

// Export default instance with default config
export const ghostTyper = new GhostTyper();
