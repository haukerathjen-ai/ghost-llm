// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ghostAPI } from "@/lib/ghost-api";

interface SettingsForm {
  typingSpeed: number;
  beepVolume: number;
  theme: "dark" | "darker";
}

interface APIKeyStatus {
  openai: boolean;
  anthropic: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsForm>({
    typingSpeed: 50,
    beepVolume: 75,
    theme: "dark",
  });
  const [apiKeyStatus, setApiKeyStatus] = useState<APIKeyStatus>({
    openai: false,
    anthropic: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    checkAPIKeys();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await ghostAPI.loadSettings();
      if (settings) {
        setFormData(settings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAPIKeys = async () => {
    try {
      const status = await ghostAPI.checkAPIKeys();
      setApiKeyStatus(status);
    } catch (error) {
      console.error("Failed to check API keys:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await ghostAPI.saveSettings(formData);
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Fehler beim Speichern der Einstellungen");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof SettingsForm,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8' }}>Lädt Einstellungen...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '80px 24px' }}>
        {/* Header */}
        <header style={{ marginBottom: '64px' }}>
          <button
            onClick={() => router.push("/")}
            style={{ color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            <span>←</span>
            <span>Zurück</span>
          </button>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>
            Einstellungen
          </h1>
        </header>

        <form onSubmit={handleSubmit}>
          {/* API Status Section */}
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
              API-Verbindung
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Konfiguriert über .env-Datei im Root-Ordner
            </div>
            
            {/* OpenAI Status */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: apiKeyStatus.openai ? '#10b981' : '#ef4444',
                flexShrink: 0
              }}></div>
              <div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  OpenAI {apiKeyStatus.openai ? '✅' : '❌'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {apiKeyStatus.openai ? 'Verbunden' : 'Nicht konfiguriert'}
                </div>
              </div>
            </div>

            {/* Anthropic Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: apiKeyStatus.anthropic ? '#10b981' : '#ef4444',
                flexShrink: 0
              }}></div>
              <div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  Anthropic {apiKeyStatus.anthropic ? '✅' : '❌'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {apiKeyStatus.anthropic ? 'Verbunden' : 'Nicht konfiguriert'}
                </div>
              </div>
            </div>

            {(!apiKeyStatus.openai || !apiKeyStatus.anthropic) && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#ef444420', 
                border: '1px solid #ef4444', 
                fontSize: '12px', 
                color: '#fca5a5' 
              }}>
                ⚠️ Fügen Sie Ihre API-Keys in die .env-Datei ein und starten Sie die App neu.
              </div>
            )}
          </div>

          {/* Hotkey Configuration */}
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
              Tastenkombinationen
            </h2>
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>Ghost aufrufen</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Aktuell: <span style={{ color: '#ffffff' }}>Cmd+Shift+G</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typing Speed */}
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
              Tippgeschwindigkeit
            </h2>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: '#ffffff' }}>
                  Verzögerung zwischen Zeichen
                </label>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {formData.typingSpeed}ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={formData.typingSpeed}
                onChange={(e) => handleInputChange("typingSpeed", parseInt(e.target.value))}
                style={{ width: '100%', height: '4px', backgroundColor: '#0a0a0a', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                <span>Schnell (50ms)</span>
                <span>Langsam (200ms)</span>
              </div>
            </div>
          </div>

          {/* Beep Volume */}
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
              Audio-Feedback
            </h2>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: '#ffffff' }}>
                  Beep-Lautstärke
                </label>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {formData.beepVolume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.beepVolume}
                onChange={(e) => handleInputChange("beepVolume", parseInt(e.target.value))}
                style={{ width: '100%', height: '4px', backgroundColor: '#0a0a0a', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                <span>Stumm (0%)</span>
                <span>Max (100%)</span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#1a1a1a', 
                color: '#94a3b8', 
                border: '1px solid #1e293b', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{ 
                flex: 1,
                padding: '12px 24px', 
                backgroundColor: '#ffffff', 
                color: '#0a0a0a', 
                border: 'none', 
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              {isSaving ? "Speichert..." : "Einstellungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
