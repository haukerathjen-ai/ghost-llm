// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

/**
 * Transcription Validation Module
 * Validates and improves transcription quality
 */

interface TranscriptionValidation {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Validates transcription result for common issues
 */
export function validateTranscription(text: string, audioMetrics?: { duration: number; rmsLevel: number }): TranscriptionValidation {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let confidence = 100;

  // Check 1: Empty or very short transcription
  if (!text || text.trim().length === 0) {
    issues.push('Transcription is empty');
    confidence = 0;
  } else if (text.trim().length < 3) {
    issues.push('Transcription is too short (less than 3 characters)');
    confidence -= 30;
    suggestions.push('Audio might be too short or unclear');
  }

  // Check 2: Hallucination patterns (Whisper known issues)
  const hallucinationPatterns = [
    { pattern: /amara\.org/i, name: 'Amara.org subtitle watermark' },
    { pattern: /untertitel/i, name: 'German subtitle text' },
    { pattern: /community/i, name: 'Community watermark' },
    { pattern: /subtitle/i, name: 'Subtitle watermark' },
    { pattern: /www\./i, name: 'Website URL (likely hallucination)' },
    { pattern: /\[.*?\]/i, name: 'Bracket annotations (subtitle format)' },
    { pattern: /^(music|applause|laughter)$/i, name: 'Sound effect description' },
  ];

  for (const { pattern, name } of hallucinationPatterns) {
    if (pattern.test(text)) {
      issues.push(`Detected hallucination: ${name}`);
      confidence -= 40;
      suggestions.push('Audio might be silent or too quiet');
    }
  }

  // Check 3: Repeated words (common Whisper bug with silence)
  const words = text.toLowerCase().split(/\s+/);
  if (words.length >= 3) {
    const repeatedWord = words[0];
    const allSame = words.every(w => w === repeatedWord);
    if (allSame) {
      issues.push(`All words are identical: "${repeatedWord}"`);
      confidence -= 50;
      suggestions.push('Whisper is hallucinating - audio might be corrupted');
    }
  }

  // Check 4: Excessive repetition
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;
  if (words.length > 10 && repetitionRatio < 0.3) {
    issues.push('High word repetition detected');
    confidence -= 20;
    suggestions.push('Transcription quality might be low');
  }

  // Check 5: Audio duration vs text length correlation
  if (audioMetrics) {
    const wordsPerSecond = words.length / audioMetrics.duration;
    
    // Typical speech is 2-4 words per second
    if (wordsPerSecond < 0.5) {
      issues.push('Too few words for audio duration');
      confidence -= 15;
      suggestions.push('Audio might be mostly silence');
    } else if (wordsPerSecond > 6) {
      issues.push('Too many words for audio duration');
      confidence -= 15;
      suggestions.push('Transcription might include hallucinations');
    }
  }

  // Check 6: Special character spam (corrupted transcription)
  const specialCharCount = (text.match(/[^a-zA-ZäöüßÄÖÜ0-9\s,.!?'-]/g) || []).length;
  const specialCharRatio = specialCharCount / text.length;
  if (specialCharRatio > 0.3) {
    issues.push('Excessive special characters detected');
    confidence -= 25;
    suggestions.push('Transcription might be corrupted');
  }

  // Check 7: Language consistency (should be mostly German based on prompt)
  const germanIndicators = /\b(der|die|das|und|ist|sind|auf|mit|für|von|ich|du|er|sie|es)\b/gi;
  const germanMatches = (text.match(germanIndicators) || []).length;
  const totalWords = words.length;
  
  if (totalWords > 5 && germanMatches === 0) {
    issues.push('No German words detected (expected German)');
    confidence -= 10;
    suggestions.push('Check if correct language was used');
  }

  // Final validation
  const isValid = confidence > 40 && issues.length < 3;

  return {
    isValid,
    confidence: Math.max(0, Math.min(100, confidence)),
    issues,
    suggestions,
  };
}

/**
 * Post-processes transcription text to fix common issues
 */
export function postProcessTranscription(text: string): string {
  let processed = text;

  // Remove common Whisper artifacts
  processed = processed.replace(/\[.*?\]/g, ''); // Remove bracket annotations
  processed = processed.replace(/www\.\S+/g, ''); // Remove URLs (likely hallucinations)
  
  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim();
  
  // Fix common German transcription issues
  processed = processed.replace(/ae/g, 'ä'); // Sometimes Whisper writes ae instead of ä
  processed = processed.replace(/oe/g, 'ö');
  processed = processed.replace(/ue/g, 'ü');
  
  // Capitalize first letter
  if (processed.length > 0) {
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);
  }

  return processed;
}

/**
 * Logs validation results
 */
export function logValidationResult(validation: TranscriptionValidation, text: string): void {
  console.log('[TranscribeValidator] Validation Result:');
  console.log(`  - Valid: ${validation.isValid ? '✅' : '❌'}`);
  console.log(`  - Confidence: ${validation.confidence}%`);
  
  if (validation.issues.length > 0) {
    console.log('  - Issues:');
    validation.issues.forEach(issue => console.log(`    • ${issue}`));
  }
  
  if (validation.suggestions.length > 0) {
    console.log('  - Suggestions:');
    validation.suggestions.forEach(suggestion => console.log(`    • ${suggestion}`));
  }
  
  if (!validation.isValid) {
    console.error('[TranscribeValidator] ⚠️ Transcription failed validation!');
    console.error(`[TranscribeValidator] Text: "${text}"`);
  }
}
