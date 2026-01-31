#!/usr/bin/env node

/**
 * Ghost LLM Production Launcher
 * 
 * Compiles TypeScript with tsc-alias to resolve path aliases
 * Then launches Electron with the compiled code
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables BEFORE starting Electron
require('dotenv').config();

console.log('[launcher] Ghost LLM Production Launcher');
console.log('[launcher] Environment variables loaded from .env');
console.log('[launcher] Compiling TypeScript...');

// Step 1: Compile TypeScript
try {
  execSync('npx tsc -p apps/electron/tsconfig.json', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('[launcher] TypeScript compiled');
} catch (error) {
  console.error('[launcher] TypeScript compilation failed');
  process.exit(1);
}

// Step 2: Resolve path aliases with tsc-alias
console.log('[launcher] Resolving path aliases...');
try {
  execSync('npx tsc-alias -p apps/electron/tsconfig.json', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('[launcher] Path aliases resolved');
} catch (error) {
  console.error('[launcher] tsc-alias failed');
  process.exit(1);
}

// Step 3: Start Electron
console.log('[launcher] Starting Electron...');
const electronBinary = require('electron');
const compiledEntry = path.join(__dirname, 'apps', 'electron', 'dist', 'apps', 'electron', 'src', 'main', 'index.js');

if (!fs.existsSync(compiledEntry)) {
  console.error('[launcher] Compiled entry not found:', compiledEntry);
  process.exit(1);
}

const electronProcess = spawn(electronBinary, [compiledEntry], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development'
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
