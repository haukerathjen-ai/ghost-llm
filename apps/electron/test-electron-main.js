// Test different ways to import Electron APIs
console.log('[TEST] Trying different import methods for Electron 33.x');

// Method 1: Standard require
try {
  const { app, BrowserWindow } = require('electron');
  console.log('[TEST] Method 1 - require("electron"):', { app: typeof app, BrowserWindow: typeof BrowserWindow });
} catch (e) {
  console.log('[TEST] Method 1 failed:', e.message);
}

// Method 2: electron/main (newer versions)
try {
  const { app, BrowserWindow } = require('electron/main');
  console.log('[TEST] Method 2 - require("electron/main"):', { app: typeof app, BrowserWindow: typeof BrowserWindow });

  if (app && app.whenReady) {
    console.log('[TEST] SUCCESS! Found working import method');
    app.whenReady().then(() => {
      console.log('[TEST] App is ready!');
      const win = new BrowserWindow({ width: 800, height: 600 });
      win.loadURL('about:blank');
      console.log('[TEST] Window created successfully!');
    });
  }
} catch (e) {
  console.log('[TEST] Method 2 failed:', e.message);
}

// Method 3: Check process.electronBinding
try {
  if (process.electronBinding) {
    console.log('[TEST] Method 3 - process.electronBinding exists');
    const binding = process.electronBinding('app');
    console.log('[TEST] electronBinding("app"):', typeof binding);
  } else {
    console.log('[TEST] Method 3 - process.electronBinding not available');
  }
} catch (e) {
  console.log('[TEST] Method 3 failed:', e.message);
}
