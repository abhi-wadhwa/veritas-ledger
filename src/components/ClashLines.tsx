import { useEffect, useState, useCallback } from 'react';
import { useRoundStore } from '../store';

interface LineCoords {
  id: string;
  type: 'clash' | 'extension';
  x1: number; y1: number;
  x2: number; y2: number;
  visible: boolean;
}

export function ClashLines() {
  const links = useRoundStore((s) => s.links);
  const showAllLinks = useRoundStore((s) => s.showAllLinks);
  const focusedNode = useRoundStore((s) => s.getFocusedNode());
  const markModeNodeId = useRoundStore((s) => s.markModeNodeId);
  const [lines, setLines] = useState<LineCoords[]>([]);

  const computeLines = useCallback(() => {
    const newLines: LineCoords[] = [];

    for (const link of links) {
      const sourceEl = document.querySelector(`[data-node-id="${link.source}"]`);
      const targetEl = document.querySelector(`[data-node-id="${link.target}"]`);
      if (!sourceEl || !targetEl) continue;

      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Connect from right edge of source to left edge of target (or vice versa)
      const sourceRight = sourceRect.right;
      const sourceLeft = sourceRect.left;
      const targetRight = targetRect.right;
      const targetLeft = targetRect.left;

      let x1: number, x2: number;
      if (sourceRect.left < targetRect.left) {
        x1 = sourceRight;
        x2 = targetLeft;
      } else if (sourceRect.left > targetRect.left) {
        x1 = sourceLeft;
        x2 = targetRight;
      } else {
        x1 = sourceRight;
        x2 = targetRight;
      }

      const y1 = sourceRect.top + sourceRect.height / 2;
      const y2 = targetRect.top + targetRect.height / 2;

      const isRelated =
        focusedNode?.id === link.source ||
        focusedNode?.id === link.target ||
        markModeNodeId === link.source ||
        markModeNodeId === link.target;

      newLines.push({
        id: link.id,
        type: link.type,
        x1, y1, x2, y2,
        visible: showAllLinks || isRelated,
      });
    }

    setLines(newLines);
  }, [links, showAllLinks, focusedNode?.id, markModeNodeId]);

  useEffect(() => {
    // Use rAF to avoid synchronous setState in effect
    const frame = requestAnimationFrame(computeLines);
    const handleUpdate = () => requestAnimationFrame(computeLines);
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [computeLines]);

  const visibleLines = lines.filter((l) => l.visible);
  if (visibleLines.length === 0) return null;

  return (
    <svg
      className="fixed inset-0 pointer-events-none"
      style={{ width: '100vw', height: '100vh', zIndex: 50 }}
    >
      <defs>
        <marker
          id="arrowhead-clash"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" fill="#c75a3a" opacity="0.7" />
        </marker>
        <marker
          id="arrowhead-extension"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" fill="#3d9e9e" opacity="0.7" />
        </marker>
      </defs>
      {visibleLines.map((line) => {
        const dx = line.x2 - line.x1;
        const cx1 = line.x1 + dx * 0.35;
        const cy1 = line.y1;
        const cx2 = line.x2 - dx * 0.35;
        const cy2 = line.y2;

        return (
          <path
            key={line.id}
            d={`M ${line.x1} ${line.y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke={line.type === 'clash' ? '#c75a3a' : '#3d9e9e'}
            strokeWidth={1.5}
            strokeOpacity={0.7}
            strokeDasharray={line.type === 'extension' ? '4 3' : undefined}
            markerEnd={`url(#arrowhead-${line.type})`}
          />
        );
      })}
    </svg>
  );
}
