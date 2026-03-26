import { useState, useRef, useCallback } from 'react';
import { useRoundStore } from '../store';
import { renderDebateMarkdown } from '../utils/debateMarkdown';
import type { SidebarMode } from '../types';

const MODE_LABELS: Record<SidebarMode, string> = {
  'clash-log': 'Clash Log',
  'speech-prep': 'Speech Prep',
  'weighing': 'Weighing',
  'hidden': '',
};

export function Sidebar() {
  const sidebarMode = useRoundStore((s) => s.sidebarMode);
  const links = useRoundStore((s) => s.links);
  const nodes = useRoundStore((s) => s.nodes);
  const speechPrep = useRoundStore((s) => s.speechPrep);
  const removeLink = useRoundStore((s) => s.removeLink);
  const weighings = useRoundStore((s) => s.weighings);
  const [selectedLinkIdx, setSelectedLinkIdx] = useState<number>(-1);
  const [insertingRef, setInsertingRef] = useState(false);
  const [refInput, setRefInput] = useState('');
  const refInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (sidebarMode === 'hidden') return null;

  const getNodeLabel = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return '?';
    const speakerNodes = nodes.filter((n) => n.speaker === node.speaker);
    const num = speakerNodes.indexOf(node) + 1;
    return `${node.speaker} #${num}: "${node.text.slice(0, 30)}${node.text.length > 30 ? '...' : ''}"`;
  };

  const handleDeleteLink = (linkId: string) => {
    removeLink(linkId);
    setSelectedLinkIdx(-1);
  };

  const handleJumpToNode = (nodeId: string) => {
    const el = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).style.outline = '1px solid rgba(255,255,255,0.4)';
      setTimeout(() => { (el as HTMLElement).style.outline = ''; }, 1500);
    }
  };

  const handleInsertRef = useCallback(() => {
    if (!refInput.trim()) {
      setInsertingRef(false);
      return;
    }
    const node = useRoundStore.getState().resolveNodeRef(refInput.trim());
    if (node) {
      const speakerNodes = useRoundStore.getState().nodes.filter((n) => n.speaker === node.speaker);
      const num = speakerNodes.indexOf(node) + 1;
      const chip = `[${node.speaker} #${num}: "${node.text.slice(0, 30)}${node.text.length > 30 ? '...' : ''}"]`;
      useRoundStore.setState((s) => ({
        speechPrep: { ...s.speechPrep, planText: s.speechPrep.planText + chip + ' ' },
      }));
    }
    setRefInput('');
    setInsertingRef(false);
  }, [refInput]);

  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
    if (sidebarMode === 'clash-log') {
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedLinkIdx((i) => Math.min(i + 1, links.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedLinkIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'd' && selectedLinkIdx >= 0) {
        e.preventDefault();
        handleDeleteLink(links[selectedLinkIdx].id);
      }
    }
  };

  return (
    <div
      className="w-64 border-l border-border-subtle bg-bg-sidebar flex flex-col h-full shrink-0"
      tabIndex={0}
      onKeyDown={handleSidebarKeyDown}
    >
      {/* Header */}
      <div className="flex items-center px-3 py-2 border-b border-border-subtle">
        <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider">
          {MODE_LABELS[sidebarMode]}
        </span>
        <span className="text-[9px] text-text-muted ml-auto font-mono">Tab to cycle</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {sidebarMode === 'clash-log' && (
          <div className="space-y-1">
            {links.length === 0 ? (
              <p className="text-[10px] text-text-muted italic text-center py-4">
                No links yet. Press m on a node to start linking.
              </p>
            ) : (
              <>
                {links.map((link, i) => (
                  <div
                    key={link.id}
                    className={`bg-bg-card rounded px-2 py-1.5 text-[10px] text-text-secondary cursor-pointer ${
                      selectedLinkIdx === i ? 'ring-1 ring-border-focus' : ''
                    }`}
                    onClick={() => {
                      setSelectedLinkIdx(i);
                      handleJumpToNode(link.source);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="text-text-muted font-mono">#{i + 1}</span>{' '}
                        <span className={link.type === 'clash' ? 'text-clash-line' : 'text-type-extension'}>
                          {link.type === 'clash' ? '⟷' : '⤻'}
                        </span>
                      </span>
                      {selectedLinkIdx === i && (
                        <button
                          className="text-[9px] text-type-impact font-mono hover:text-text-bright"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLink(link.id);
                          }}
                          title="Delete link (d)"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <span className="block">{getNodeLabel(link.source)}</span>
                    <span className="ml-4 block">↔ {getNodeLabel(link.target)}</span>
                  </div>
                ))}
                <p className="text-[9px] text-text-muted text-center mt-2">
                  Select link, press d to delete
                </p>
              </>
            )}
          </div>
        )}

        {sidebarMode === 'speech-prep' && (
          <div className="space-y-3">
            {/* Must Respond */}
            <div>
              <h3 className="text-[10px] text-must-respond font-mono uppercase mb-1">Must Respond ❗</h3>
              {speechPrep.mustRespondIds.length === 0 ? (
                <p className="text-[10px] text-text-muted italic">Press ! on nodes to tag</p>
              ) : (
                speechPrep.mustRespondIds.map((id) => {
                  const node = nodes.find((n) => n.id === id);
                  if (!node) return null;
                  return (
                    <div
                      key={id}
                      className="bg-bg-card rounded px-2 py-1 text-[10px] text-text-secondary mb-1 cursor-pointer hover:bg-bg-card-hover"
                      onClick={() => handleJumpToNode(id)}
                    >
                      {getNodeLabel(id)}
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropped */}
            <div>
              <h3 className="text-[10px] text-text-secondary font-mono uppercase mb-1">Dropped 💀</h3>
              {nodes.filter((n) => n.dropped).length === 0 ? (
                <p className="text-[10px] text-text-muted italic">Press Shift+D to mark drops</p>
              ) : (
                nodes.filter((n) => n.dropped).map((node) => (
                  <div
                    key={node.id}
                    className="bg-bg-card rounded px-2 py-1 text-[10px] text-text-secondary mb-1 cursor-pointer hover:bg-bg-card-hover"
                    onClick={() => handleJumpToNode(node.id)}
                  >
                    {getNodeLabel(node.id)}
                  </div>
                ))
              )}
            </div>

            {/* Plan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] text-text-muted font-mono uppercase">My Plan</h3>
                <button
                  className="text-[9px] text-text-muted font-mono hover:text-text-secondary"
                  onClick={() => {
                    setInsertingRef(true);
                    setTimeout(() => refInputRef.current?.focus(), 50);
                  }}
                  title="Insert node reference (#)"
                >
                  # ref
                </button>
              </div>
              {insertingRef && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] text-text-muted font-mono">#</span>
                  <input
                    ref={refInputRef}
                    className="flex-1 bg-bg-primary text-text-primary text-[10px] font-mono rounded px-1.5 py-0.5 outline-none border border-border-subtle focus:border-border-focus"
                    placeholder="pm.1"
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleInsertRef();
                      } else if (e.key === 'Escape') {
                        setInsertingRef(false);
                        setRefInput('');
                      }
                    }}
                    onBlur={() => {
                      if (!refInput) setInsertingRef(false);
                    }}
                  />
                </div>
              )}
              <textarea
                ref={textareaRef}
                className="w-full bg-bg-card text-text-primary text-[11px] font-sans rounded p-2 outline-none resize-none border border-border-subtle focus:border-border-focus min-h-[120px]"
                placeholder="Plan your speech here... Press # ref button to insert node references"
                value={speechPrep.planText}
                onChange={(e) =>
                  useRoundStore.setState((s) => ({
                    speechPrep: { ...s.speechPrep, planText: e.target.value },
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === '#' && !e.shiftKey) {
                    e.preventDefault();
                    setInsertingRef(true);
                    setTimeout(() => refInputRef.current?.focus(), 50);
                  }
                }}
              />
              {/* Render plan with debate markdown */}
              {speechPrep.planText && (
                <div className="mt-1 text-[10px] text-text-muted italic">
                  Preview: {renderDebateMarkdown(speechPrep.planText).slice(0, 100)}{speechPrep.planText.length > 100 ? '...' : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {sidebarMode === 'weighing' && (
          <div>
            {weighings.length === 0 ? (
              <p className="text-[10px] text-text-muted italic text-center py-4">
                Press W to create a weighing comparison.
              </p>
            ) : (
              <div className="space-y-2">
                {weighings.map((w) => (
                  <div key={w.id} className="bg-bg-card rounded px-2 py-1.5 text-[10px]">
                    <div className="text-text-secondary mb-0.5">{getNodeLabel(w.impactA)}</div>
                    <div className="text-text-muted text-center text-[9px]">vs</div>
                    <div className="text-text-secondary mt-0.5">{getNodeLabel(w.impactB)}</div>
                    {w.verdict && (
                      <div className="border-t border-border-subtle mt-1 pt-1 text-text-muted italic">
                        {w.verdict.slice(0, 60)}{w.verdict.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-[9px] text-text-muted text-center mt-2">
                  Press W to add or edit weighings
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
