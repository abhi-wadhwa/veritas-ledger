import { useRef, useState, useCallback, useEffect } from 'react';
import { useRoundStore } from '../store';
import {
  TEAMS, TEAM_COLORS,
  TYPE_COLORS, TYPE_LABELS, SPEAKER_TO_TEAM,
} from '../types';
import type { Team, ArgumentNode } from '../types';

const TEAM_LABELS: Record<Team, string> = {
  OG: 'Opening Gov',
  OO: 'Opening Opp',
  CG: 'Closing Gov',
  CO: 'Closing Opp',
};

const CARD_W = 180;
const CARD_H = 36;
const COL_W = 220;
const COL_GAP = 30;
const ROW_GAP = 6;
const HEADER_H = 40;
const PAD = 20;

interface CardPos {
  nodeId: string;
  x: number;
  y: number;
  team: Team;
}

export function ClaimMap() {
  const nodes = useRoundStore((s) => s.nodes);
  const links = useRoundStore((s) => s.links);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Group nodes by team, ordered chronologically
  const teamNodes: Record<Team, ArgumentNode[]> = { OG: [], OO: [], CG: [], CO: [] };
  for (const node of nodes) {
    if (!node.speaker) continue;
    const team = SPEAKER_TO_TEAM[node.speaker];
    teamNodes[team].push(node);
  }

  // Compute card positions
  const cardPositions: CardPos[] = [];
  const posMap = new Map<string, CardPos>();

  TEAMS.forEach((team, colIdx) => {
    const x = PAD + colIdx * (COL_W + COL_GAP);
    teamNodes[team].forEach((node, rowIdx) => {
      const y = HEADER_H + PAD + rowIdx * (CARD_H + ROW_GAP);
      const pos: CardPos = { nodeId: node.id, x, y, team };
      cardPositions.push(pos);
      posMap.set(node.id, pos);
    });
  });

  // Compute connector lines
  const connectors: {
    id: string;
    type: 'clash' | 'extension';
    x1: number; y1: number;
    x2: number; y2: number;
  }[] = [];

  for (const link of links) {
    const src = posMap.get(link.source);
    const tgt = posMap.get(link.target);
    if (!src || !tgt) continue;

    // Connect from right edge to left edge (or center if same column)
    let x1: number, x2: number;
    if (src.x < tgt.x) {
      x1 = src.x + CARD_W;
      x2 = tgt.x;
    } else if (src.x > tgt.x) {
      x1 = src.x;
      x2 = tgt.x + CARD_W;
    } else {
      x1 = src.x + CARD_W;
      x2 = tgt.x + CARD_W;
    }

    connectors.push({
      id: link.id,
      type: link.type,
      x1,
      y1: src.y + CARD_H / 2,
      x2,
      y2: tgt.y + CARD_H / 2,
    });
  }

  // Canvas dimensions
  const maxY = cardPositions.reduce((max, p) => Math.max(max, p.y + CARD_H), 200);
  const canvasW = PAD * 2 + TEAMS.length * COL_W + (TEAMS.length - 1) * COL_GAP;
  const canvasH = maxY + PAD;

  // Pan/zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setZoom((z) => Math.max(0.3, Math.min(2.5, z + delta)));
    } else {
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart(pan);
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: panStart.x + (e.clientX - dragStart.x),
      y: panStart.y + (e.clientY - dragStart.y),
    });
  }, [dragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Fit to view
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / canvasW;
    const scaleY = rect.height / canvasH;
    const scale = Math.min(scaleX, scaleY, 1.2);
    setZoom(scale);
    setPan({
      x: (rect.width - canvasW * scale) / 2,
      y: 0,
    });
  }, [canvasW, canvasH]);

  useEffect(() => {
    fitToView();
  }, [nodes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if a node is unrefuted
  const isUnrefuted = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.speaker) return false;
    if (node.type !== 'claim' && node.type !== 'impact') return false;
    if (node.dropped) return false;
    const nodeTeam = SPEAKER_TO_TEAM[node.speaker];
    return !links.some((l) => {
      const otherId = l.source === nodeId ? l.target : l.source;
      const other = nodes.find((n) => n.id === otherId);
      return other?.speaker && SPEAKER_TO_TEAM[other.speaker] !== nodeTeam;
    });
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden relative"
      style={{ background: '#08080d', cursor: dragging ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button
          className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle hover:text-text-secondary"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
        >+</button>
        <span className="text-[9px] font-mono text-text-muted px-1">{Math.round(zoom * 100)}%</span>
        <button
          className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle hover:text-text-secondary"
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
        >-</button>
        <button
          className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle hover:text-text-secondary ml-1"
          onClick={fitToView}
        >Fit</button>
      </div>

      {/* Canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: canvasW,
          height: canvasH,
          position: 'relative',
        }}
      >
        {/* SVG connectors */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, pointerEvents: 'none' }}
        >
          <defs>
            <marker id="map-arrow-clash" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#c75a3a" opacity="0.6" />
            </marker>
            <marker id="map-arrow-ext" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#3d9e9e" opacity="0.6" />
            </marker>
          </defs>
          {connectors.map((c) => {
            const dx = c.x2 - c.x1;
            const cpx1 = c.x1 + dx * 0.35;
            const cpx2 = c.x2 - dx * 0.35;
            return (
              <path
                key={c.id}
                d={`M ${c.x1} ${c.y1} C ${cpx1} ${c.y1}, ${cpx2} ${c.y2}, ${c.x2} ${c.y2}`}
                fill="none"
                stroke={c.type === 'clash' ? '#c75a3a' : '#3d9e9e'}
                strokeWidth={1.2}
                strokeOpacity={0.5}
                strokeDasharray={c.type === 'extension' ? '4 3' : undefined}
                markerEnd={`url(#map-arrow-${c.type === 'clash' ? 'clash' : 'ext'})`}
              />
            );
          })}
        </svg>

        {/* Team column headers */}
        {TEAMS.map((team, colIdx) => {
          const x = PAD + colIdx * (COL_W + COL_GAP);
          const teamColor = TEAM_COLORS[team];
          return (
            <div
              key={team}
              style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: COL_W,
                height: HEADER_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: `2px solid ${teamColor}50`,
              }}
            >
              <span className="font-mono text-[11px] font-bold" style={{ color: teamColor }}>
                {team}
              </span>
              <span className="text-[9px] ml-1.5 font-sans" style={{ color: `${teamColor}80` }}>
                {TEAM_LABELS[team]}
              </span>
            </div>
          );
        })}

        {/* Team column backgrounds */}
        {TEAMS.map((team, colIdx) => {
          const x = PAD + colIdx * (COL_W + COL_GAP);
          const teamColor = TEAM_COLORS[team];
          const colNodes = teamNodes[team];
          const colH = colNodes.length * (CARD_H + ROW_GAP) + PAD;
          return (
            <div
              key={`bg-${team}`}
              style={{
                position: 'absolute',
                left: x - 4,
                top: HEADER_H,
                width: COL_W + 8,
                height: colH,
                background: `${teamColor}05`,
                borderRadius: 4,
              }}
            />
          );
        })}

        {/* Node cards */}
        {cardPositions.map((pos) => {
          const node = nodes.find((n) => n.id === pos.nodeId);
          if (!node) return null;
          const teamColor = TEAM_COLORS[pos.team];
          const typeColor = node.type ? TYPE_COLORS[node.type] : '#666680';
          const typeLabel = node.type ? TYPE_LABELS[node.type] : '?';
          const unrefuted = isUnrefuted(node.id);

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: CARD_W,
                height: CARD_H,
                borderLeft: `2px solid ${typeColor}`,
                background: unrefuted ? '#d4a03010' : '#13131a',
                borderRadius: 3,
                padding: '3px 6px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: unrefuted ? 'inset 0 0 0 1px rgba(212,160,48,0.25)' : undefined,
              }}
            >
              <div className="flex items-center gap-1">
                <span
                  className="text-[8px] font-mono font-bold px-0.5 rounded shrink-0"
                  style={{ color: typeColor, backgroundColor: `${typeColor}15` }}
                >
                  {typeLabel}
                </span>
                <span
                  className="text-[8px] font-mono shrink-0"
                  style={{ color: teamColor }}
                >
                  {node.speaker}
                </span>
                <span className="text-[9px] text-text-secondary truncate flex-1">
                  {node.text}
                </span>
                {node.dropped && <span className="text-[8px]" title="Dropped">x</span>}
                {unrefuted && <span className="text-[8px]" style={{ color: '#d4a030' }} title="Unrefuted">~</span>}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            className="text-text-muted text-sm font-mono text-center"
          >
            No claims yet. Press / to start flowing.
          </div>
        )}
      </div>
    </div>
  );
}
