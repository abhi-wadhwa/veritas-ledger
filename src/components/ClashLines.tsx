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

      const x1 = sourceRect.left + sourceRect.width / 2;
      const y1 = sourceRect.top + sourceRect.height / 2;
      const x2 = targetRect.left + targetRect.width / 2;
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
    computeLines();
    // Recompute on scroll/resize
    const handleUpdate = () => requestAnimationFrame(computeLines);
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
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
      {visibleLines.map((line) => {
        const dx = line.x2 - line.x1;
        const cx1 = line.x1 + dx * 0.4;
        const cy1 = line.y1;
        const cx2 = line.x2 - dx * 0.4;
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
          />
        );
      })}
    </svg>
  );
}
