```typescript
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
  return `Du bist ein erfahrener Software-Entwickler. Deine Aufgabe ist es, die folgende Beschreibung in sauberen, produktionsreifen Code umzuwandeln.

ANFORDERUNG:
${text}

ANWEISUNGEN:
- Interpretiere die Anforderung als Code-Aufgabe
- Generiere sauberen, gut strukturierten TypeScript/JavaScript Code
- Füge kurze, prägnante Kommentare hinzu wo nötig
- Verwende moderne Best Practices und idiomatische Patterns
- Gebe NUR den Code aus, keine Erklärungen oder Markdown außerhalb des Code-Blocks
- Der Output soll direkt in eine Datei einfügbar sein
- Nutze aussagekräftige Variablen- und Funktionsnamen
- Achte auf Lesbarkeit und Wartbarkeit

Beginne jetzt mit der Code-Generierung:`;
}

```