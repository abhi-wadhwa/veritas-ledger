import { useState, useRef, useEffect } from 'react';
import type { ArgumentNode } from '../types';
import { TYPE_LABELS, TYPE_COLORS } from '../types';
import { renderDebateMarkdown } from '../utils/debateMarkdown';
import { useRoundStore } from '../store';

interface Props {
  node: ArgumentNode;
  index: number; // 1-based display number
  isFocused: boolean;
  isMarkSource: boolean;
  dimmed: boolean; // for drops-only filter
}

export function ArgumentNodeCard({ node, index, isFocused, isMarkSource, dimmed }: Props) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeText = useRoundStore((s) => s.updateNodeText);
  const links = useRoundStore((s) => s.links);

  const linkCount = links.filter(
    (l) => l.source === node.id || l.target === node.id
  ).length;

  const color = TYPE_COLORS[node.type];
  const label = TYPE_LABELS[node.type];

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

  return (
    <div
      className={`
        node-offset relative rounded px-2 py-1.5 mb-1 border-l-2 transition-all duration-100
        ${dimmed ? 'opacity-20' : ''}
        ${isFocused ? 'bg-bg-card-hover ring-1 ring-border-focus' : 'bg-bg-card'}
        ${isMarkSource ? 'mark-mode border-l-2' : ''}
        ${node.dropped ? 'shadow-[inset_0_0_12px_-4px_var(--glow-color)]' : ''}
      `}
      style={{
        borderLeftColor: isMarkSource ? '#fff' : color,
        transform: `translateY(${node.vOffset}px)`,
        ['--glow-color' as string]: node.dropped ? color : undefined,
      }}
      data-node-id={node.id}
    >
      {/* Type badge */}
      <div className="flex items-start gap-1.5">
        <span
          className="text-[10px] font-mono font-bold px-1 py-0 rounded shrink-0 leading-tight mt-0.5"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {label}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              className="bg-transparent text-text-primary text-xs w-full outline-none font-sans"
              value={node.text}
              onChange={(e) => updateNodeText(node.id, e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span
              className="text-xs text-text-primary leading-tight block break-words"
              onDoubleClick={() => setEditing(true)}
            >
              {renderDebateMarkdown(node.text)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom-right indicators */}
      <div className="flex items-center gap-1 justify-end mt-0.5">
        {node.mustRespond && (
          <span className="text-[9px]" style={{ color: '#d4a030' }}>❗</span>
        )}
        {node.flagged && (
          <span className="text-[9px] text-text-secondary">📌</span>
        )}
        {node.dropped && (
          <span className="text-[9px]">💀</span>
        )}
        {linkCount > 0 && (
          <span className="text-[9px] text-text-muted font-mono">🔗{linkCount}</span>
        )}
        <span className="text-[9px] text-text-muted font-mono ml-auto">#{index}</span>
      </div>
    </div>
  );
}
