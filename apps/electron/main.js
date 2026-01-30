// Pure JavaScript entry point - NO TypeScript compilation
// This avoids the module resolution issues with compiled TS code

const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
const NEXT_URL = 'http://localhost:3000';

function playBeep() {
  try {
    if (process.platform === 'win32') {
      process.stdout.write('\x07');
      console.log('[Audio] Beep played (Windows)');
    } else if (process.platform === 'darwin') {
      spawn('afplay', ['/System/Library/Sounds/Ping.aiff'], { stdio: 'ignore' });
      console.log('[Audio] Beep played (macOS)');
    } else {
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
      preload: path.join(__dirname, 'dist', 'apps', 'electron', 'src', 'preload', 'index.js'),
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
  const ret = globalShortcut.register('CommandOrControl+Shift+G', () => {
    console.log('[Ghost LLM] Global hotkey triggered');

    // Play audio feedback
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
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
