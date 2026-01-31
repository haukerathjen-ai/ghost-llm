"use strict";
// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUMMARIZER_STRATEGY = void 0;
exports.getSummarizerPrompt = getSummarizerPrompt;
// shared/strategies/summarizer.ts
exports.SUMMARIZER_STRATEGY = {
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Fasst lange Texte prägnant zusammen',
    icon: 'ListCollapse'
};
function getSummarizerPrompt(text) {
    return `Du bist ein Experte für präzise Textzusammenfassungen. Deine Aufgabe ist es, den folgenden Text kompakt und verständlich zusammenzufassen.

ANWEISUNGEN:
- Extrahiere die wichtigsten Kernaussagen des Textes
- Erstelle eine strukturierte Zusammenfassung in Bullet-Points
- Maximal 5 Hauptpunkte
- Priorisiere die Punkte nach Wichtigkeit (wichtigste zuerst)
- Sei prägnant und verzichte auf unnötige Details
- Verwende klare, verständliche Sprache
- Ziel: Schnelles Erfassen der Hauptinhalte

TEXT ZUM ZUSAMMENFASSEN:
${text}

ZUSAMMENFASSUNG:`;
}
//# sourceMappingURL=summarizer.js.map