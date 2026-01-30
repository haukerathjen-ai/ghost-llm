 // Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { spawn, exec } from 'child_process';
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
  // Register CommandOrControl+Shift+G for Ghost LLM hotkey
  const ret = globalShortcut.register('CommandOrControl+Shift+G', async () => {
    console.log('[Ghost LLM] Global hotkey triggered');

    // Play audio feedback
    await playBeep();

    // Toggle recording if manager is initialized
    if (recordingManager) {
      try {
        await recordingManager.toggleRecording();
      } catch (error) {
        console.error('[Ghost LLM] Recording toggle failed:', error);
      }
    } else {
      console.warn('[Ghost LLM] Recording manager not initialized yet');
    }

    // Focus window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  if (!ret) {
    console.error('[Ghost LLM] Global shortcut registration failed');
  } else {
    console.log('[Ghost LLM] Global shortcut registered: CommandOrControl+Shift+G');
  }
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
        mainWindow.webContents.send('recording:status', status);
      }
      console.log('[RecordingManager] Status:', status);
    });

    recordingManager.on('complete', (result) => {
      if (mainWindow) {
        mainWindow.webContents.send('transcription:complete', result);
      }
      console.log('[RecordingManager] Complete:', result);
    });

    recordingManager.on('audio-level', (level) => {
      if (mainWindow) {
        mainWindow.webContents.send('audio:level', level);
      }
    });

    recordingManager.on('error', (error) => {
      if (mainWindow) {
        mainWindow.webContents.send('recording:error', error);
      }
      console.error('[RecordingManager] Error:', error);
    });

    console.log('[Main] Recording Manager initialized');
  } catch (error) {
    console.error('[Main] Failed to initialize Recording Manager:', error);
  }
}

/**
 * Register IPC handlers for ghost typing and other features
 */
function registerIPCHandlers() {
  // Ghost typing debug test handler
  ipcMain.on('ghost:debug-typing', async () => {
    try {
      console.log('[IPC] Ghost typing debug test initiated');

      // Play beep to notify user
      await playBeep();

      // Open Notepad on Windows
      if (process.platform === 'win32') {
        console.log('[IPC] Opening Notepad...');
        spawn('notepad.exe', [], { detached: true });
      } else if (process.platform === 'darwin') {
        spawn('open', ['-a', 'TextEdit'], { detached: true });
      } else {
        spawn('gedit', [], { detached: true });
      }

      // Wait 3 seconds for user to focus the target application
      console.log('[IPC] Waiting 3 seconds before typing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Type the test message
      console.log('[IPC] Starting ghost typing...');
      await ghostTyper.typeText('Ghost LLM Connection Verified');

      console.log('[IPC] Ghost typing test completed successfully');
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
