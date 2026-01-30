```typescript
import { keyboard, Key } from '@nut-tree/nut-js';
import { clipboard } from 'electron';

interface GhostTyperConfig {
  typingSpeed?: number; // delay in ms between characters
  initialDelay?: number; // delay before starting to type
}

export class GhostTyper {
  private config: Required<GhostTyperConfig>;

  constructor(config: GhostTyperConfig = {}) {
    this.config = {
      typingSpeed: config.typingSpeed ?? 50,
      initialDelay: config.initialDelay ?? 500,
    };

    // Configure nut-js keyboard
    keyboard.config.autoDelayMs = this.config.typingSpeed;
  }

  /**
   * Types text character by character with natural typing speed
   * @param text Text to type
   * @throws Error if permissions are missing or typing fails
   */
  async typeText(text: string): Promise<void> {
    try {
      // Wait for focus switch (e.g., user switches to target application)
      await this.delay(this.config.initialDelay);

      // Type text with configured delay between characters
      await keyboard.type(text);
    } catch (error) {
      this.handleError(error, 'typeText');
    }
  }

  /**
   * Pastes text using clipboard (faster for long texts)
   * @param text Text to paste
   * @throws Error if permissions are missing or pasting fails
   */
  async pasteText(text: string): Promise<void> {
    try {
      // Wait for focus switch
      await this.delay(this.config.initialDelay);

      // Save current clipboard content
      const previousClipboard = clipboard.readText();

      // Copy text to clipboard
      clipboard.writeText(text);

      // Simulate Cmd+V (macOS) or Ctrl+V (Windows/Linux)
      const modifier = process.platform === 'darwin' ? Key.LeftCmd : Key.LeftControl;
      
      await keyboard.pressKey(modifier, Key.V);
      await keyboard.releaseKey(modifier, Key.V);

      // Restore previous clipboard content after a short delay
      await this.delay(100);
      clipboard.writeText(previousClipboard);
    } catch (error) {
      this.handleError(error, 'pasteText');
    }
  }

  /**
   * Updates typing speed configuration
   * @param speed New typing speed in ms
   */
  setTypingSpeed(speed: number): void {
    this.config.typingSpeed = speed;
    keyboard.config.autoDelayMs = speed;
  }

  /**
   * Updates initial delay configuration
   * @param delay New initial delay in ms
   */
  setInitialDelay(delay: number): void {
    this.config.initialDelay = delay;
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

    // Check for common permission issues
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('accessibility') ||
      errorMessage.includes('access')
    ) {
      throw new Error(
        `[GhostTyper.${method}] Permission denied. Please grant accessibility permissions:\n` +
        `- macOS: System Preferences → Security & Privacy → Privacy → Accessibility\n` +
        `- Windows: Run application as administrator if needed\n` +
        `- Linux: Ensure X11 or Wayland permissions are granted\n` +
        `Original error: ${errorMessage}`
      );
    }

    throw new Error(
      `[GhostTyper.${method}] Failed to execute: ${errorMessage}`
    );
  }
}

// Export default instance with default config
export const ghostTyper = new GhostTyper();
```