import { SPEAKER_CODES, TYPE_CODES } from '../types';
import type { Speaker, NodeType } from '../types';

export interface ParsedCommand {
  speaker: Speaker;
  type: NodeType;
  content: string;
  refTarget?: string; // e.g. "pm.1" for refutation linking
  extSource?: string; // e.g. "og.2" for extension linking
}

export interface ParsedPoi {
  offeredBy: Speaker;
  receivedBy: Speaker;
  accepted: boolean;
  content: string;
}

export interface ParsePreview {
  speakerLabel?: string;
  typeLabel?: string;
  isPoi?: boolean;
  isValid: boolean;
}

/**
 * Parse a POI command.
 * Syntax: poi [speaker_offering] [speaker_receiving] [a/d] [optional content]
 */
export function parsePoi(input: string): ParsedPoi | null {
  const trimmed = input.trim();
  if (!trimmed.toLowerCase().startsWith('poi ')) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 4) return null;

  const offeredBy = SPEAKER_CODES[parts[1].toLowerCase()];
  const receivedBy = SPEAKER_CODES[parts[2].toLowerCase()];
  if (!offeredBy || !receivedBy) return null;

  const adCode = parts[3].toLowerCase();
  if (adCode !== 'a' && adCode !== 'd') return null;

  return {
    offeredBy,
    receivedBy,
    accepted: adCode === 'a',
    content: parts.slice(4).join(' '),
  };
}

/**
 * Parse a command bar input string.
 * Syntax: [speaker] [type] [content]
 * For refutations: [speaker] r [target] [content]
 * For extensions: [speaker] e [source] [content]
 */
export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Don't parse POI commands as regular commands
  if (trimmed.toLowerCase().startsWith('poi ')) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length < 3) return null;

  const speakerCode = parts[0].toLowerCase();
  const typeCode = parts[1].toLowerCase();

  const speaker = SPEAKER_CODES[speakerCode];
  const type = TYPE_CODES[typeCode];

  if (!speaker || !type) return null;

  // Check for refutation target (r pm.1 ...)
  if (type === 'refutation' && parts.length >= 4 && /^\w+\.\d+$/.test(parts[2])) {
    return {
      speaker,
      type,
      content: parts.slice(3).join(' '),
      refTarget: parts[2].toLowerCase(),
    };
  }

  // Check for extension source (e og.2 ...)
  if (type === 'extension' && parts.length >= 4 && /^\w+\.\d+$/.test(parts[2])) {
    return {
      speaker,
      type,
      content: parts.slice(3).join(' '),
      extSource: parts[2].toLowerCase(),
    };
  }

  return {
    speaker,
    type,
    content: parts.slice(2).join(' '),
  };
}

/**
 * Generate ghost preview text from partial input.
 */
export function getPreview(input: string): ParsePreview {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 0) return { isValid: false };

  // POI preview
  if (parts[0].toLowerCase() === 'poi') {
    if (parts.length >= 4) {
      const offeredBy = SPEAKER_CODES[parts[1]?.toLowerCase()];
      const receivedBy = SPEAKER_CODES[parts[2]?.toLowerCase()];
      const ad = parts[3]?.toLowerCase();
      if (offeredBy && receivedBy && (ad === 'a' || ad === 'd')) {
        return { isPoi: true, speakerLabel: `POI: ${offeredBy} → ${receivedBy} (${ad === 'a' ? 'accepted' : 'declined'})`, isValid: true };
      }
    }
    return { isPoi: true, speakerLabel: 'POI', isValid: false };
  }

  const speakerCode = parts[0].toLowerCase();
  const speaker = SPEAKER_CODES[speakerCode];

  if (!speaker) return { isValid: false };

  if (parts.length === 1) {
    return { speakerLabel: speaker, isValid: false };
  }

  const typeCode = parts[1].toLowerCase();
  const type = TYPE_CODES[typeCode];
  if (!type) return { speakerLabel: speaker, isValid: false };

  const typeLabels: Record<NodeType, string> = {
    claim: 'Claim',
    warrant: 'Warrant',
    impact: 'Impact',
    refutation: 'Refutation',
    characterization: 'Characterization',
    extension: 'Extension',
  };

  return {
    speakerLabel: speaker,
    typeLabel: typeLabels[type],
    isValid: parts.length >= 3,
  };
}
