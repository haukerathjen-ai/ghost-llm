// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ghostAPI } from "@/lib/ghost-api";

interface SettingsForm {
  openaiApiKey: string;
  anthropicApiKey: string;
  typingSpeed: number;
  autoPaste: boolean;
  theme: "dark" | "darker";
}

export default function SettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsForm>({
    openaiApiKey: "",
    anthropicApiKey: "",
    typingSpeed: 100,
    autoPaste: false,
    theme: "dark",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  useEffect(() => {
    loadSettings();
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
          {/* API Keys Section */}
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
              API-Schlüssel
            </h2>
            
            {/* OpenAI API Key */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                OpenAI API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showOpenAIKey ? "text" : "password"}
                  value={formData.openaiApiKey}
                  onChange={(e) => handleInputChange("openaiApiKey", e.target.value)}
                  placeholder="sk-..."
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #1e293b', 
                    padding: '12px', 
                    paddingRight: '80px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#94a3b8', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                >
                  {showOpenAIKey ? "Verbergen" : "Anzeigen"}
                </button>
              </div>
            </div>

            {/* Anthropic API Key */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                Anthropic API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAnthropicKey ? "text" : "password"}
                  value={formData.anthropicApiKey}
                  onChange={(e) => handleInputChange("anthropicApiKey", e.target.value)}
                  placeholder="sk-ant-..."
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #1e293b', 
                    padding: '12px', 
                    paddingRight: '80px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#94a3b8', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                >
                  {showAnthropicKey ? "Verbergen" : "Anzeigen"}
                </button>
              </div>
            </div>
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

          {/* Auto-paste vs Auto-type */}
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #1e293b', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '16px' }}>
              Einfügemodus
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>Auto-Paste</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {formData.autoPaste ? "Text wird direkt eingefügt" : "Text wird Zeichen für Zeichen getippt"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange("autoPaste", !formData.autoPaste)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  height: '24px',
                  width: '44px',
                  alignItems: 'center',
                  backgroundColor: formData.autoPaste ? '#ffffff' : '#1e293b',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: '16px',
                    width: '16px',
                    backgroundColor: formData.autoPaste ? '#0a0a0a' : '#ffffff',
                    transform: formData.autoPaste ? 'translateX(24px)' : 'translateX(4px)',
                  }}
                />
              </button>
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
