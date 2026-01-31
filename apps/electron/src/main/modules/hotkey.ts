// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import { globalShortcut } from 'electron';
import { EventEmitter } from 'events';

export class HotkeyManager extends EventEmitter {
  private registeredHotkeys: Map<string, () => void> = new Map();
  public readonly DEFAULT_HOTKEY = 'CommandOrControl+Shift+G';

  constructor() {
    super();
  }

  /**
   * Registriert einen globalen Hotkey
   * @param accelerator - Der Hotkey (z.B. 'CommandOrControl+Shift+G')
   * @param callback - Die Callback-Funktion, die bei Aktivierung ausgeführt wird
   * @returns boolean - true wenn erfolgreich registriert, false wenn fehlgeschlagen
   */
  public register(accelerator: string, callback: () => void): boolean {
    try {
      // Prüfen ob Hotkey bereits registriert ist
      if (this.registeredHotkeys.has(accelerator)) {
        console.warn(`Hotkey '${accelerator}' ist bereits registriert. Wird überschrieben.`);
        this.unregister(accelerator);
      }

      // Hotkey registrieren
      const success = globalShortcut.register(accelerator, () => {
        console.log(`Hotkey aktiviert: ${accelerator}`);
        this.emit('hotkey-pressed', accelerator);
        callback();
      });

      if (success) {
        this.registeredHotkeys.set(accelerator, callback);
        console.log(`Hotkey erfolgreich registriert: ${accelerator}`);
        this.emit('hotkey-registered', accelerator);
        return true;
      } else {
        console.error(`Hotkey konnte nicht registriert werden: ${accelerator}`);
        return false;
      }
    } catch (error) {
      console.error(`Fehler beim Registrieren des Hotkeys '${accelerator}':`, error);
      return false;
    }
  }

  /**
   * Entfernt die Registrierung eines bestimmten Hotkeys
   * @param accelerator - Der zu entfernende Hotkey
   * @returns boolean - true wenn erfolgreich entfernt, false wenn nicht gefunden
   */
  public unregister(accelerator: string): boolean {
    try {
      if (!this.registeredHotkeys.has(accelerator)) {
        console.warn(`Hotkey '${accelerator}' ist nicht registriert.`);
        return false;
      }

      globalShortcut.unregister(accelerator);
      this.registeredHotkeys.delete(accelerator);
      console.log(`Hotkey erfolgreich deregistriert: ${accelerator}`);
      this.emit('hotkey-unregistered', accelerator);
      return true;
    } catch (error) {
      console.error(`Fehler beim Deregistrieren des Hotkeys '${accelerator}':`, error);
      return false;
    }
  }

  /**
   * Entfernt die Registrierung aller Hotkeys
   */
  public unregisterAll(): void {
    try {
      const count = this.registeredHotkeys.size;
      globalShortcut.unregisterAll();
      this.registeredHotkeys.clear();
      console.log(`Alle Hotkeys deregistriert (${count} Hotkeys)`);
      this.emit('all-hotkeys-unregistered', count);
    } catch (error) {
      console.error('Fehler beim Deregistrieren aller Hotkeys:', error);
    }
  }

  /**
   * Prüft ob ein Hotkey registriert ist
   * @param accelerator - Der zu prüfende Hotkey
   * @returns boolean - true wenn registriert
   */
  public isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Gibt alle registrierten Hotkeys zurück
   * @returns Array der registrierten Hotkey-Strings
   */
  public getRegisteredHotkeys(): string[] {
    return Array.from(this.registeredHotkeys.keys());
  }

  /**
   * Cleanup-Methode für App-Shutdown
   */
  public cleanup(): void {
    console.log('HotkeyManager Cleanup...');
    this.unregisterAll();
    this.removeAllListeners();
  }
}