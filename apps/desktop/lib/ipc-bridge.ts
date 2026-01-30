```typescript
// apps/desktop/lib/ipc-bridge.ts

/**
 * Type-safe IPC Bridge for Electron
 * Provides type-safe wrapper around window.ghostAPI
 */

// ============================================================================
// Type Definitions for IPC Channels
// ============================================================================

export interface IPCChannels {
  // Window Controls
  'window:minimize': { args: []; return: void };
  'window:maximize': { args: []; return: void };
  'window:close': { args: []; return: void };
  'window:isMaximized': { args: []; return: boolean };

  // File Operations
  'file:open': { args: [{ filters?: Array<{ name: string; extensions: string[] }> }?]; return: string | null };
  'file:save': { args: [{ content: string; defaultPath?: string }]; return: string | null };
  'file:read': { args: [string]; return: string };

  // Settings
  'settings:get': { args: [string]; return: unknown };
  'settings:set': { args: [string, unknown]; return: void };
  'settings:getAll': { args: []; return: Record<string, unknown> };

  // Application
  'app:getVersion': { args: []; return: string };
  'app:getPath': { args: [string]; return: string };
  'app:quit': { args: []; return: void };

  // Database
  'db:query': { args: [string, unknown[]?]; return: unknown[] };
  'db:execute': { args: [string, unknown[]?]; return: { changes: number; lastInsertRowid: number } };
}

export interface IPCEvents {
  // Window Events
  'window:maximized': boolean;
  'window:focus': void;
  'window:blur': void;

  // Settings Events
  'settings:changed': { key: string; value: unknown };

  // Application Events
  'app:update-available': { version: string };
  'app:error': { message: string; stack?: string };
}

// ============================================================================
// Window API Interface
// ============================================================================

interface GhostAPI {
  invoke: <K extends keyof IPCChannels>(
    channel: K,
    ...args: IPCChannels[K]['args']
  ) => Promise<IPCChannels[K]['return']>;

  on: <K extends keyof IPCEvents>(
    channel: K,
    callback: (data: IPCEvents[K]) => void
  ) => () => void;

  removeListener: <K extends keyof IPCEvents>(
    channel: K,
    callback: (data: IPCEvents[K]) => void
  ) => void;
}

declare global {
  interface Window {
    ghostAPI?: GhostAPI;
  }
}

// ============================================================================
// Configuration
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if ghostAPI is available and throws an error if not
 */
function ensureGhostAPI(): GhostAPI {
  if (typeof window === 'undefined') {
    throw new Error(
      '[IPC Bridge] Window object is not available. This code must run in a browser environment.'
    );
  }

  if (!window.ghostAPI) {
    throw new Error(
      '[IPC Bridge] ghostAPI is not available. Make sure you are running this in an Electron environment with the preload script properly configured.'
    );
  }

  return window.ghostAPI;
}

/**
 * Debug logger - only logs in development mode
 */
function debugLog(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.log(`[IPC Bridge] ${message}`, ...args);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Type-safe wrapper for invoking IPC channels
 * 
 * @example
 * ```typescript
 * const version = await invokeGhost('app:getVersion');
 * const data = await invokeGhost('file:read', '/path/to/file');
 * ```
 */
export async function invokeGhost<K extends keyof IPCChannels>(
  channel: K,
  ...args: IPCChannels[K]['args']
): Promise<IPCChannels[K]['return']> {
  const api = ensureGhostAPI();

  debugLog(`Invoking channel: ${channel}`, args);

  try {
    const result = await api.invoke(channel, ...args);
    
    debugLog(`Channel ${channel} completed successfully`, result);
    
    return result;
  } catch (error) {
    console.error(`[IPC Bridge] Error invoking channel ${channel}:`, error);
    throw error;
  }
}

/**
 * Type-safe wrapper for listening to IPC events
 * Returns a cleanup function to remove the listener
 * 
 * @example
 * ```typescript
 * const cleanup = onGhostEvent('window:maximized', (isMaximized) => {
 *   console.log('Window maximized:', isMaximized);
 * });
 * 
 * // Later, when component unmounts:
 * cleanup();
 * ```
 */
export function onGhostEvent<K extends keyof IPCEvents>(
  channel: K,
  callback: (data: IPCEvents[K]) => void
): () => void {
  const api = ensureGhostAPI();

  debugLog(`Registering listener for channel: ${channel}`);

  // Register the listener
  const cleanup = api.on(channel, callback);

  // Return cleanup function
  return () => {
    debugLog(`Removing listener for channel: ${channel}`);
    cleanup();
  };
}

/**
 * Check if ghostAPI is available (non-throwing version)
 */
export function isGhostAPIAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ghostAPI;
}

/**
 * Get the ghostAPI instance directly (for advanced use cases)
 * Throws if not available
 */
export function getGhostAPI(): GhostAPI {
  return ensureGhostAPI();
}

// ============================================================================
// Convenience Wrappers
// ============================================================================

/**
 * Window control helpers
 */
export const windowControls = {
  minimize: () => invokeGhost('window:minimize'),
  maximize: () => invokeGhost('window:maximize'),
  close: () => invokeGhost('window:close'),
  isMaximized: () => invokeGhost('window:isMaximized'),
};

/**
 * File operation helpers
 */
export const fileOperations = {
  open: (filters?: Array<{ name: string; extensions: string[] }>) => 
    invokeGhost('file:open', { filters }),
  save: (content: string, defaultPath?: string) => 
    invokeGhost('file:save', { content, defaultPath }),
  read: (path: string) => 
    invokeGhost('file:read', path),
};

/**
 * Settings helpers
 */
export const settings = {
  get: <T = unknown>(key: string) => 
    invokeGhost('settings:get', key) as Promise<T>,
  set: (key: string, value: unknown) => 
    invokeGhost('settings:set', key, value),
  getAll: () => 
    invokeGhost('settings:getAll'),
};

/**
 * Application helpers
 */
export const app = {
  getVersion: () => invokeGhost('app:getVersion'),
  getPath: (name: string) => invokeGhost('app:getPath', name),
  quit: () => invokeGhost('app:quit'),
};
```