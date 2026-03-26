// Speaker codes and their team mappings
export type Speaker = 'PM' | 'LO' | 'DPM' | 'DLO' | 'MG' | 'MO' | 'GW' | 'OW';
export type Team = 'OG' | 'OO' | 'CG' | 'CO';
export type NodeType = 'claim' | 'warrant' | 'impact' | 'refutation' | 'characterization' | 'extension';
export type LinkType = 'clash' | 'extension';

export const SPEAKER_CODES: Record<string, Speaker> = {
  pm: 'PM', lo: 'LO', dpm: 'DPM', dlo: 'DLO',
  mg: 'MG', mo: 'MO', gw: 'GW', ow: 'OW',
};

export const TYPE_CODES: Record<string, NodeType> = {
  c: 'claim', w: 'warrant', i: 'impact',
  r: 'refutation', ch: 'characterization', e: 'extension',
};

export const TYPE_LABELS: Record<NodeType, string> = {
  claim: 'C', warrant: 'W', impact: 'I',
  refutation: 'R', characterization: 'Ch', extension: 'E',
};

export const TYPE_COLORS: Record<NodeType, string> = {
  claim: '#5b8abf',
  warrant: '#c4973b',
  impact: '#b94a4a',
  refutation: '#4a9e6e',
  characterization: '#8b6fc0',
  extension: '#3d9e9e',
};

// Team colors for visual distinction
export const TEAM_COLORS: Record<Team, string> = {
  OG: '#4a90d9',
  OO: '#d94a4a',
  CG: '#3db89a',
  CO: '#d4a030',
};

export const TEAM_BG_COLORS: Record<Team, string> = {
  OG: '#4a90d910',
  OO: '#d94a4a10',
  CG: '#3db89a10',
  CO: '#d4a03010',
};

export const SPEAKER_TO_TEAM: Record<Speaker, Team> = {
  PM: 'OG', DPM: 'OG',
  LO: 'OO', DLO: 'OO',
  MG: 'CG', GW: 'CG',
  MO: 'CO', OW: 'CO',
};

export const TEAM_SPEAKERS: Record<Team, [Speaker, Speaker]> = {
  OG: ['PM', 'DPM'],
  OO: ['LO', 'DLO'],
  CG: ['MG', 'GW'],
  CO: ['MO', 'OW'],
};

export const SPEAKER_ORDER: Speaker[] = ['PM', 'LO', 'DPM', 'DLO', 'MG', 'MO', 'GW', 'OW'];

// Speaker number mapping for keyboard shortcuts (1-8)
export const SPEAKER_NUMBER: Record<number, Speaker> = {
  1: 'PM', 2: 'LO', 3: 'DPM', 4: 'DLO',
  5: 'MG', 6: 'MO', 7: 'GW', 8: 'OW',
};

export const TEAMS: Team[] = ['OG', 'OO', 'CG', 'CO'];

export interface ArgumentNode {
  id: string;
  speaker: Speaker | null; // null = unclassified
  type: NodeType | null; // null = unclassified
  text: string;
  vOffset: number;
  flagged: boolean;
  dropped: boolean;
  mustRespond: boolean;
  extends?: string; // node id this extends
  createdAt: string;
}

export interface ClashLink {
  id: string;
  source: string; // node id
  target: string; // node id
  type: LinkType;
  label: string;
}

export interface POI {
  id: string;
  offeredBy: Speaker;
  receivedBy: Speaker;
  accepted: boolean;
  content: string;
  timestampInSpeech: string;
}

export interface WeighingDimensions {
  magnitude: string;
  scope: string;
  probability: string;
  reversibility: string;
  timeframe: string;
  moralWeight: string;
}

export interface Weighing {
  id: string;
  impactA: string; // node id
  impactB: string; // node id
  dimensions: WeighingDimensions;
  verdict: string;
}

export interface RoundMeta {
  motion: string;
  tournament: string;
  round: number;
  date: string;
  myPosition: Speaker | '';
  createdAt: string;
  lastModified: string;
}

export interface TeamInfo {
  name: string;
}

export interface SpeechPrep {
  mustRespondIds: string[];
  planText: string;
}

export interface LedgerFile {
  version: string;
  meta: RoundMeta;
  teams: Record<Team, TeamInfo>;
  nodes: ArgumentNode[];
  links: ClashLink[];
  pois: POI[];
  weighings: Weighing[];
  speechPrep: SpeechPrep;
}

export type SidebarMode = 'clash-log' | 'speech-prep' | 'weighing' | 'whip-check' | 'hidden';

// Navigation focus
export interface FocusState {
  columnIndex: number; // 0-3 for OG/OO/CG/CO
  speakerIndex: number; // 0 or 1 (top/bottom speaker in column)
  nodeIndex: number; // which node within the speaker section
}
