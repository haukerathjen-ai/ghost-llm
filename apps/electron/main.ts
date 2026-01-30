```typescript
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { RecordingModule } from './modules/recording';
import { HistoryModule } from './modules/history';
import { SettingsModule } from './modules/settings';
import { StrategyModule } from './modules/strategy';

let mainWindow: BrowserWindow | null = null;
let recordingModule: RecordingModule;
let historyModule: HistoryModule;
let settingsModule: SettingsModule;
let strategyModule: StrategyModule;

const isDev = process.env.NODE_ENV === 'development';
const NEXT_URL = 'http://localhost:3000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Ghost - AI Screen Recorder',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL(NEXT_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerGlobalShortcuts() {
  // Register CommandOrControl+Shift+G for recording toggle
  const ret = globalShortcut.register('CommandOrControl+Shift+G', () => {
    console.log('Global hotkey triggered: Recording toggle');
    if (recordingModule.isRecording()) {
      recordingModule.stopRecording();
      mainWindow?.webContents.send('recording:stopped');
    } else {
      recordingModule.startRecording();
      mainWindow?.webContents.send('recording:started');
    }
  });

  if (!ret) {
    console.error('Global shortcut registration failed');
  }
}

function registerIpcHandlers() {
  // Start recording
  ipcMain.handle('ghost:start-recording', async (event) => {
    try {
      const result = await recordingModule.startRecording();
      mainWindow?.webContents.send('recording:started');
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Stop recording
  ipcMain.handle('ghost:stop-recording', async (event) => {
    try {
      const result = await recordingModule.stopRecording();
      mainWindow?.webContents.send('recording:stopped');
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get history
  ipcMain.handle('ghost:get-history', async (event, filters?) => {
    try {
      const history = await historyModule.getHistory(filters);
      return { success: true, data: history };
    } catch (error) {
      console.error('Failed to get history:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Set strategy
  ipcMain.handle('ghost:set-strategy', async (event, strategy: string) => {
    try {
      await strategyModule.setStrategy(strategy);
      return { success: true };
    } catch (error) {
      console.error('Failed to set strategy:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get settings
  ipcMain.handle('ghost:get-settings', async (event) => {
    try {
      const settings = await settingsModule.getSettings();
      return { success: true, data: settings };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Save settings
  ipcMain.handle('ghost:save-settings', async (event, settings) => {
    try {
      await settingsModule.saveSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}

function initializeModules() {
  recordingModule = new RecordingModule();
  historyModule = new HistoryModule();
  settingsModule = new SettingsModule();
  strategyModule = new StrategyModule();
}

// App lifecycle events
app.whenReady().then(() => {
  initializeModules();
  createWindow();
  registerGlobalShortcuts();
  registerIpcHandlers();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Cleanup: Unregister all global shortcuts
  globalShortcut.unregisterAll();
});

// Cleanup before app exit
app.on('before-quit', () => {
  if (recordingModule && recordingModule.isRecording()) {
    recordingModule.stopRecording();
  }
});

```