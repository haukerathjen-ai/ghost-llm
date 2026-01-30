const { app, BrowserWindow } = require('electron');

console.log('[STANDALONE] app:', typeof app);
console.log('[STANDALONE] BrowserWindow:', typeof BrowserWindow);

if (app && app.whenReady) {
  console.log('[STANDALONE] SUCCESS!');
  app.whenReady().then(() => {
    console.log('[STANDALONE] App ready');
    const win = new BrowserWindow({ width: 800, height: 600 });
    win.loadURL('about:blank');
    console.log('[STANDALONE] Window created');
  });
} else {
  console.error('[STANDALONE] FAILED - APIs not available');
  process.exit(1);
}
