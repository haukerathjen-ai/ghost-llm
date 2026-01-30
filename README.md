# 👻 Ghost LLM – The Invisible OS-Agent

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-33.2-47848F)](https://www.electronjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

> **Ein hybrider Next.js/Electron Desktop-Agent für nahtloses Ghost Typing via Voice-to-Text**

Ghost LLM ist ein innovativer Desktop-Agent, der Spracheingaben in professionell verarbeiteten Text umwandelt und diesen direkt in jede Anwendung "tippt" - unsichtbar wie ein Geist.

## 🎯 Vision

Ghost LLM kombiniert modernste Sprachverarbeitung mit nativer OS-Integration, um einen reibungslosen Workflow für Entwickler, Content Creators und Professionals zu schaffen. Der Agent arbeitet im Hintergrund und verwandelt deine Sprache in perfekt formatierten Text - ob Code, Dokumentation oder kreative Inhalte.

## ✨ Features

### 🎤 Voice-to-Text Pipeline
- **Whisper-Transkription**: OpenAI Whisper für hochpräzise Spracherkennung
- **Claude 3.5 Enrichment**: KI-gestützte Textverbesserung und Formatierung
- **Strategy System**: Flexible Verarbeitungsstrategien (Formatter, Coder, Summarizer)

### ⌨️ Native OS-Integration
- **True Ghost Typing**: Character-by-character Keyboard-Simulation
- **Multi-Platform Support**:
  - **Windows**: PowerShell SendKeys
  - **macOS**: AppleScript keystroke
  - **Linux**: xdotool integration
- **Keine externen Dependencies**: Nutzt ausschließlich OS-native Befehle

### 🔒 Security & Privacy
- **ISO 27001-konforme Sicherheit**
- **Forensic Wipe**: Sichere Löschung sensibler Daten
- **Local-First**: Audio-Verarbeitung auf deinem Gerät
- **Encrypted Storage**: Electron Store mit Verschlüsselung

### 🎨 Modern UI
- **Next.js 14 Frontend**: React-basiertes Dashboard
- **Tailwind CSS**: Moderne, responsive UI
- **Real-time Status**: Live-Feedback während der Verarbeitung

## 🏗️ Architektur

Ghost LLM verwendet ein **Monorepo-Setup** mit klarer Trennung der Verantwortlichkeiten:

```
ghost-llm/
├── apps/
│   ├── desktop/          # Next.js Frontend (UI)
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React Components
│   │   └── hooks/        # Custom React Hooks
│   │
│   └── electron/         # Electron Main Process
│       ├── main.ts       # Electron Entry Point
│       ├── preload.ts    # IPC Bridge
│       └── modules/      # Core Modules
│           ├── audio.ts      # Audio Recording
│           ├── transcribe.ts # Whisper Integration
│           ├── enrich.ts     # Claude Integration
│           ├── ghost.ts      # Ghost Typing Engine
│           ├── hotkey.ts     # Global Hotkeys
│           └── store.ts      # Data Persistence
│
└── shared/               # Shared Types & Config
    ├── config/          # Configuration
    ├── strategies/      # Processing Strategies
    └── types/           # TypeScript Types

```

### Datenfluss

```
[Microphone]
    ↓
[Audio Recording] (audio.ts)
    ↓
[Whisper API] (transcribe.ts)
    ↓
[Claude 3.5 API] (enrich.ts)
    ↓
[Strategy Processing] (strategies/)
    ↓
[Ghost Typer] (ghost.ts)
    ↓
[Target Application]
```

## 🚀 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 14.x |
| **Desktop** | Electron | 33.2.x |
| **UI Framework** | React | 18.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **Language** | TypeScript | 5.3.x |
| **State** | Electron Store | 8.x |
| **Audio** | node-record-lpcm16 | 1.x |
| **AI Services** | OpenAI API | 4.77.x |
| | Anthropic API | 0.32.x |

## 📦 Installation

### Voraussetzungen

- Node.js 18+ und npm
- Python 3.x (für Audio-Dependencies)
- **macOS**: Accessibility-Permissions für Ghost Typing
- **Linux**: xdotool installiert (`sudo apt-get install xdotool`)
- **Windows**: PowerShell (vorinstalliert)

### Setup

```bash
# Repository klonen
git clone https://github.com/yourusername/ghost-llm.git
cd ghost-llm

# Dependencies installieren
npm install

# Environment Variables konfigurieren
cp .env.example .env
# Füge deine API-Keys hinzu:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Development starten
npm run dev

# Production Build
npm run build
npm start
```

## 🎮 Verwendung

### Globaler Hotkey
Drücke **Cmd+Shift+G** (macOS) oder **Ctrl+Shift+G** (Windows/Linux), um die Aufnahme zu starten/stoppen.

### Workflows

1. **Quick Typing**
   - Hotkey drücken
   - Sprechen
   - Hotkey drücken
   - Text wird automatisch getippt

2. **Strategy Selection**
   - Im Dashboard Strategie auswählen:
     - **Formatter**: Bereinigt und formatiert Text
     - **Coder**: Generiert Code aus Beschreibungen
     - **Summarizer**: Erstellt Zusammenfassungen
   - Aufnahme starten
   - Verarbeiteter Text wird getippt

3. **History & Review**
   - Alle Transkriptionen in `/history` einsehen
   - Texte nachträglich kopieren
   - Historie nach Strategy filtern

## 🔧 Konfiguration

### App-Einstellungen (`/settings`)

- **API-Keys**: OpenAI und Anthropic
- **Typing Speed**: 50-200ms pro Zeichen
- **Initial Delay**: Wartezeit vor dem Typing
- **Theme**: Dark/Darker Mode
- **Auto-Paste**: Toggle zwischen Typing und Paste-Modus

### Strategy-Konfiguration

Eigene Strategies in `shared/strategies/` definieren:

```typescript
export const MY_STRATEGY = {
  id: 'my-strategy',
  name: 'My Strategy',
  description: 'Custom processing logic',
  icon: 'Icon'
} as const;

export function getMyStrategyPrompt(text: string): string {
  return `Process this text: ${text}`;
}
```

## 🔐 Security & Privacy

Ghost LLM nimmt Sicherheit ernst:

- ✅ **Local Audio Processing**: Audio verbleibt auf deinem Gerät
- ✅ **Encrypted Storage**: Sensible Daten werden verschlüsselt gespeichert
- ✅ **API-Key Protection**: Keys werden sicher im Electron Store verwahrt
- ✅ **Forensic Wipe**: Historie kann vollständig gelöscht werden
- ✅ **No Telemetry**: Keine Datensammlung oder Tracking
- ✅ **ISO 27001 Compliant**: Entwickelt nach Security Best Practices

### Berechtigungen

**macOS**: Accessibility-Zugriff erforderlich
```
System Preferences → Security & Privacy → Privacy → Accessibility
→ Ghost LLM aktivieren
```

**Linux**: xdotool für Keyboard-Automation
```bash
sudo apt-get install xdotool  # Debian/Ubuntu
sudo yum install xdotool       # RHEL/Fedora
```

## 🧪 Development

### Project Structure

```bash
npm run dev              # Start Development (Desktop + Electron)
npm run dev:desktop      # Nur Next.js Frontend
npm run dev:electron     # Nur Electron Main Process
npm run build           # Production Build
npm run lint            # Code Linting
```

### Module Development

- **Frontend Components**: `apps/desktop/components/`
- **Electron Modules**: `apps/electron/modules/`
- **Shared Types**: `shared/types/`
- **Strategies**: `shared/strategies/`

### Testing

```bash
# Unit Tests (coming soon)
npm test

# E2E Tests (coming soon)
npm run test:e2e
```

## 🤝 Contributing

Contributions sind willkommen! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Changes (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits

## 📝 Roadmap

- [ ] **v1.1**: Plugin-System für Custom Strategies
- [ ] **v1.2**: Multi-Language Support
- [ ] **v1.3**: Cloud Sync (optional)
- [ ] **v1.4**: Mobile Companion App
- [ ] **v2.0**: Local LLM Support (Ollama)
- [ ] **v2.1**: Voice Commands (Control UI via Voice)

## 🐛 Known Issues

- Linux: xdotool muss manuell installiert werden
- macOS: Accessibility-Permissions werden bei jedem Update neu angefordert
- Windows: SendKeys kann bei einigen Anwendungen langsamer sein

## 📄 Lizenz

Ghost LLM ist lizenziert unter der **GNU General Public License v3.0**.

```
Copyright (c) 2026 Ghost LLM Team

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```

Siehe [LICENSE](LICENSE) für den vollständigen Lizenztext.

## 🙏 Acknowledgments

- [OpenAI Whisper](https://openai.com/research/whisper) - Spracherkennung
- [Anthropic Claude](https://www.anthropic.com/claude) - Text-Enrichment
- [Electron](https://www.electronjs.org/) - Desktop Framework
- [Next.js](https://nextjs.org/) - React Framework

## 📧 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/ghost-llm/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/ghost-llm/discussions)
- 📧 **Email**: support@ghostllm.dev (coming soon)

---

**Made with ❤️ by the Ghost LLM Team**

*The invisible agent that types for you.*
