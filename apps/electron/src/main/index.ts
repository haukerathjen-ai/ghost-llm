// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
const NEXT_URL = 'http://localhost:3000';

/**
 * Plays a system beep sound to provide audio feedback to the user.
 * Platform-specific implementation:
 * - Windows: Console beep character
 * - macOS: System sound via afplay
 * - Linux: System bell via paplay
 */
function playBeep(): void {
  try {
    if (process.platform === 'win32') {
      // Windows: Use console beep character
      process.stdout.write('\x07');
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
  const ret = globalShortcut.register('CommandOrControl+Shift+G', () => {
    console.log('[Ghost LLM] Global hotkey triggered');

    // Play audio feedback to indicate recording start
    playBeep();

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

// App lifecycle events
app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();

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
