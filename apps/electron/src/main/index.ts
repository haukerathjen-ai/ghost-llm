// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { spawn, exec, execSync } from 'child_process';
import { promisify } from 'util';
import { ghostTyper } from './modules/ghost';
import { getRecordingManager } from './modules/recording';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;
let recordingManager: ReturnType<typeof getRecordingManager> | null = null;

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
const NEXT_URL = 'http://localhost:3000';

/**
 * Plays a system beep sound to provide audio feedback to the user.
 * Platform-specific implementation:
 * - Windows: PowerShell Console Beep with proper parameters
 * - macOS: System sound via afplay
 * - Linux: System bell via paplay
 */
async function playBeep(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      // Windows: Use PowerShell Console Beep (750 Hz for 300ms)
      await execAsync('powershell.exe -ExecutionPolicy Bypass -Command "[console]::Beep(750, 300)"');
      console.log('[Audio] Beep played (Windows)');
    } else if (process.platform === 'darwin') {
      // macOS: Play system sound
      spawn('afplay', ['/System/Library/Sounds/Ping.aiff'], { stdio: 'ignore' });
      console.log('[Audio] Beep played (macOS)');
    } else {
      // Linux: Play system bell
      spawn('paplay', ['/usr/share/sounds/freedesktop/stereo/bell.oga'], { stdio: 'ignore' });
      console.log('[Audio] Beep played (Linux)');
    }
  } catch (error) {
    console.error('[Audio] Failed to play beep:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    title: 'Ghost LLM',
    show: false,
    backgroundColor: '#0a0a0a',
  });

  if (isDev) {
    mainWindow.loadURL(NEXT_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../desktop/.next/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerGlobalShortcuts() {
  // Hotkey handler function
  const hotkeyHandler = async () => {
    console.log('[Ghost LLM] Global hotkey triggered');

    // Play audio feedback
    await playBeep();

    // Toggle recording if manager is initialized
    // IMPORTANT: Do NOT focus/show window here - this would steal focus from target app!
    if (recordingManager) {
      try {
        await recordingManager.toggleRecording();
      } catch (error) {
        console.error('[Ghost LLM] Recording toggle failed:', error);
      }
    } else {
      console.warn('[Ghost LLM] Recording manager not initialized yet');
    }

    // STEALTH MODE: Do NOT focus window - let user keep focus on target application
    // The dashboard updates via IPC without stealing focus
  };

  // Try to register primary shortcut: Ctrl+Shift+G
  let ret = globalShortcut.register('CommandOrControl+Shift+G', hotkeyHandler);
  
  if (ret) {
    console.log('[Ghost LLM] Global shortcut registered: CommandOrControl+Shift+G');
    return;
  }
  
  console.warn('[Ghost LLM] Primary shortcut (Ctrl+Shift+G) failed, trying alternative...');
  
  // Try alternative shortcut: Ctrl+Alt+G
  ret = globalShortcut.register('CommandOrControl+Alt+G', hotkeyHandler);
  
  if (ret) {
    console.log('[Ghost LLM] Alternative shortcut registered: CommandOrControl+Alt+G');
    return;
  }
  
  console.warn('[Ghost LLM] Alternative shortcut (Ctrl+Alt+G) also failed, trying F9...');
  
  // Try F9 as last resort
  ret = globalShortcut.register('F9', hotkeyHandler);
  
  if (ret) {
    console.log('[Ghost LLM] Fallback shortcut registered: F9');
    return;
  }
  
  console.error('[Ghost LLM] All shortcut registrations failed! Please check if another app is using these shortcuts.');
}

/**
 * Initialize the Recording Manager
 */
function initializeRecordingManager() {
  try {
    // Initialize with default config
    recordingManager = getRecordingManager({
      strategyId: 'coder', // Default strategy
      typingSpeed: 50, // Default typing speed
    });

    // Forward recording manager events to renderer
    recordingManager.on('status', (status) => {
      if (mainWindow) {
        mainWindow.webContents.send('ghost:status-change', status);
        mainWindow.webContents.send('recording:status', status); // Keep for backward compatibility
      }
    });

    recordingManager.on('complete', (result) => {
      if (mainWindow) {
        mainWindow.webContents.send('ghost:complete', result);
        mainWindow.webContents.send('transcription:complete', result); // Keep for backward compatibility
      }
    });

    recordingManager.on('audio-level', (level) => {
      if (mainWindow) {
        mainWindow.webContents.send('ghost:audio-level', level);
        mainWindow.webContents.send('audio:level', level); // Keep for backward compatibility
      }
    });

    recordingManager.on('error', (error) => {
      if (mainWindow) {
        mainWindow.webContents.send('ghost:error', error);
        mainWindow.webContents.send('recording:error', error); // Keep for backward compatibility
      }
      console.error('[RecordingManager] Error:', error);
    });

    console.log('[Main] Recording Manager initialized');
  } catch (error) {
    console.error('[Main] Failed to initialize Recording Manager:', error);
  }
}

/**
 * Check if SoX is available in PATH
 */
function checkSoxAvailable(): boolean {
  try {
    execSync('sox --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Register IPC handlers for ghost typing and other features
 */
function registerIPCHandlers() {
  // Check SoX availability
  ipcMain.handle('system:check-sox', async () => {
    return checkSoxAvailable();
  });

  // Ghost typing debug test handler
  ipcMain.on('ghost:debug-typing', async () => {
    try {
      await playBeep();

      // Open Notepad on Windows
      if (process.platform === 'win32') {
        spawn('notepad.exe', [], { detached: true });
      } else if (process.platform === 'darwin') {
        spawn('open', ['-a', 'TextEdit'], { detached: true });
      } else {
        spawn('gedit', [], { detached: true });
      }

      // Wait 3 seconds for user to focus the target application
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Type the test message
      await ghostTyper.typeText('Ghost LLM Connection Verified');
    } catch (error) {
      console.error('[IPC] Ghost typing test failed:', error);
    }
  });

  // Manual recording start
  ipcMain.handle('recording:start', async () => {
    try {
      if (recordingManager) {
        await recordingManager.startRecording();
        await playBeep();
      }
    } catch (error) {
      console.error('[IPC] Failed to start recording:', error);
      throw error;
    }
  });

  // Manual recording stop
  ipcMain.handle('recording:stop', async () => {
    try {
      if (recordingManager) {
        await recordingManager.stopAndProcess();
        await playBeep();
      }
    } catch (error) {
      console.error('[IPC] Failed to stop recording:', error);
      throw error;
    }
  });

  // Set strategy
  ipcMain.handle('strategy:set', async (_event, strategyId: string) => {
    try {
      if (recordingManager) {
        recordingManager.setStrategy(strategyId);
      }
    } catch (error) {
      console.error('[IPC] Failed to set strategy:', error);
      throw error;
    }
  });

  // Get history (placeholder)
  ipcMain.handle('history:get', async () => {
    // TODO: Implement history storage/retrieval
    return [];
  });

  // Get settings (placeholder)
  ipcMain.handle('settings:get', async () => {
    // TODO: Implement settings storage
    return {
      strategyId: 'coder',
      typingSpeed: 50,
    };
  });

  // Save settings (placeholder)
  ipcMain.handle('settings:save', async (_event, settings) => {
    // TODO: Implement settings storage
    if (recordingManager) {
      recordingManager.setStrategy(settings.strategyId);
      recordingManager.setTypingSpeed(settings.typingSpeed);
    }
  });
}

// App lifecycle events
app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();
  registerIPCHandlers();
  initializeRecordingManager();

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS apps stay active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Cleanup: Unregister all global shortcuts
  globalShortcut.unregisterAll();
});
