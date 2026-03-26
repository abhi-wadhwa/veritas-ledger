import { useState, useRef, useEffect } from 'react';
import type { ArgumentNode, NodeType, Speaker } from '../types';
import { TYPE_LABELS, TYPE_COLORS, SPEAKER_ORDER, SPEAKER_TO_TEAM, TEAM_COLORS } from '../types';
import { renderDebateMarkdown } from '../utils/debateMarkdown';
import { useRoundStore } from '../store';

interface Props {
  node: ArgumentNode;
  index: number; // 1-based display number
  isFocused: boolean;
  isMarkSource: boolean;
  dimmed: boolean;
}

const TYPE_KEYS: { key: string; type: NodeType; label: string }[] = [
  { key: 'c', type: 'claim', label: 'C' },
  { key: 'w', type: 'warrant', label: 'W' },
  { key: 'i', type: 'impact', label: 'I' },
  { key: 'r', type: 'refutation', label: 'R' },
  { key: 'h', type: 'characterization', label: 'Ch' },
  { key: 'e', type: 'extension', label: 'E' },
];

export function ArgumentNodeCard({ node, index, isFocused, isMarkSource, dimmed }: Props) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeText = useRoundStore((s) => s.updateNodeText);
  const classifyNodeType = useRoundStore((s) => s.classifyNodeType);
  const classifyNodeSpeaker = useRoundStore((s) => s.classifyNodeSpeaker);
  const classifyingNodeId = useRoundStore((s) => s.classifyingNodeId);
  const setClassifyingNode = useRoundStore((s) => s.setClassifyingNode);
  const links = useRoundStore((s) => s.links);

  const isClassifying = classifyingNodeId === node.id;
  const linkCount = links.filter(
    (l) => l.source === node.id || l.target === node.id
  ).length;

  const hasType = node.type !== null;
  const color = hasType ? TYPE_COLORS[node.type!] : '#666680';
  const label = hasType ? TYPE_LABELS[node.type!] : '?';
  // Check if this node has incoming refutation links (is being targeted)
  const isRefuted = links.some(
    (l) => (l.target === node.id || l.source === node.id) && l.type === 'clash'
  );
  const isUnrefutedClaim = !isRefuted && (node.type === 'claim' || node.type === 'impact') && !node.dropped;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditing(false);
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleClassifyType = (type: NodeType) => {
    classifyNodeType(node.id, type);
  };

  const handleClassifySpeaker = (speaker: Speaker) => {
    classifyNodeSpeaker(node.id, speaker);
  };

  return (
    <div
      className={`
        node-offset relative rounded px-1.5 py-1 mb-0.5 border-l-2 transition-all duration-100
        ${dimmed ? 'opacity-20' : ''}
        ${isFocused ? 'bg-bg-card-hover ring-1 ring-border-focus' : 'bg-bg-card'}
        ${isMarkSource ? 'mark-mode border-l-2' : ''}
        ${node.dropped ? 'shadow-[inset_0_0_12px_-4px_var(--glow-color)]' : ''}
        ${isUnrefutedClaim ? 'ring-1' : ''}
      `}
      style={{
        borderLeftColor: isMarkSource ? '#fff' : color,
        transform: `translateY(${node.vOffset}px)`,
        ['--glow-color' as string]: node.dropped ? color : undefined,
        ...(isUnrefutedClaim ? { ringColor: '#d4a030', boxShadow: 'inset 0 0 0 1px rgba(212,160,48,0.3)' } : {}),
      }}
      data-node-id={node.id}
    >
      {/* Main content row */}
      <div className="flex items-start gap-1">
        {/* Type badge - clickable to reclassify */}
        <button
          className="text-[9px] font-mono font-bold px-1 py-0 rounded shrink-0 leading-tight mt-0.5 cursor-pointer hover:opacity-80"
          style={{ color, backgroundColor: `${color}18` }}
          onClick={(e) => {
            e.stopPropagation();
            setClassifyingNode(isClassifying ? null : node.id);
          }}
          title={hasType ? `${node.type} (click to reclassify)` : 'Click to classify'}
        >
          {label}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              className="bg-transparent text-text-primary text-[11px] w-full outline-none font-sans"
              value={node.text}
              onChange={(e) => updateNodeText(node.id, e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span
              className={`text-[11px] leading-tight block break-words ${
                node.type === 'refutation' ? 'italic text-text-secondary' : 'text-text-primary'
              }`}
              onDoubleClick={() => setEditing(true)}
            >
              {renderDebateMarkdown(node.text)}
            </span>
          )}
        </div>

        {/* Compact indicators */}
        <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
          {node.mustRespond && <span className="text-[8px]" style={{ color: '#d4a030' }}>!</span>}
          {node.flagged && <span className="text-[8px] text-text-secondary">*</span>}
          {node.dropped && <span className="text-[8px]" title="Dropped">x</span>}
          {linkCount > 0 && <span className="text-[8px] text-text-muted font-mono">{linkCount}</span>}
          {isUnrefutedClaim && <span className="text-[8px]" style={{ color: '#d4a030' }} title="Unrefuted">~</span>}
          <span className="text-[8px] text-text-muted font-mono">#{index}</span>
        </div>
      </div>

      {/* Inline classification UI - appears when classifying */}
      {isClassifying && (
        <div
          className="mt-1 pt-1 space-y-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Type classification */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <span className="text-[8px] text-text-muted font-mono mr-1">type:</span>
            {TYPE_KEYS.map(({ key, type, label: typeLabel }) => (
              <button
                key={type}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  node.type === type ? 'ring-1 ring-white/30' : ''
                }`}
                style={{
                  color: TYPE_COLORS[type],
                  backgroundColor: `${TYPE_COLORS[type]}${node.type === type ? '30' : '12'}`,
                }}
                onClick={() => handleClassifyType(type)}
                title={`${key} - ${type}`}
              >
                {typeLabel}
              </button>
            ))}
          </div>

          {/* Speaker classification */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <span className="text-[8px] text-text-muted font-mono mr-1">who:</span>
            {SPEAKER_ORDER.map((speaker, i) => (
              <button
                key={speaker}
                className={`text-[9px] font-mono px-1 py-0.5 rounded cursor-pointer transition-colors ${
                  node.speaker === speaker ? 'ring-1 ring-white/30' : ''
                }`}
                style={{
                  color: TEAM_COLORS[SPEAKER_TO_TEAM[speaker]],
                  backgroundColor: `${TEAM_COLORS[SPEAKER_TO_TEAM[speaker]]}${node.speaker === speaker ? '30' : '12'}`,
                }}
                onClick={() => handleClassifySpeaker(speaker)}
                title={`${i + 1} - ${speaker}`}
              >
                {speaker}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
