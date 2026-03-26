// Debate-Markdown shorthand rendering (§11)
// Display-only: raw shorthands stored in data, rendered for display.

const REPLACEMENTS: [RegExp, string][] = [
  [/<=>/g, '⇔'],
  [/=>/g, '⇒'],
  [/->/g, '→'],
  [/<-/g, '←'],
  [/!=/g, '≠'],
  [/~=/g, '≈'],
  [/>>/g, '≫'],
  [/<</g, '≪'],
  [/\bt\/f\b/g, '∴'],
  [/\bb\/c\b/g, '∵'],
  [/\bgovt\b/gi, 'Government'],
  [/\boppo\b/gi, 'Opposition'],
  [/\bsq\b/g, 'Status Quo'],
  [/\+\+/g, '⊕'],
  [/--/g, '⊖'],
];

export function renderDebateMarkdown(text: string): string {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
