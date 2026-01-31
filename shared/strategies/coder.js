"use strict";
// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODER_STRATEGY = void 0;
exports.getCoderPrompt = getCoderPrompt;
exports.CODER_STRATEGY = {
    id: 'coder',
    name: 'Coder',
    description: 'Wandelt Beschreibungen in Code um',
    icon: 'Code'
};
function getCoderPrompt(text) {
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
//# sourceMappingURL=coder.js.map