// Electron Wrapper with explicit preloading
//
// This wrapper explicitly requires electron FIRST to ensure it's properly loaded
// before the compiled TypeScript code tries to use it.

console.log('[wrapper] === Electron Preload Debug ===');

// Try to load electron explicitly
try {
  const electron = require('electron');
  console.log('[wrapper] Electron loaded successfully!');
  console.log('[wrapper] typeof electron:', typeof electron);
  console.log('[wrapper] electron.app:', typeof electron.app);
  console.log('[wrapper] electron.BrowserWindow:', typeof electron.BrowserWindow);

  // Make it globally available
  global.electron = electron;

  // Now load the main app
  console.log('[wrapper] Loading main app...');
  require('./dist/apps/electron/src/main/index.js');
} catch (error) {
  console.error('[wrapper] Failed to load electron:', error);
  process.exit(1);
}
