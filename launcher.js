#!/usr/bin/env node

/**
 * Launcher with Binary Bypass
 *
 * This launcher forces Electron to pre-load its bindings by spawning
 * the electron binary directly with the main entry point.
 */

const { spawn } = require('child_process');
const path = require('path');

// Get the electron binary path (this will be the .exe path)
const electronBinary = require('electron');

// Path to the main entry point
const mainEntry = path.join(__dirname, 'apps', 'electron', 'main.js');

console.log('[launcher] Electron binary:', electronBinary);
console.log('[launcher] Main entry:', mainEntry);
console.log('[launcher] Spawning Electron with direct binary call...');

// Spawn electron binary directly
const electronProcess = spawn(electronBinary, [mainEntry], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Force electron to expose its APIs
    ELECTRON_RUN_AS_NODE: undefined
  }
});

electronProcess.on('close', (code) => {
  console.log(`[launcher] Electron exited with code ${code}`);
  process.exit(code);
});

electronProcess.on('error', (err) => {
  console.error('[launcher] Failed to start Electron:', err);
  process.exit(1);
});
