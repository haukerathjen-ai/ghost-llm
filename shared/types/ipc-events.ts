// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// Type definitions for all IPC events

/**
 * Namespace containing constant strings for all IPC channels
 */
export namespace IPCChannels {
  // Invoke Channels (bidirectional request/response)
  export const START_RECORDING = 'ghost:start-recording';
  export const STOP_RECORDING = 'ghost:stop-recording';
  export const GET_HISTORY = 'ghost:get-history';
  export const SET_STRATEGY = 'ghost:set-strategy';
  export const GET_SETTINGS = 'ghost:get-settings';
  export const SAVE_SETTINGS = 'ghost:save-settings';

  // Event Channels (one-way notifications)
  export const RECORDING_STATUS = 'ghost:recording-status';
  export const TRANSCRIPTION_COMPLETE = 'ghost:transcription-complete';
  export const ERROR = 'ghost:error';
}

/**
 * Payload types for each IPC channel
 */
export interface IPCEventMap {
  // Invoke Channels - Request/Response pairs
  [IPCChannels.START_RECORDING]: {
    request: void;
    response: { success: boolean; message?: string };
  };
  [IPCChannels.STOP_RECORDING]: {
    request: void;
    response: { success: boolean; audioPath?: string };
  };
  [IPCChannels.GET_HISTORY]: {
    request: { limit?: number; offset?: number };
    response: {
      recordings: Array<{
        id: string;
        timestamp: number;
        transcription?: string;
        audioPath: string;
        duration?: number;
      }>;
      total: number;
    };
  };
  [IPCChannels.SET_STRATEGY]: {
    request: { strategy: 'always-on' | 'push-to-talk' | 'voice-activated' };
    response: { success: boolean };
  };
  [IPCChannels.GET_SETTINGS]: {
    request: void;
    response: {
      strategy: 'always-on' | 'push-to-talk' | 'voice-activated';
      audioDevice?: string;
      transcriptionEnabled: boolean;
      [key: string]: any;
    };
  };
  [IPCChannels.SAVE_SETTINGS]: {
    request: {
      strategy?: 'always-on' | 'push-to-talk' | 'voice-activated';
      audioDevice?: string;
      transcriptionEnabled?: boolean;
      [key: string]: any;
    };
    response: { success: boolean };
  };

  // Event Channels - One-way notifications
  [IPCChannels.RECORDING_STATUS]: {
    isRecording: boolean;
    timestamp: number;
    duration?: number;
  };
  [IPCChannels.TRANSCRIPTION_COMPLETE]: {
    recordingId: string;
    transcription: string;
    timestamp: number;
  };
  [IPCChannels.ERROR]: {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
  };
}

/**
 * Type helper to get request payload type for invoke channels
 */
export type IPCInvokeRequest<T extends keyof IPCEventMap> = 
  IPCEventMap[T] extends { request: infer R } ? R : never;

/**
 * Type helper to get response payload type for invoke channels
 */
export type IPCInvokeResponse<T extends keyof IPCEventMap> = 
  IPCEventMap[T] extends { response: infer R } ? R : never;

/**
 * Type helper to get event payload type for event channels
 */
export type IPCEventPayload<T extends keyof IPCEventMap> = 
  IPCEventMap[T] extends { request: any; response: any } 
    ? never 
    : IPCEventMap[T];

/**
 * Union type of all invoke channel names
 */
export type InvokeChannel = 
  | typeof IPCChannels.START_RECORDING
  | typeof IPCChannels.STOP_RECORDING
  | typeof IPCChannels.GET_HISTORY
  | typeof IPCChannels.SET_STRATEGY
  | typeof IPCChannels.GET_SETTINGS
  | typeof IPCChannels.SAVE_SETTINGS;

/**
 * Union type of all event channel names
 */
export type EventChannel = 
  | typeof IPCChannels.RECORDING_STATUS
  | typeof IPCChannels.TRANSCRIPTION_COMPLETE
  | typeof IPCChannels.ERROR;

/**
 * Type guard to check if a channel is an invoke channel
 */
export function isInvokeChannel(channel: string): channel is InvokeChannel {
  return [
    IPCChannels.START_RECORDING,
    IPCChannels.STOP_RECORDING,
    IPCChannels.GET_HISTORY,
    IPCChannels.SET_STRATEGY,
    IPCChannels.GET_SETTINGS,
    IPCChannels.SAVE_SETTINGS,
  ].includes(channel);
}

/**
 * Type guard to check if a channel is an event channel
 */
export function isEventChannel(channel: string): channel is EventChannel {
  return [
    IPCChannels.RECORDING_STATUS,
    IPCChannels.TRANSCRIPTION_COMPLETE,
    IPCChannels.ERROR,
  ].includes(channel);
}