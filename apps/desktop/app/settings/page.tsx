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
  transcriptionMode: "local" | "cloud" | "auto";
  localWhisperModel: "tiny" | "base" | "small" | "medium" | "large";
  whisperCpuThreads: number;
}

interface APIKeyStatus {
  openai: boolean;
  anthropic: boolean;
}

interface LocalTranscriptionCapabilities {
  pythonAvailable: boolean;
  pythonVersion?: string;
  whisperInstalled: boolean;
  gpuAvailable?: boolean;
  gpuName?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsForm>({
    typingSpeed: 50,
    beepVolume: 75,
    theme: "dark",
    transcriptionMode: "auto",
    localWhisperModel: "medium",
    whisperCpuThreads: 8,
  });
  const [apiKeyStatus, setApiKeyStatus] = useState<APIKeyStatus>({
    openai: false,
    anthropic: false,
  });
  const [localCapabilities, setLocalCapabilities] = useState<LocalTranscriptionCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCapabilities, setIsCheckingCapabilities] = useState(false);

  useEffect(() => {
    loadSettings();
    checkAPIKeys();
    checkLocalCapabilities();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await ghostAPI.loadSettings();
      if (settings) {
        setFormData({
          typingSpeed: settings.typingSpeed,
          beepVolume: settings.beepVolume,
          theme: settings.theme,
          transcriptionMode: settings.transcriptionMode || 'auto',
          localWhisperModel: settings.localWhisperModel || 'medium',
          whisperCpuThreads: settings.whisperCpuThreads || 8,
        });
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

  const checkLocalCapabilities = async () => {
    setIsCheckingCapabilities(true);
    try {
      const capabilities = await ghostAPI.getLocalTranscriptionCapabilities();
      setLocalCapabilities(capabilities);
    } catch (error) {
      console.error("Failed to check local capabilities:", error);
    } finally {
      setIsCheckingCapabilities(false);
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
      <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          color: '#6b7280',
          fontSize: '15px',
        }}>
          Lädt Einstellungen...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Header */}
        <header style={{ marginBottom: '48px' }}>
          <button
            onClick={() => router.push("/")}
            style={{
              color: '#6b7280',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <span>←</span>
            <span>Zurück</span>
          </button>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px',
            letterSpacing: '-0.025em',
          }}>
            Einstellungen
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
          }}>
            Konfiguriere deine Ghost LLM Installation
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* API Status Section */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px',
            }}>
              API-Verbindung
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '20px',
            }}>
              Konfiguriert über .env-Datei im Root-Ordner
            </p>

            {/* OpenAI Status */}
            <div style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: apiKeyStatus.openai ? '#10b981' : '#ef4444',
                flexShrink: 0
              }}></div>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#111827',
                  fontWeight: '500',
                }}>
                  OpenAI {apiKeyStatus.openai ? '✓' : '✗'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                }}>
                  {apiKeyStatus.openai ? 'Verbunden' : 'Nicht konfiguriert'}
                </div>
              </div>
            </div>

            {/* Anthropic Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: apiKeyStatus.anthropic ? '#10b981' : '#ef4444',
                flexShrink: 0
              }}></div>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#111827',
                  fontWeight: '500',
                }}>
                  Anthropic {apiKeyStatus.anthropic ? '✓' : '✗'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                }}>
                  {apiKeyStatus.anthropic ? 'Verbunden' : 'Nicht konfiguriert'}
                </div>
              </div>
            </div>

            {(!apiKeyStatus.openai || !apiKeyStatus.anthropic) && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#dc2626',
              }}>
                ⚠️ Fügen Sie Ihre API-Keys in die .env-Datei ein und starten Sie die App neu.
              </div>
            )}
          </div>

          {/* Hotkey Configuration */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
            }}>
              Tastenkombinationen
            </h2>
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Ghost aufrufen
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                  }}>
                    Aktuell: <span style={{
                      color: '#111827',
                      fontWeight: '600',
                      padding: '4px 8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}>Cmd+Shift+G</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typing Speed */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
            }}>
              Tippgeschwindigkeit
            </h2>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{
                  fontSize: '14px',
                  color: '#374151',
                }}>
                  Verzögerung zwischen Zeichen
                </label>
                <span style={{
                  fontSize: '14px',
                  color: '#111827',
                  fontWeight: '600',
                  padding: '4px 10px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}>
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
                style={{
                  width: '100%',
                  height: '6px',
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '8px',
              }}>
                <span>Schnell (50ms)</span>
                <span>Langsam (200ms)</span>
              </div>
            </div>
          </div>

          {/* Transcription Mode */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
              }}>
                Transkription
              </h2>
              <span style={{
                fontSize: '11px',
                padding: '4px 10px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}>
                Vorschau
              </span>
            </div>

            {/* System Status */}
            {isCheckingCapabilities ? (
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '20px',
              }}>
                Prüfe System-Voraussetzungen...
              </div>
            ) : localCapabilities && (
              <div style={{
                marginBottom: '20px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px',
                }}>
                  System-Status
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#374151',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {localCapabilities.pythonAvailable ? '✓' : '✗'}
                    </span>
                    <span style={{
                      color: localCapabilities.pythonAvailable ? '#059669' : '#dc2626',
                      fontWeight: '500'
                    }}>
                      Python {localCapabilities.pythonAvailable ? `(${localCapabilities.pythonVersion})` : 'nicht installiert'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {localCapabilities.whisperInstalled ? '✓' : '✗'}
                    </span>
                    <span style={{
                      color: localCapabilities.whisperInstalled ? '#059669' : '#dc2626',
                      fontWeight: '500'
                    }}>
                      faster-whisper {localCapabilities.whisperInstalled ? 'installiert' : 'nicht installiert'}
                    </span>
                  </div>
                  {localCapabilities.whisperInstalled && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {localCapabilities.gpuAvailable ? '🚀' : '💻'}
                      </span>
                      <span style={{
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {localCapabilities.gpuAvailable ? `GPU: ${localCapabilities.gpuName}` : 'GPU: Nicht verfügbar (CPU-Modus)'}
                      </span>
                    </div>
                  )}
                </div>
                {!localCapabilities.pythonAvailable && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    fontSize: '12px',
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                  }}>
                    ⚠️ Python 3.8+ wird benötigt für lokale Transkription
                  </div>
                )}
                {localCapabilities.pythonAvailable && !localCapabilities.whisperInstalled && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    fontSize: '12px',
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                  }}>
                    ⚠️ Führe aus: pip install faster-whisper
                  </div>
                )}
              </div>
            )}

            {/* Mode Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '13px',
                color: '#374151',
                marginBottom: '8px',
                display: 'block',
                fontWeight: '500',
              }}>
                Transkriptions-Modus
              </label>
              <select
                value={formData.transcriptionMode}
                onChange={(e) => handleInputChange("transcriptionMode", e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="auto">🔄 Auto (Lokal → Cloud Fallback)</option>
                <option value="local">💻 Nur Lokal (faster-whisper)</option>
                <option value="cloud">☁️ Nur Cloud (OpenAI API)</option>
              </select>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '6px',
              }}>
                {formData.transcriptionMode === 'auto' && 'Versucht zuerst lokale Transkription, fällt bei Fehler auf Cloud zurück'}
                {formData.transcriptionMode === 'local' && 'Offline-Modus: Funktioniert ohne Internet, benötigt Python + faster-whisper'}
                {formData.transcriptionMode === 'cloud' && 'Online-Modus: Nutzt OpenAI API (benötigt API-Key)'}
              </div>
            </div>

            {/* Model Selection (only if local or auto) */}
            {(formData.transcriptionMode === 'local' || formData.transcriptionMode === 'auto') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '13px',
                  color: '#374151',
                  marginBottom: '8px',
                  display: 'block',
                  fontWeight: '500',
                }}>
                  Lokales Modell
                </label>
                <select
                  value={formData.localWhisperModel}
                  onChange={(e) => handleInputChange("localWhisperModel", e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="tiny">Tiny (~75MB) - Sehr schnell</option>
                  <option value="base">Base (~145MB) - Schnell</option>
                  <option value="small">Small (~480MB) - Gut</option>
                  <option value="medium">Medium (~1.5GB) - Empfohlen ⭐</option>
                  <option value="large">Large (~3GB) - Beste Qualität</option>
                </select>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '6px',
                }}>
                  Modell wird beim ersten Start automatisch heruntergeladen
                </div>
              </div>
            )}

            {/* CPU Threads */}
            {(formData.transcriptionMode === 'local' || formData.transcriptionMode === 'auto') && !localCapabilities?.gpuAvailable && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <label style={{
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500',
                  }}>
                    CPU Threads
                  </label>
                  <span style={{
                    fontSize: '14px',
                    color: '#111827',
                    fontWeight: '600',
                    padding: '4px 10px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}>
                    {formData.whisperCpuThreads}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={formData.whisperCpuThreads}
                  onChange={(e) => handleInputChange("whisperCpuThreads", parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    cursor: 'pointer',
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '8px',
                }}>
                  <span>1 Thread</span>
                  <span>16 Threads</span>
                </div>
              </div>
            )}
          </div>

          {/* Beep Volume */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
            }}>
              Audio-Feedback
            </h2>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{
                  fontSize: '14px',
                  color: '#374151',
                }}>
                  Beep-Lautstärke
                </label>
                <span style={{
                  fontSize: '14px',
                  color: '#111827',
                  fontWeight: '600',
                  padding: '4px 10px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}>
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
                style={{
                  width: '100%',
                  height: '6px',
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '8px',
              }}>
                <span>Stumm (0%)</span>
                <span>Max (100%)</span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
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
                backgroundColor: isSaving ? '#9ca3af' : '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = '#111827';
                }
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
