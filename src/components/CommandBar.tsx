import { useRef, useEffect, useState } from 'react';
import { useRoundStore } from '../store';
import { parseCommand, parsePoi, getPreview } from '../utils/commandParser';
import { TYPE_COLORS } from '../types';

export function CommandBar() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const commandBarFocused = useRoundStore((s) => s.commandBarFocused);
  const setCommandBarFocused = useRoundStore((s) => s.setCommandBarFocused);
  const addNode = useRoundStore((s) => s.addNode);
  const addLink = useRoundStore((s) => s.addLink);
  const addPoi = useRoundStore((s) => s.addPoi);
  const pushCommandHistory = useRoundStore((s) => s.pushCommandHistory);
  const commandHistory = useRoundStore((s) => s.commandHistory);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const preview = getPreview(input);

  useEffect(() => {
    if (commandBarFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandBarFocused]);

  const handleSubmit = () => {
    // Try POI first
    const poi = parsePoi(input);
    if (poi) {
      addPoi(poi.offeredBy, poi.receivedBy, poi.accepted, poi.content);
      pushCommandHistory(input);
      setInput('');
      setHistoryIdx(-1);
      return;
    }

    const parsed = parseCommand(input);
    if (!parsed) return;

    const node = addNode(parsed.speaker, parsed.type, parsed.content);

    // Handle refutation linking
    if (parsed.refTarget) {
      const targetNode = useRoundStore.getState().resolveNodeRef(parsed.refTarget);
      if (targetNode) {
        addLink(targetNode.id, node.id, 'clash');
      }
    }

    // Handle extension linking
    if (parsed.extSource) {
      const sourceNode = useRoundStore.getState().resolveNodeRef(parsed.extSource);
      if (sourceNode) {
        addLink(sourceNode.id, node.id, 'extension');
      }
    }

    pushCommandHistory(input);
    setInput('');
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInput('');
      setCommandBarFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIdx = historyIdx === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(commandHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= commandHistory.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(commandHistory[newIdx]);
        }
      }
    }
  };

  const parsed = parseCommand(input);
  const poiParsed = parsePoi(input);
  const typeColor = parsed ? TYPE_COLORS[parsed.type] : undefined;
  const isValidCommand = parsed || poiParsed;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0d0d13' }}
    >
      {/* Prompt indicator */}
      <span className="font-mono text-sm shrink-0" style={{ color: '#555568' }}>/</span>

      {/* Ghost preview */}
      {preview.speakerLabel && !parsed && !poiParsed && (
        <span className="text-xs font-mono shrink-0" style={{ color: preview.isPoi ? '#4a9e6e' : '#555568' }}>
          [{preview.speakerLabel}
          {preview.typeLabel && ` → ${preview.typeLabel}`}]
        </span>
      )}

      {/* Valid command indicator */}
      {parsed && (
        <span
          className="text-xs font-mono shrink-0 px-1 rounded"
          style={{ color: typeColor, backgroundColor: `${typeColor}18` }}
        >
          [{parsed.speaker} → {parsed.type}]
        </span>
      )}

      {/* POI indicator */}
      {poiParsed && (
        <span
          className="text-xs font-mono shrink-0 px-1 rounded"
          style={{ color: poiParsed.accepted ? '#4a9e6e' : '#8888a0', backgroundColor: poiParsed.accepted ? '#4a9e6e18' : '#8888a018' }}
        >
          [POI: {poiParsed.offeredBy} → {poiParsed.receivedBy} ({poiParsed.accepted ? 'accepted' : 'declined'})]
        </span>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-sm font-mono outline-none"
        style={{ color: '#e0e0e8' }}
        placeholder={commandBarFocused ? 'pm c globalization increases poverty...' : 'Press / to start flowing...'}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setHistoryIdx(-1);
        }}
        onFocus={() => setCommandBarFocused(true)}
        onBlur={() => {
          if (!input) setCommandBarFocused(false);
        }}
        onKeyDown={handleKeyDown}
      />

      {/* Submit hint */}
      {input && (
        <span className="text-[10px] font-mono shrink-0" style={{ color: '#555568' }}>
          {isValidCommand ? '↵ submit' : 'syntax: [speaker] [type] [text] or poi [from] [to] [a/d]'}
        </span>
      )}
    </div>
  );
}
