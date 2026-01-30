// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import screenshot from 'screenshot-desktop';

/**
 * Captures a screenshot of the active display and returns it as a Base64 string.
 * The image is buffered in RAM only - no file I/O is performed.
 *
 * @returns Promise resolving to Base64-encoded PNG screenshot
 */
export async function captureScreen(): Promise<string> {
  try {
    // Capture screenshot from the active display
    // screenshot-desktop returns a Buffer containing PNG data
    const imgBuffer = await screenshot({ format: 'png' });

    // Convert buffer to Base64 string (RAM only, no file write)
    const base64Image = imgBuffer.toString('base64');

    console.log('[Vision] Screenshot captured successfully');
    console.log(`[Vision] Image size: ${(imgBuffer.length / 1024).toFixed(2)} KB`);

    return base64Image;
  } catch (error) {
    console.error('[Vision] Failed to capture screenshot:', error);
    throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Captures a screenshot from a specific display.
 *
 * @param displayId - The ID of the display to capture (0-based index)
 * @returns Promise resolving to Base64-encoded PNG screenshot
 */
export async function captureScreenFromDisplay(displayId: number): Promise<string> {
  try {
    const imgBuffer = await screenshot({
      format: 'png',
      screen: displayId
    });

    const base64Image = imgBuffer.toString('base64');

    console.log(`[Vision] Screenshot captured from display ${displayId}`);
    console.log(`[Vision] Image size: ${(imgBuffer.length / 1024).toFixed(2)} KB`);

    return base64Image;
  } catch (error) {
    console.error(`[Vision] Failed to capture screenshot from display ${displayId}:`, error);
    throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Lists all available displays.
 *
 * @returns Promise resolving to array of display IDs
 */
export async function listDisplays(): Promise<number[]> {
  try {
    const displays = await screenshot.listDisplays();
    console.log(`[Vision] Found ${displays.length} display(s)`);
    return displays.map((_: any, index: number) => index);
  } catch (error) {
    console.error('[Vision] Failed to list displays:', error);
    return [0]; // Fallback to primary display
  }
}
