#!/usr/bin/env node

/**
 * Electron Launcher with tsx
 *
 * This launcher uses tsx to run TypeScript files directly without compilation.
 * This avoids the module resolution issues that occur during TS->JS compilation.
 */

const { spawn } = require('child_process');
const path = require('path');

// Get electron binary
const electronPath = require('electron');

// Path to the TypeScript entry point
const tsEntryPoint = path.join(__dirname, 'apps', 'electron', 'src', 'main', 'index.ts');

console.log('[run-electron-tsx] Starting Electron with tsx...');
console.log('[run-electron-tsx] Electron binary:', electronPath);
console.log('[run-electron-tsx] TS entry:', tsEntryPoint);

// Use tsx to run TypeScript directly
const electronProcess = spawn(
  electronPath,
  [
    '--require', path.join(__dirname, 'node_modules', 'tsx', 'dist', 'preflight.js'),
    '--import', `data:text/javascript,import{register}from'node:module';import{pathToFileURL}from'node:url';register('tsx/esm',pathToFileURL('./'));`,
    tsEntryPoint
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      NODE_OPTIONS: '--loader tsx/esm'
    },
    cwd: path.join(__dirname, 'apps', 'electron')
  }
);

electronProcess.on('close', (code) => {
  console.log(`[run-electron-tsx] Electron process exited with code ${code}`);
  process.exit(code);
});

electronProcess.on('error', (err) => {
  console.error('[run-electron-tsx] Failed to start Electron:', err);
  process.exit(1);
});
