// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

// shared/strategies/coder.ts

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const CODER_STRATEGY: Strategy = {
  id: 'coder',
  name: 'Coder',
  description: 'Wandelt Beschreibungen in Code um',
  icon: 'Code'
};

export function getCoderPrompt(text: string): string {
  return `Du bist ein erfahrener Software-Entwickler. Analysiere die Anfrage und reagiere intelligent:

ANFRAGE:
${text}

ENTSCHEIDUNGSLOGIK:

1. Falls die Anfrage EXPLIZIT nach Code/Programmierung fragt:
   → Generiere sauberen, produktionsreifen Code
   → Verwende TypeScript/JavaScript mit modernen Best Practices
   → Füge kurze Kommentare hinzu wo nötig

2. Falls die Anfrage eine ALLGEMEINE FRAGE ist (z.B. Witz, Erklärung, Frage):
   → Beantworte die Frage direkt als Text
   → KEIN Code, nur die textuelle Antwort

3. Falls die Anfrage Code-Verbesserung/Fehlerkorrektur betrifft:
   → Liefere den korrigierten Code

AUSGABE:
- NUR der Inhalt, der getippt werden soll
- KEINE Einleitungen oder Erklärungen
- KEINE Markdown-Formatierung außer wenn Code geliefert wird
- Direkt einfügbar in die Ziel-Anwendung`;
}
