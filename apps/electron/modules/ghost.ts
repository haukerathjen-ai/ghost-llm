// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { clipboard } from 'electron';

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
      typingSpeed: config.typingSpeed ?? 50,
      initialDelay: config.initialDelay ?? 500,
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
    // Escape special characters for PowerShell
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '`"')
      .replace(/\$/g, '`$')
      .replace(/`/g, '``');

    // Split text into chunks to avoid command length limits
    const chunkSize = 100;
    const chunks = this.splitIntoChunks(escapedText, chunkSize);

    for (const chunk of chunks) {
      // Create PowerShell script that uses SendKeys
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        $text = "${chunk}"
        foreach ($char in $text.ToCharArray()) {
          [System.Windows.Forms.SendKeys]::SendWait($char.ToString())
          Start-Sleep -Milliseconds ${this.config.typingSpeed}
        }
      `;

      // Execute PowerShell script
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`);
    }
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
   * Pastes text using clipboard and simulates Ctrl+V / Cmd+V
   * @param text Text to paste
   */
  async pasteText(text: string): Promise<void> {
    try {
      console.log('[GhostTyper] Pasting text via clipboard...');

      // Wait for focus switch
      await this.delay(this.config.initialDelay);

      // Save current clipboard content
      const previousClipboard = clipboard.readText();

      // Copy text to clipboard
      clipboard.writeText(text);

      // Simulate Ctrl+V / Cmd+V using OS-specific commands
      switch (this.platform) {
        case 'win32':
          await this.pasteWindows();
          break;
        case 'darwin':
          await this.pasteMacOS();
          break;
        case 'linux':
          await this.pasteLinux();
          break;
        default:
          throw new Error(`Unsupported platform: ${this.platform}`);
      }

      // Restore previous clipboard content after a short delay
      await this.delay(100);
      clipboard.writeText(previousClipboard);

      console.log('[GhostTyper] Text pasted successfully');
    } catch (error) {
      this.handleError(error, 'pasteText');
    }
  }

  /**
   * Simulates Ctrl+V on Windows
   */
  private async pasteWindows(): Promise<void> {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("^v")
    `;
    await execAsync(`powershell -NoProfile -Command "${psScript}"`);
  }

  /**
   * Simulates Cmd+V on macOS
   */
  private async pasteMacOS(): Promise<void> {
    const script = `
      tell application "System Events"
        keystroke "v" using command down
      end tell
    `;
    await execAsync(`osascript -e '${script}'`);
  }

  /**
   * Simulates Ctrl+V on Linux
   */
  private async pasteLinux(): Promise<void> {
    try {
      await execAsync('which xdotool');
      await execAsync('xdotool key ctrl+v');
    } catch (error) {
      throw new Error(
        'xdotool is not installed. Please install it to use paste functionality.'
      );
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
