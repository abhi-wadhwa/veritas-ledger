import { useState, useRef, useCallback } from 'react';
import { useRoundStore } from '../store';
import { renderDebateMarkdown } from '../utils/debateMarkdown';
import type { SidebarMode, Team } from '../types';
import { TEAM_COLORS, SPEAKER_TO_TEAM, TYPE_COLORS } from '../types';

const MODE_LABELS: Record<SidebarMode, string> = {
  'clash-log': 'Clash Log',
  'speech-prep': 'Speech Prep',
  'weighing': 'Weighing',
  'whip-check': 'Whip Check',
  'hidden': '',
};

export function Sidebar() {
  const sidebarMode = useRoundStore((s) => s.sidebarMode);
  const links = useRoundStore((s) => s.links);
  const nodes = useRoundStore((s) => s.nodes);
  const speechPrep = useRoundStore((s) => s.speechPrep);
  const removeLink = useRoundStore((s) => s.removeLink);
  const weighings = useRoundStore((s) => s.weighings);
  const linkSearchNodeId = useRoundStore((s) => s.linkSearchNodeId);
  const setLinkSearchNode = useRoundStore((s) => s.setLinkSearchNode);
  const addLink = useRoundStore((s) => s.addLink);
  const [selectedLinkIdx, setSelectedLinkIdx] = useState<number>(-1);
  const [insertingRef, setInsertingRef] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const refInputRef = useRef<HTMLInputElement>(null);
  const linkSearchRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  if (sidebarMode === 'hidden' && !linkSearchNodeId) return null;

  const getNodeLabel = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return '?';
    const speakerNodes = nodes.filter((n) => n.speaker === node.speaker);
    const num = speakerNodes.indexOf(node) + 1;
    const speakerLabel = node.speaker || '??';
    return `${speakerLabel} #${num}: "${node.text.slice(0, 30)}${node.text.length > 30 ? '...' : ''}"`;
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

  // Link search: find claims to link to
  const handleLinkTo = (targetId: string) => {
    if (!linkSearchNodeId) return;
    addLink(linkSearchNodeId, targetId, 'clash');
    setLinkSearchNode(null);
    setLinkSearchQuery('');
  };

  // Filter nodes for link search
  const linkSearchResults = linkSearchNodeId
    ? nodes.filter((n) => {
        if (n.id === linkSearchNodeId) return false;
        const q = linkSearchQuery.toLowerCase();
        if (!q) return true;
        const label = `${n.speaker || ''} ${n.text}`.toLowerCase();
        return label.includes(q);
      }).slice(0, 20)
    : [];

  // Whip check: unrefuted claims from opposing teams
  const getWhipData = (closingTeam: Team) => {
    const opposingTeams: Team[] = closingTeam === 'CG'
      ? ['OO', 'CO'] // CG needs to address OO and CO claims
      : ['OG', 'CG']; // CO needs to address OG and CG claims

    return opposingTeams.map((oppTeam) => {
      const unrefuted = useRoundStore.getState().getUnrefutedClaims(oppTeam);
      return { team: oppTeam, claims: unrefuted };
    });
  };

  // Link search overlay (can appear alongside sidebar)
  if (linkSearchNodeId) {
    const sourceNode = nodes.find((n) => n.id === linkSearchNodeId);
    return (
      <div
        className="w-72 border-l border-border-subtle bg-bg-sidebar flex flex-col h-full shrink-0"
        tabIndex={0}
      >
        <div className="flex items-center px-3 py-2 border-b border-border-subtle">
          <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider">
            Link to...
          </span>
          <button
            className="text-[9px] text-text-muted ml-auto font-mono hover:text-text-secondary"
            onClick={() => { setLinkSearchNode(null); setLinkSearchQuery(''); }}
          >
            Esc
          </button>
        </div>

        {sourceNode && (
          <div className="px-3 py-1 text-[10px] text-text-secondary border-b border-border-subtle">
            From: {getNodeLabel(linkSearchNodeId)}
          </div>
        )}

        <div className="px-2 py-1">
          <input
            ref={linkSearchRef}
            className="w-full bg-bg-primary text-text-primary text-[11px] font-mono rounded px-2 py-1 outline-none border border-border-subtle focus:border-border-focus"
            placeholder="Search claims..."
            value={linkSearchQuery}
            onChange={(e) => setLinkSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setLinkSearchNode(null);
                setLinkSearchQuery('');
              }
            }}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {linkSearchResults.map((node) => {
            const teamColor = node.speaker ? TEAM_COLORS[SPEAKER_TO_TEAM[node.speaker]] : '#666';
            const typeColor = node.type ? TYPE_COLORS[node.type] : '#666';
            return (
              <button
                key={node.id}
                className="w-full text-left px-2 py-1 rounded text-[10px] hover:bg-bg-card-hover flex items-center gap-1 mb-0.5"
                onClick={() => handleLinkTo(node.id)}
              >
                <span className="font-mono font-bold shrink-0" style={{ color: teamColor }}>
                  {node.speaker || '??'}
                </span>
                {node.type && (
                  <span className="font-mono shrink-0" style={{ color: typeColor }}>
                    {node.type[0].toUpperCase()}
                  </span>
                )}
                <span className="text-text-secondary truncate">{node.text}</span>
              </button>
            );
          })}
          {linkSearchResults.length === 0 && (
            <p className="text-[10px] text-text-muted italic text-center py-4">
              No matching claims
            </p>
          )}
        </div>
      </div>
    );
  }

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
                No links yet. Press m on a node, then l on target. Or Shift+L for search.
              </p>
            ) : (
              <>
                {links.map((link, i) => (
                  <div
                    key={link.id}
                    className={`bg-bg-card rounded px-2 py-1 text-[10px] text-text-secondary cursor-pointer ${
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
              </>
            )}
          </div>
        )}

        {sidebarMode === 'speech-prep' && (
          <div className="space-y-3">
            {/* Must Respond */}
            <div>
              <h3 className="text-[10px] text-must-respond font-mono uppercase mb-1">Must Respond</h3>
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
              <h3 className="text-[10px] text-text-secondary font-mono uppercase mb-1">Dropped</h3>
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
                placeholder="Plan your speech here..."
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
              </div>
            )}
          </div>
        )}

        {sidebarMode === 'whip-check' && (
          <div className="space-y-3">
            <p className="text-[9px] text-text-muted italic">
              Unrefuted claims from opposing teams. Use for closing speeches.
            </p>
            {(['CG', 'CO'] as Team[]).map((closingTeam) => {
              const data = getWhipData(closingTeam);
              const teamColor = TEAM_COLORS[closingTeam];
              return (
                <div key={closingTeam}>
                  <h3
                    className="text-[10px] font-mono uppercase mb-1 font-bold"
                    style={{ color: teamColor }}
                  >
                    {closingTeam} should address:
                  </h3>
                  {data.map(({ team: oppTeam, claims }) => (
                    <div key={oppTeam} className="mb-2">
                      <div className="text-[9px] font-mono text-text-muted mb-0.5">
                        From {oppTeam}:
                      </div>
                      {claims.length === 0 ? (
                        <div className="text-[9px] text-text-muted italic pl-2">All addressed</div>
                      ) : (
                        claims.map((claim) => (
                          <div
                            key={claim.id}
                            className="bg-bg-card rounded px-2 py-1 text-[10px] text-text-secondary mb-0.5 cursor-pointer hover:bg-bg-card-hover flex items-center gap-1"
                            onClick={() => handleJumpToNode(claim.id)}
                            style={{ borderLeft: `2px solid ${TEAM_COLORS[oppTeam]}` }}
                          >
                            <span className="font-mono shrink-0" style={{ color: TEAM_COLORS[oppTeam] }}>
                              {claim.speaker}
                            </span>
                            <span className="truncate">{claim.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
