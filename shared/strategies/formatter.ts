```typescript
// shared/strategies/formatter.ts

export const FORMATTER_STRATEGY = {
  id: 'formatter',
  name: 'Formatter',
  description: 'Bereinigt und formatiert den transkribierten Text',
  icon: 'FileText'
} as const;

export function getFormatterPrompt(text: string): string {
  return `Du bist ein professioneller Textformatierer. Deine Aufgabe ist es, den folgenden transkribierten Text zu bereinigen und zu formatieren.

ANWEISUNGEN:
- Korrigiere Grammatik- und Rechtschreibfehler
- Entferne Füllwörter (wie "ähm", "also", "sozusagen", etc.)
- Behalte die ursprüngliche Bedeutung und den Inhalt vollständig bei
- Formatiere den Text in klare, logische Absätze
- Verbessere die Lesbarkeit durch angemessene Satzstruktur
- Entferne unnötige Wiederholungen
- Behalte wichtige Betonungen und Aussagen bei

Gib NUR den bereinigten und formatierten Text zurück, ohne zusätzliche Kommentare oder Erklärungen.

TEXT:
${text}`;
}
```