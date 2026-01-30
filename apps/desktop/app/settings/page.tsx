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
      // Show success feedback
      setTimeout(() => {
        router.push("/dashboard");
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

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">Lädt Einstellungen...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <span>←</span>
            <span>Zurück zum Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold">Einstellungen</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* API Keys Section */}
          <section className="bg-[#111] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">API-Schlüssel</h2>
            
            {/* OpenAI API Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenAIKey ? "text" : "password"}
                  value={formData.openaiApiKey}
                  onChange={(e) =>
                    handleInputChange("openaiApiKey", e.target.value)
                  }
                  placeholder="sk-..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-4 py-2 pr-20 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white px-3 py-1 text-sm"
                >
                  {showOpenAIKey ? "Verbergen" : "Anzeigen"}
                </button>
              </div>
            </div>

            {/* Anthropic API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Anthropic API Key
              </label>
              <div className="relative">
                <input
                  type={showAnthropicKey ? "text" : "password"}
                  value={formData.anthropicApiKey}
                  onChange={(e) =>
                    handleInputChange("anthropicApiKey", e.target.value)
                  }
                  placeholder="sk-ant-..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-4 py-2 pr-20 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white px-3 py-1 text-sm"
                >
                  {showAnthropicKey ? "Verbergen" : "Anzeigen"}
                </button>
              </div>
            </div>
          </section>

          {/* Hotkey Configuration */}
          <section className="bg-[#111] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Tastenkombinationen</h2>
            <div className="bg-[#1a1a1a] border border-gray-700 rounded px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-300">Ghost aufrufen</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Aktuell: <span className="text-white">Cmd+Shift+G</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Änderbar in Systemeinstellungen
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ℹ️ Hotkeys können in den Systemeinstellungen der App geändert werden
            </p>
          </section>

          {/* Typing Speed */}
          <section className="bg-[#111] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Tippgeschwindigkeit</h2>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-300">
                  Verzögerung zwischen Zeichen
                </label>
                <span className="text-sm text-gray-400">
                  {formData.typingSpeed}ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={formData.typingSpeed}
                onChange={(e) =>
                  handleInputChange("typingSpeed", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Schnell (50ms)</span>
                <span>Langsam (200ms)</span>
              </div>
            </div>
          </section>

          {/* Auto-paste vs Auto-type */}
          <section className="bg-[#111] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Einfügemodus</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-300">Auto-Paste</div>
                <div className="text-sm text-gray-500 mt-1">
                  {formData.autoPaste
                    ? "Text wird direkt eingefügt"
                    : "Text wird Zeichen für Zeichen getippt"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange("autoPaste", !formData.autoPaste)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.autoPaste ? "bg-blue-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.autoPaste ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Theme Selection */}
          <section className="bg-[#111] p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Theme</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange("theme", "dark")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.theme === "dark"
                    ? "border-blue-500 bg-[#1a1a1a]"
                    : "border-gray-700 bg-[#0d0d0d] hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Dark</span>
                  {formData.theme === "dark" && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
                <div className="h-12 bg-[#1a1a1a] rounded border border-gray-700"></div>
              </button>

              <button
                type="button"
                onClick={() => handleInputChange("theme", "darker")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.theme === "darker"
                    ? "border-blue-500 bg-[#1a1a1a]"
                    : "border-gray-700 bg-[#0d0d0d] hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Darker</span>
                  {formData.theme === "darker" && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
                <div className="h-12 bg-[#050505] rounded border border-gray-800"></div>
              </button>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#222] transition-colors border border-gray-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? "Speichert..." : "Einstellungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}