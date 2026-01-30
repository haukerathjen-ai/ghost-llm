#!/usr/bin/env node

/**
 * Electron Launcher
 *
 * This script provides a clean way to start Electron from the monorepo.
 * It uses child_process.spawn to explicitly start Electron with the correct paths,
 * avoiding the module resolution issues that occur with workspace scripts.
 */

const { spawn } = require('child_process');
const path = require('path');

// Path to the Electron app entry point
const appPath = path.join(__dirname, 'apps', 'electron');

// Use the electron CLI directly via node
const electronCli = path.join(__dirname, 'node_modules', 'electron', 'cli.js');

console.log('[run-electron] Starting Electron via CLI...');
console.log('[run-electron] Electron CLI:', electronCli);
console.log('[run-electron] App path:', appPath);

// Run electron CLI with node
const electronProcess = spawn(process.execPath, [electronCli, appPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

electronProcess.on('close', (code) => {
  console.log(`[run-electron] Electron process exited with code ${code}`);
  process.exit(code);
});

electronProcess.on('error', (err) => {
  console.error('[run-electron] Failed to start Electron:', err);
  process.exit(1);
});
