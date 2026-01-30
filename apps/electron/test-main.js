// Test file to check if Electron APIs are available
console.log('[TEST] Starting Electron test');

const electron = require('electron');
console.log('[TEST] electron:', typeof electron);
console.log('[TEST] electron value:', electron);

const { app, BrowserWindow } = require('electron');
console.log('[TEST] app:', app);
console.log('[TEST] BrowserWindow:', BrowserWindow);

if (app && app.whenReady) {
  console.log('[TEST] SUCCESS - Electron APIs are available!');
  app.whenReady().then(() => {
    console.log('[TEST] Electron is ready');
    app.quit();
  });
} else {
  console.error('[TEST] FAIL - Electron APIs not available');
  process.exit(1);
}
