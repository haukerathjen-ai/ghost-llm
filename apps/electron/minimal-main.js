// Minimal Electron main process file
// Based on official Electron Quick Start

const { app, BrowserWindow } = require('electron');

console.log('[MINIMAL] Script starting...');
console.log('[MINIMAL] app:', typeof app);
console.log('[MINIMAL] BrowserWindow:', typeof BrowserWindow);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadURL('about:blank');

  console.log('[MINIMAL] Window created successfully');
}

app.whenReady().then(() => {
  console.log('[MINIMAL] App is ready');
  createWindow();

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

console.log('[MINIMAL] Script loaded, waiting for app.whenReady()');
