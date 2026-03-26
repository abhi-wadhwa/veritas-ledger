import { useEffect } from 'react';
import { useRoundStore } from '../store';
import type { LedgerFile, NodeType } from '../types';
import { SPEAKER_NUMBER } from '../types';

interface OverlayControls {
  setShowHelp: (show: boolean) => void;
  showHelp: boolean;
  setShowWeighing: (show: boolean) => void;
  showWeighing: boolean;
  setShowExtensionAudit: (show: boolean) => void;
  showExtensionAudit: boolean;
}

export function useKeyboard(controls: OverlayControls) {
  const { setShowHelp, showHelp, setShowWeighing, showWeighing, setShowExtensionAudit, showExtensionAudit } = controls;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useRoundStore.getState();
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Handle classification mode keyboard shortcuts
      if (state.classifyingNodeId && !isInput) {
        const classifyingNode = state.getNodeById(state.classifyingNodeId);
        if (classifyingNode) {
          // Type classification keys
          const typeMap: Record<string, NodeType> = {
            c: 'claim', w: 'warrant', i: 'impact',
            r: 'refutation', h: 'characterization', e: 'extension',
          };
          if (typeMap[e.key]) {
            e.preventDefault();
            state.classifyNodeType(state.classifyingNodeId, typeMap[e.key]);
            return;
          }

          // Speaker classification: number keys 1-8
          const num = parseInt(e.key);
          if (num >= 1 && num <= 8 && SPEAKER_NUMBER[num]) {
            e.preventDefault();
            state.classifyNodeSpeaker(state.classifyingNodeId, SPEAKER_NUMBER[num]);
            return;
          }

          // Escape exits classification
          if (e.key === 'Escape') {
            e.preventDefault();
            state.setClassifyingNode(null);
            return;
          }

          // Enter confirms and exits classification
          if (e.key === 'Enter') {
            e.preventDefault();
            state.setClassifyingNode(null);
            return;
          }

          // / jumps back to command bar while classifying
          if (e.key === '/') {
            e.preventDefault();
            state.setClassifyingNode(null);
            state.setCommandBarFocused(true);
            return;
          }
        }
      }

      // Always handle Escape
      if (e.key === 'Escape') {
        if (showWeighing) {
          setShowWeighing(false);
          return;
        }
        if (showExtensionAudit) {
          setShowExtensionAudit(false);
          return;
        }
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (state.linkSearchNodeId) {
          state.setLinkSearchNode(null);
          return;
        }
        if (state.markModeNodeId) {
          state.setMarkMode(null);
          return;
        }
        if (state.commandBarFocused) {
          state.setCommandBarFocused(false);
          (document.activeElement as HTMLElement)?.blur();
          return;
        }
        return;
      }

      // Ctrl/Cmd shortcuts (work everywhere)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              state.redo();
            } else {
              state.undo();
            }
            return;
          case 'l':
            e.preventDefault();
            state.toggleShowAllLinks();
            return;
          case 'd':
            e.preventDefault();
            state.toggleDropsOnlyFilter();
            return;
          case 'r':
            if (!isInput) {
              e.preventDefault();
              state.resetTimer();
            }
            return;
          case 'p':
            e.preventDefault();
            state.setSidebarMode('speech-prep');
            return;
          case 'w':
            if (!isInput) {
              e.preventDefault();
              state.setSidebarMode('whip-check');
            }
            return;
          case 'x':
            if (!isInput) {
              e.preventDefault();
              setShowExtensionAudit(!showExtensionAudit);
            }
            return;
          case 'e':
            if (!isInput) {
              e.preventDefault();
              const data = state.exportLedger();
              const json = JSON.stringify(data, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const name = data.meta.motion
                ? data.meta.motion.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 40)
                : 'round';
              a.download = `${name}.ledger`;
              a.click();
              URL.revokeObjectURL(url);
            }
            return;
          case 'o':
            if (!isInput) {
              e.preventDefault();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.ledger,.json';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text) as LedgerFile;
                  if (data.version && data.nodes && data.links) {
                    state.importLedger(data);
                  }
                } catch {
                  // silent fail on bad file
                }
              };
              input.click();
            }
            return;
          case 'n':
            if (!isInput) {
              e.preventDefault();
              if (window.confirm('Start a new round? Current data will be cleared.')) {
                state.newRound();
              }
            }
            return;
          case 'ArrowRight':
            e.preventDefault();
            state.cycleSpeaker('next');
            return;
          case 'ArrowLeft':
            e.preventDefault();
            state.cycleSpeaker('prev');
            return;
        }
        return;
      }

      // Don't intercept when typing in inputs
      if (isInput) return;

      // Non-input shortcuts
      switch (e.key) {
        case '/':
          e.preventDefault();
          state.setCommandBarFocused(true);
          return;
        case '?':
          e.preventDefault();
          setShowHelp(!showHelp);
          return;
        case 'Tab':
          e.preventDefault();
          state.cycleSidebar();
          return;
        case ' ':
          e.preventDefault();
          state.toggleTimer();
          return;
        case 'W': {
          e.preventDefault();
          setShowWeighing(!showWeighing);
          return;
        }

        // Navigation
        case 'h':
          state.moveFocusH('left');
          return;
        case 'l': {
          if (state.markModeNodeId) {
            const focusedNode = state.getFocusedNode();
            if (focusedNode && focusedNode.id !== state.markModeNodeId) {
              state.addLink(state.markModeNodeId, focusedNode.id, 'clash');
              state.setMarkMode(null);
            }
            return;
          }
          state.moveFocusH('right');
          return;
        }
        case 'j':
          state.moveFocusV('down');
          return;
        case 'k':
          state.moveFocusV('up');
          return;

        // Shift + J/K for offset
        case 'J': {
          const node = state.getFocusedNode();
          if (node) state.moveNodeOffset(node.id, 'down');
          return;
        }
        case 'K': {
          const node = state.getFocusedNode();
          if (node) state.moveNodeOffset(node.id, 'up');
          return;
        }

        // Column jumps (only when not classifying)
        case '1': state.jumpToColumn(0); return;
        case '2': state.jumpToColumn(1); return;
        case '3': state.jumpToColumn(2); return;
        case '4': state.jumpToColumn(3); return;

        // Node actions
        case 'f': {
          const node = state.getFocusedNode();
          if (node) state.toggleFlagged(node.id);
          return;
        }
        case 'F': {
          const node = state.getFocusedNode();
          if (node) state.toggleFlagged(node.id);
          return;
        }
        case 'D': {
          const node = state.getFocusedNode();
          if (node) state.toggleDropped(node.id);
          return;
        }
        case '!': {
          const node = state.getFocusedNode();
          if (node) state.toggleMustRespond(node.id);
          return;
        }
        case 'm': {
          const node = state.getFocusedNode();
          if (node) state.setMarkMode(node.id);
          return;
        }

        // 't' - classify focused node
        case 't': {
          const node = state.getFocusedNode();
          if (node) {
            state.setClassifyingNode(state.classifyingNodeId === node.id ? null : node.id);
          }
          return;
        }

        // 'L' (shift+l) - open link search for focused node
        case 'L': {
          const node = state.getFocusedNode();
          if (node) {
            state.setLinkSearchNode(state.linkSearchNodeId === node.id ? null : node.id);
          }
          return;
        }

        case 'x':
        case 'Delete': {
          const node = state.getFocusedNode();
          if (node) {
            if (window.confirm(`Delete "${node.text.slice(0, 50)}"?`)) {
              state.deleteNode(node.id);
            }
          }
          return;
        }
        case 'Enter': {
          const node = state.getFocusedNode();
          if (node) {
            const el = document.querySelector(`[data-node-id="${node.id}"]`);
            if (el) {
              const contentDiv = el.querySelector('.flex-1.min-w-0');
              const textEl = contentDiv?.querySelector('span');
              if (textEl) {
                const event = new MouseEvent('dblclick', { bubbles: true });
                textEl.dispatchEvent(event);
              }
            }
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, setShowHelp, showWeighing, setShowWeighing, showExtensionAudit, setShowExtensionAudit]);
}
