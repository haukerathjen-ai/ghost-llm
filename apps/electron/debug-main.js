// Debug script to inspect what's available
console.log('[DEBUG] === Inspecting global scope ===');
console.log('[DEBUG] typeof global.require:', typeof global.require);
console.log('[DEBUG] typeof process:', typeof process);
console.log('[DEBUG] process.type:', process.type);
console.log('[DEBUG] process.versions.electron:', process.versions.electron);
console.log('[DEBUG] process.versions.chrome:', process.versions.chrome);

console.log('\n[DEBUG] === Trying different require methods ===');

try {
  const electron1 = require('electron');
  console.log('[DEBUG] require("electron"):', typeof electron1, electron1);
} catch (e) {
  console.error('[DEBUG] require("electron") failed:', e.message);
}

try {
  const electronPath = require.resolve('electron');
  console.log('[DEBUG] require.resolve("electron"):', electronPath);
} catch (e) {
  console.error('[DEBUG] require.resolve failed:', e.message);
}

console.log('\n[DEBUG] === Checking require.cache ===');
console.log('[DEBUG] require.cache keys:', Object.keys(require.cache).filter(k => k.includes('electron')));

console.log('\n[DEBUG] === Checking module paths ===');
console.log('[DEBUG] module.paths:', module.paths);

process.exit(0);
