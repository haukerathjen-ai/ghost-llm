# Setup: Lokales Whisper-Modell

Ghost LLM unterstützt jetzt **lokale Transkription** mit faster-whisper als Alternative zur Cloud-basierten OpenAI Whisper API.

## 📋 Voraussetzungen

### 1. Python installieren (falls noch nicht vorhanden)

**Windows:**
- Download: https://www.python.org/downloads/
- Mindestversion: Python 3.8+
- **Wichtig:** Aktiviere "Add Python to PATH" während der Installation

**macOS:**
```bash
brew install python3
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

### 2. faster-whisper installieren

```bash
pip install faster-whisper
```

### 3. (Optional) GPU-Beschleunigung

Für **NVIDIA GPUs** (CUDA):
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

Dies beschleunigt die Transkription erheblich (4-10x schneller als CPU).

## 🚀 Verwendung

### Transkriptions-Modi

Ghost LLM bietet drei Modi:

1. **Auto (Empfohlen)** 🔄
   - Versucht zuerst lokale Transkription
   - Fällt bei Fehler automatisch auf Cloud zurück
   - Beste Balance aus Geschwindigkeit und Zuverlässigkeit

2. **Nur Lokal** 💻
   - Transkription komplett offline
   - Benötigt keine OpenAI API-Key
   - Funktioniert ohne Internet
   - Schneller bei GPU-Nutzung

3. **Nur Cloud** ☁️
   - Nutzt OpenAI Whisper API
   - Zuverlässig, aber langsamer
   - Benötigt Internet + API-Key

### Einstellungen konfigurieren

1. Öffne Ghost LLM
2. Gehe zu **Einstellungen**
3. Wähle unter **Transkription**:
   - **Modus**: Auto / Lokal / Cloud
   - **Modell**: small (empfohlen), tiny, base, medium, large
   - **CPU Threads**: 8 (empfohlen)

### Modell-Größen

| Modell | Größe | Geschwindigkeit | Qualität |
|--------|-------|----------------|----------|
| tiny   | ~75MB | ⚡⚡⚡ Sehr schnell | ⭐⭐ Basis |
| base   | ~145MB | ⚡⚡ Schnell | ⭐⭐⭐ Gut |
| **small** | **~480MB** | **⚡ Normal** | **⭐⭐⭐⭐ Empfohlen** |
| medium | ~1.5GB | 🐌 Langsamer | ⭐⭐⭐⭐⭐ Sehr gut |
| large  | ~3GB | 🐌🐌 Sehr langsam | ⭐⭐⭐⭐⭐⭐ Beste |

**Empfehlung:** Starte mit `small` - es bietet den besten Kompromiss aus Geschwindigkeit und Qualität.

## ⚙️ Technische Details

### CPU vs. GPU Performance

**CPU-Modus** (ohne CUDA):
- Small-Modell: ~5-15 Sekunden für 5s Audio
- Nutzt 8 Threads standardmäßig
- Funktioniert auf jedem System

**GPU-Modus** (mit CUDA):
- Small-Modell: ~1-3 Sekunden für 5s Audio
- 4-10x schneller als CPU
- Benötigt NVIDIA GPU mit CUDA support

### Audio-Pipeline

```
Audio Recording (SoX/mic)
    ↓ (WAV 16kHz, 16-bit, mono)
    ↓
Audio Preprocessing (Normalize, Denoise, Filter)
    ↓
    ├─→ [Local] faster-whisper (Python)
    │       ├─ GPU (CUDA) oder
    │       └─ CPU (8 Threads)
    │
    └─→ [Cloud] OpenAI Whisper API (Fallback)
    ↓
Transcription Result
```

### Modell-Download

- Beim **ersten Start** wird das gewählte Modell automatisch heruntergeladen
- Modelle werden im Cache gespeichert: `~/.cache/huggingface/`
- Einmaliger Download, danach offline verfügbar

## 🔧 Problemlösung

### "Python not found"
- Stelle sicher, dass Python im PATH ist
- Teste mit: `python --version` oder `python3 --version`
- Windows: Neuinstallation mit "Add to PATH" Option

### "faster-whisper not installed"
- Installiere mit: `pip install faster-whisper`
- Bei Fehlern: `pip install --upgrade faster-whisper`

### "GPU not detected"
- Prüfe CUDA-Installation: `python -c "import torch; print(torch.cuda.is_available())"`
- Falls False: Installiere PyTorch mit CUDA-Support

### Langsame Transkription
- **CPU:** Reduziere Threads oder nutze kleineres Modell (tiny/base)
- **GPU:** Stelle sicher, dass CUDA richtig installiert ist
- Prüfe GPU-Status in den Einstellungen

### Erste Ausführung dauert lange
- Das ist normal - Modell wird heruntergeladen
- Small-Modell: ~480MB Download
- Danach ist es sofort verfügbar

## 📊 Vergleich: Lokal vs. Cloud

| Feature | Lokal (faster-whisper) | Cloud (OpenAI) |
|---------|------------------------|----------------|
| **Geschwindigkeit** | ⚡⚡⚡ Mit GPU sehr schnell | 🐌 Netzwerk-abhängig |
| **Offline** | ✅ Ja | ❌ Benötigt Internet |
| **Kosten** | ✅ Kostenlos | 💰 API-Kosten |
| **Qualität** | ⭐⭐⭐⭐ Sehr gut | ⭐⭐⭐⭐⭐ Exzellent |
| **Privacy** | ✅ 100% lokal | ❌ Daten verlassen System |
| **Setup** | ⚙️ Python + pip | 🔑 API-Key |

## 🎯 Empfehlungen

- **Entwickler mit GPU:** Lokal-Modus mit small-Modell
- **Ohne GPU:** Auto-Modus (nutzt Cloud als Fallback)
- **Maximale Privacy:** Nur-Lokal mit small/medium
- **Beste Qualität:** Cloud-Modus oder Lokal mit large-Modell

## 📝 Weitere Informationen

- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- Original Whisper: https://github.com/openai/whisper
- CUDA Installation: https://developer.nvidia.com/cuda-downloads
