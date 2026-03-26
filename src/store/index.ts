import { create } from 'zustand';
import type {
  ArgumentNode, ClashLink, Speaker, Team, NodeType,
  FocusState, SidebarMode, SpeechPrep, RoundMeta,
  TeamInfo, POI, Weighing, LedgerFile,
} from '../types';
import { TEAM_SPEAKERS, TEAMS, SPEAKER_ORDER, SPEAKER_TO_TEAM } from '../types';

let nextNodeId = 1;
let nextLinkId = 1;
let nextPoiId = 1;
let nextWeighingId = 1;

interface HistoryEntry {
  nodes: ArgumentNode[];
  links: ClashLink[];
}

interface RoundStore {
  // Round metadata
  meta: RoundMeta;
  teams: Record<Team, TeamInfo>;

  // Core data
  nodes: ArgumentNode[];
  links: ClashLink[];
  pois: POI[];
  weighings: Weighing[];
  speechPrep: SpeechPrep;

  // UI state
  focus: FocusState;
  sidebarMode: SidebarMode;
  currentSpeaker: number; // index into SPEAKER_ORDER
  commandBarFocused: boolean;
  showAllLinks: boolean;
  dropsOnlyFilter: boolean;
  markModeNodeId: string | null;
  classifyingNodeId: string | null; // node currently being classified
  linkSearchNodeId: string | null; // node currently linking from

  // Timer
  timerRunning: boolean;
  timerSeconds: number;

  // Command history
  commandHistory: string[];
  commandHistoryIndex: number;

  // Undo/Redo
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Actions
  setMeta: (meta: Partial<RoundMeta>) => void;
  setTeamName: (team: Team, name: string) => void;

  addNode: (speaker: Speaker | null, type: NodeType | null, text: string, extendsId?: string) => ArgumentNode;
  addQuickNode: (text: string) => ArgumentNode;
  classifyNodeSpeaker: (id: string, speaker: Speaker) => void;
  classifyNodeType: (id: string, type: NodeType) => void;
  updateNodeText: (id: string, text: string) => void;
  deleteNode: (id: string) => void;
  toggleFlagged: (id: string) => void;
  toggleDropped: (id: string) => void;
  toggleMustRespond: (id: string) => void;
  moveNodeOffset: (id: string, direction: 'up' | 'down') => void;
  reorderNode: (id: string, direction: 'up' | 'down') => void;

  addLink: (sourceId: string, targetId: string, type: 'clash' | 'extension') => void;
  removeLink: (id: string) => void;

  // POIs
  addPoi: (offeredBy: Speaker, receivedBy: Speaker, accepted: boolean, content: string) => void;

  // Weighings
  addWeighing: (impactA: string, impactB: string) => Weighing;
  updateWeighing: (id: string, updates: Partial<Weighing>) => void;
  removeWeighing: (id: string) => void;

  // Navigation
  setFocus: (focus: Partial<FocusState>) => void;
  moveFocusH: (direction: 'left' | 'right') => void;
  moveFocusV: (direction: 'up' | 'down') => void;
  jumpToColumn: (colIndex: number) => void;
  setCommandBarFocused: (focused: boolean) => void;

  // Sidebar
  cycleSidebar: () => void;
  setSidebarMode: (mode: SidebarMode) => void;

  // Speaker indicator
  cycleSpeaker: (direction: 'next' | 'prev') => void;

  // Timer
  toggleTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // Link mode
  setMarkMode: (nodeId: string | null) => void;
  toggleShowAllLinks: () => void;
  toggleDropsOnlyFilter: () => void;

  // Classification mode
  setClassifyingNode: (nodeId: string | null) => void;
  setLinkSearchNode: (nodeId: string | null) => void;

  // Command history
  pushCommandHistory: (cmd: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // File I/O
  exportLedger: () => LedgerFile;
  importLedger: (data: LedgerFile) => void;
  newRound: () => void;

  // Helpers
  getNodesForSpeaker: (speaker: Speaker) => ArgumentNode[];
  getUnclassifiedNodes: () => ArgumentNode[];
  getFocusedNode: () => ArgumentNode | null;
  getNodeById: (id: string) => ArgumentNode | undefined;
  getNodeNumber: (id: string) => number;
  resolveNodeRef: (ref: string) => ArgumentNode | null;
  getLinksForNode: (id: string) => ClashLink[];
  getUnrefutedClaims: (team: Team) => ArgumentNode[];
}

function createSnapshot(state: { nodes: ArgumentNode[]; links: ClashLink[] }): HistoryEntry {
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    links: JSON.parse(JSON.stringify(state.links)),
  };
}

export const useRoundStore = create<RoundStore>((set, get) => ({
  meta: {
    motion: '',
    tournament: '',
    round: 1,
    date: new Date().toISOString().split('T')[0],
    myPosition: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
  teams: {
    OG: { name: '' },
    OO: { name: '' },
    CG: { name: '' },
    CO: { name: '' },
  },

  nodes: [],
  links: [],
  pois: [],
  weighings: [],
  speechPrep: { mustRespondIds: [], planText: '' },

  focus: { columnIndex: 0, speakerIndex: 0, nodeIndex: 0 },
  sidebarMode: 'hidden',
  currentSpeaker: 0,
  commandBarFocused: false,
  showAllLinks: false,
  dropsOnlyFilter: false,
  markModeNodeId: null,
  classifyingNodeId: null,
  linkSearchNodeId: null,

  timerRunning: false,
  timerSeconds: 0,

  commandHistory: [],
  commandHistoryIndex: -1,

  undoStack: [],
  redoStack: [],

  // Meta
  setMeta: (partial) => set((s) => ({
    meta: { ...s.meta, ...partial, lastModified: new Date().toISOString() },
  })),
  setTeamName: (team, name) => set((s) => ({
    teams: { ...s.teams, [team]: { name } },
  })),

  // Nodes
  addNode: (speaker, type, text, extendsId) => {
    const id = `n${nextNodeId++}`;
    const node: ArgumentNode = {
      id,
      speaker,
      type,
      text,
      vOffset: 0,
      flagged: false,
      dropped: false,
      mustRespond: false,
      extends: extendsId,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      undoStack: [...s.undoStack, createSnapshot(s)],
      redoStack: [],
      nodes: [...s.nodes, node],
    }));
    return node;
  },

  addQuickNode: (text) => {
    const state = get();
    // Auto-assign to current speaker
    const currentSpeakerCode = SPEAKER_ORDER[state.currentSpeaker];
    const id = `n${nextNodeId++}`;
    const node: ArgumentNode = {
      id,
      speaker: currentSpeakerCode,
      type: null, // unclassified type
      text,
      vOffset: 0,
      flagged: false,
      dropped: false,
      mustRespond: false,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      undoStack: [...s.undoStack, createSnapshot(s)],
      redoStack: [],
      nodes: [...s.nodes, node],
      classifyingNodeId: id,
    }));
    return node;
  },

  classifyNodeSpeaker: (id, speaker) => set((s) => ({
    nodes: s.nodes.map((n) => n.id === id ? { ...n, speaker } : n),
  })),

  classifyNodeType: (id, type) => set((s) => ({
    nodes: s.nodes.map((n) => n.id === id ? { ...n, type } : n),
    classifyingNodeId: null,
  })),

  updateNodeText: (id, text) => set((s) => ({
    undoStack: [...s.undoStack, createSnapshot(s)],
    redoStack: [],
    nodes: s.nodes.map((n) => n.id === id ? { ...n, text } : n),
  })),

  deleteNode: (id) => set((s) => ({
    undoStack: [...s.undoStack, createSnapshot(s)],
    redoStack: [],
    nodes: s.nodes.filter((n) => n.id !== id),
    links: s.links.filter((l) => l.source !== id && l.target !== id),
    classifyingNodeId: s.classifyingNodeId === id ? null : s.classifyingNodeId,
  })),

  toggleFlagged: (id) => set((s) => ({
    nodes: s.nodes.map((n) => n.id === id ? { ...n, flagged: !n.flagged } : n),
  })),

  toggleDropped: (id) => set((s) => ({
    nodes: s.nodes.map((n) => n.id === id ? { ...n, dropped: !n.dropped } : n),
  })),

  toggleMustRespond: (id) => set((s) => {
    const node = s.nodes.find((n) => n.id === id);
    if (!node) return {};
    const newMustRespond = !node.mustRespond;
    return {
      nodes: s.nodes.map((n) => n.id === id ? { ...n, mustRespond: newMustRespond } : n),
      speechPrep: {
        ...s.speechPrep,
        mustRespondIds: newMustRespond
          ? [...s.speechPrep.mustRespondIds, id]
          : s.speechPrep.mustRespondIds.filter((mid) => mid !== id),
      },
    };
  }),

  moveNodeOffset: (id, direction) => set((s) => ({
    nodes: s.nodes.map((n) =>
      n.id === id
        ? { ...n, vOffset: n.vOffset + (direction === 'down' ? 24 : -24) }
        : n
    ),
  })),

  reorderNode: (id, direction) => set((s) => {
    const node = s.nodes.find((n) => n.id === id);
    if (!node) return {};
    const speakerNodes = s.nodes.filter((n) => n.speaker === node.speaker);
    const idx = speakerNodes.findIndex((n) => n.id === id);
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= speakerNodes.length) return {};
    const reordered = [...speakerNodes];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const result: ArgumentNode[] = [];
    let speakerIdx = 0;
    for (const n of s.nodes) {
      if (n.speaker === node.speaker) {
        result.push(reordered[speakerIdx++]);
      } else {
        result.push(n);
      }
    }
    return { nodes: result };
  }),

  // Links
  addLink: (sourceId, targetId, type) => {
    const id = `lk${nextLinkId++}`;
    set((s) => ({
      undoStack: [...s.undoStack, createSnapshot(s)],
      redoStack: [],
      links: [...s.links, { id, source: sourceId, target: targetId, type, label: '' }],
    }));
  },

  removeLink: (id) => set((s) => ({
    undoStack: [...s.undoStack, createSnapshot(s)],
    redoStack: [],
    links: s.links.filter((l) => l.id !== id),
  })),

  // Navigation
  setFocus: (partial) => set((s) => ({ focus: { ...s.focus, ...partial } })),
  moveFocusH: (direction) => set((s) => {
    const newCol = direction === 'right'
      ? Math.min(s.focus.columnIndex + 1, 3)
      : Math.max(s.focus.columnIndex - 1, 0);
    return { focus: { ...s.focus, columnIndex: newCol, nodeIndex: 0 } };
  }),
  moveFocusV: (direction) => {
    const state = get();
    const team = TEAMS[state.focus.columnIndex];
    const speakers = TEAM_SPEAKERS[team];
    const currentSpeaker = speakers[state.focus.speakerIndex];
    const speakerNodes = state.nodes.filter((n) => n.speaker === currentSpeaker);

    if (direction === 'down') {
      if (state.focus.nodeIndex < speakerNodes.length - 1) {
        set({ focus: { ...state.focus, nodeIndex: state.focus.nodeIndex + 1 } });
      } else if (state.focus.speakerIndex === 0) {
        set({ focus: { ...state.focus, speakerIndex: 1, nodeIndex: 0 } });
      }
    } else {
      if (state.focus.nodeIndex > 0) {
        set({ focus: { ...state.focus, nodeIndex: state.focus.nodeIndex - 1 } });
      } else if (state.focus.speakerIndex === 1) {
        const topSpeaker = speakers[0];
        const topNodes = state.nodes.filter((n) => n.speaker === topSpeaker);
        set({
          focus: {
            ...state.focus,
            speakerIndex: 0,
            nodeIndex: Math.max(0, topNodes.length - 1),
          },
        });
      }
    }
  },
  jumpToColumn: (colIndex) => set({ focus: { columnIndex: colIndex, speakerIndex: 0, nodeIndex: 0 } }),
  setCommandBarFocused: (focused) => set({ commandBarFocused: focused }),

  // Sidebar
  cycleSidebar: () => set((s) => {
    const modes: SidebarMode[] = ['clash-log', 'speech-prep', 'weighing', 'whip-check', 'hidden'];
    const idx = modes.indexOf(s.sidebarMode);
    return { sidebarMode: modes[(idx + 1) % modes.length] };
  }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),

  // Speaker indicator
  cycleSpeaker: (direction) => set((s) => {
    const len = SPEAKER_ORDER.length;
    const next = direction === 'next'
      ? (s.currentSpeaker + 1) % len
      : (s.currentSpeaker - 1 + len) % len;
    return { currentSpeaker: next, timerSeconds: 0, timerRunning: false };
  }),

  // Timer
  toggleTimer: () => set((s) => ({ timerRunning: !s.timerRunning })),
  resetTimer: () => set({ timerSeconds: 0, timerRunning: false }),
  tickTimer: () => set((s) => s.timerRunning ? { timerSeconds: s.timerSeconds + 1 } : {}),

  // Modes
  setMarkMode: (nodeId) => set({ markModeNodeId: nodeId }),
  toggleShowAllLinks: () => set((s) => ({ showAllLinks: !s.showAllLinks })),
  toggleDropsOnlyFilter: () => set((s) => ({ dropsOnlyFilter: !s.dropsOnlyFilter })),

  // Classification
  setClassifyingNode: (nodeId) => set({ classifyingNodeId: nodeId }),
  setLinkSearchNode: (nodeId) => set({ linkSearchNodeId: nodeId }),

  // POIs
  addPoi: (offeredBy, receivedBy, accepted, content) => {
    const id = `poi${nextPoiId++}`;
    const state = get();
    const poi: POI = {
      id,
      offeredBy,
      receivedBy,
      accepted,
      content,
      timestampInSpeech: `${Math.floor(state.timerSeconds / 60)}:${(state.timerSeconds % 60).toString().padStart(2, '0')}`,
    };
    set((s) => ({ pois: [...s.pois, poi] }));
  },

  // Weighings
  addWeighing: (impactA, impactB) => {
    const id = `w${nextWeighingId++}`;
    const weighing: Weighing = {
      id,
      impactA,
      impactB,
      dimensions: {
        magnitude: '', scope: '', probability: '',
        reversibility: '', timeframe: '', moralWeight: '',
      },
      verdict: '',
    };
    set((s) => ({ weighings: [...s.weighings, weighing] }));
    return weighing;
  },
  updateWeighing: (id, updates) => set((s) => ({
    weighings: s.weighings.map((w) => w.id === id ? { ...w, ...updates } : w),
  })),
  removeWeighing: (id) => set((s) => ({
    weighings: s.weighings.filter((w) => w.id !== id),
  })),

  // Command history
  pushCommandHistory: (cmd) => set((s) => ({
    commandHistory: [...s.commandHistory, cmd],
    commandHistoryIndex: -1,
  })),

  // Undo/Redo
  undo: () => set((s) => {
    if (s.undoStack.length === 0) return {};
    const prev = s.undoStack[s.undoStack.length - 1];
    return {
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, createSnapshot(s)],
      nodes: prev.nodes,
      links: prev.links,
    };
  }),
  redo: () => set((s) => {
    if (s.redoStack.length === 0) return {};
    const next = s.redoStack[s.redoStack.length - 1];
    return {
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, createSnapshot(s)],
      nodes: next.nodes,
      links: next.links,
    };
  }),

  // File I/O
  exportLedger: () => {
    const s = get();
    return {
      version: '1.0',
      meta: s.meta,
      teams: s.teams,
      nodes: s.nodes,
      links: s.links,
      pois: s.pois,
      weighings: s.weighings,
      speechPrep: s.speechPrep,
    };
  },
  importLedger: (data) => {
    const maxNodeId = data.nodes.reduce((max, n) => {
      const num = parseInt(n.id.replace('n', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const maxLinkId = data.links.reduce((max, l) => {
      const num = parseInt(l.id.replace('lk', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const maxPoiId = data.pois.reduce((max, p) => {
      const num = parseInt(p.id.replace('poi', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const maxWeighingId = data.weighings.reduce((max, w) => {
      const num = parseInt(w.id.replace('w', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    nextNodeId = maxNodeId + 1;
    nextLinkId = maxLinkId + 1;
    nextPoiId = maxPoiId + 1;
    nextWeighingId = maxWeighingId + 1;

    set({
      meta: data.meta,
      teams: data.teams,
      nodes: data.nodes,
      links: data.links,
      pois: data.pois,
      weighings: data.weighings,
      speechPrep: data.speechPrep,
      undoStack: [],
      redoStack: [],
    });
  },
  newRound: () => {
    nextNodeId = 1;
    nextLinkId = 1;
    nextPoiId = 1;
    nextWeighingId = 1;
    set({
      meta: {
        motion: '',
        tournament: '',
        round: 1,
        date: new Date().toISOString().split('T')[0],
        myPosition: '',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      teams: { OG: { name: '' }, OO: { name: '' }, CG: { name: '' }, CO: { name: '' } },
      nodes: [],
      links: [],
      pois: [],
      weighings: [],
      speechPrep: { mustRespondIds: [], planText: '' },
      focus: { columnIndex: 0, speakerIndex: 0, nodeIndex: 0 },
      sidebarMode: 'hidden',
      currentSpeaker: 0,
      commandBarFocused: false,
      showAllLinks: false,
      dropsOnlyFilter: false,
      markModeNodeId: null,
      classifyingNodeId: null,
      linkSearchNodeId: null,
      timerRunning: false,
      timerSeconds: 0,
      commandHistory: [],
      commandHistoryIndex: -1,
      undoStack: [],
      redoStack: [],
    });
  },

  // Helpers
  getNodesForSpeaker: (speaker) => get().nodes.filter((n) => n.speaker === speaker),
  getUnclassifiedNodes: () => get().nodes.filter((n) => n.speaker === null || n.type === null),
  getFocusedNode: () => {
    const state = get();
    const team = TEAMS[state.focus.columnIndex];
    const speakers = TEAM_SPEAKERS[team];
    const speaker = speakers[state.focus.speakerIndex];
    const speakerNodes = state.nodes.filter((n) => n.speaker === speaker);
    return speakerNodes[state.focus.nodeIndex] ?? null;
  },
  getNodeById: (id) => get().nodes.find((n) => n.id === id),
  getNodeNumber: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return 0;
    const speakerNodes = get().nodes.filter((n) => n.speaker === node.speaker);
    return speakerNodes.findIndex((n) => n.id === id) + 1;
  },
  resolveNodeRef: (ref) => {
    const match = ref.match(/^(\w+)\.(\d+)$/);
    if (!match) return null;
    const [, code, numStr] = match;
    const num = parseInt(numStr);
    const speakerCode = code.toLowerCase();

    const speakerMap: Record<string, Speaker> = {
      pm: 'PM', lo: 'LO', dpm: 'DPM', dlo: 'DLO',
      mg: 'MG', mo: 'MO', gw: 'GW', ow: 'OW',
    };
    const speaker = speakerMap[speakerCode];
    if (speaker) {
      const speakerNodes = get().nodes.filter((n) => n.speaker === speaker);
      return speakerNodes[num - 1] ?? null;
    }

    const teamMap: Record<string, Team> = { og: 'OG', oo: 'OO', cg: 'CG', co: 'CO' };
    const team = teamMap[speakerCode];
    if (team) {
      const speakers = TEAM_SPEAKERS[team];
      const teamNodes = get().nodes.filter((n) => n.speaker && speakers.includes(n.speaker));
      return teamNodes[num - 1] ?? null;
    }

    return null;
  },
  getLinksForNode: (id) => get().links.filter((l) => l.source === id || l.target === id),
  getUnrefutedClaims: (team) => {
    const state = get();
    const teamSpeakers = TEAM_SPEAKERS[team];
    const teamNodes = state.nodes.filter(
      (n) => n.speaker && teamSpeakers.includes(n.speaker) && (n.type === 'claim' || n.type === 'impact')
    );
    // A claim is "refuted" if any link points to it from a different team
    return teamNodes.filter((node) => {
      const incomingLinks = state.links.filter(
        (l) => l.target === node.id || l.source === node.id
      );
      // Check if any linked node is from a different team
      const hasResponseFromOtherTeam = incomingLinks.some((l) => {
        const otherId = l.source === node.id ? l.target : l.source;
        const otherNode = state.nodes.find((n) => n.id === otherId);
        if (!otherNode || !otherNode.speaker) return false;
        return SPEAKER_TO_TEAM[otherNode.speaker] !== team;
      });
      return !hasResponseFromOtherTeam;
    });
  },
}));
