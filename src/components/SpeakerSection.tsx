import { useMemo } from 'react';
import type { Speaker } from '../types';
import { SPEAKER_ORDER } from '../types';
import { useRoundStore } from '../store';
import { ArgumentNodeCard } from './ArgumentNodeCard';

interface Props {
  speaker: Speaker;
  columnIndex: number;
  speakerIndex: number; // 0 or 1 within the column
}

export function SpeakerSection({ speaker, columnIndex, speakerIndex }: Props) {
  const allNodes = useRoundStore((s) => s.nodes);
  const focus = useRoundStore((s) => s.focus);
  const currentSpeaker = useRoundStore((s) => s.currentSpeaker);
  const commandBarFocused = useRoundStore((s) => s.commandBarFocused);
  const markModeNodeId = useRoundStore((s) => s.markModeNodeId);
  const dropsOnlyFilter = useRoundStore((s) => s.dropsOnlyFilter);
  const pois = useRoundStore((s) => s.pois);

  const nodes = useMemo(() => allNodes.filter((n) => n.speaker === speaker), [allNodes, speaker]);
  const speakerPois = useMemo(() => pois.filter((p) => p.receivedBy === speaker), [pois, speaker]);

  const isFocusedColumn = focus.columnIndex === columnIndex;
  const isFocusedSpeaker = isFocusedColumn && focus.speakerIndex === speakerIndex;
  const isCurrentSpeaker = SPEAKER_ORDER[currentSpeaker] === speaker;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Speaker header */}
      <div
        className="flex items-center gap-2 px-2 py-1"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: isCurrentSpeaker ? '#13131a' : 'transparent',
        }}
      >
        <span
          className="text-[11px] font-mono font-bold tracking-wider"
          style={{ color: isCurrentSpeaker ? '#f0f0f8' : '#555568' }}
        >
          {speaker}
        </span>
        {isCurrentSpeaker && (
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#5b8abf' }} />
        )}
        <span className="text-[10px] font-mono ml-auto" style={{ color: '#555568' }}>
          {nodes.length}
        </span>
      </div>

      {/* Nodes */}
      <div className="flex-1 overflow-y-auto p-1 space-y-0">
        {nodes.length === 0 && speakerPois.length === 0 ? (
          <div className="text-[10px] px-2 py-3 text-center italic" style={{ color: '#555568' }}>
            No arguments
          </div>
        ) : (
          <>
            {nodes.map((node, i) => (
              <ArgumentNodeCard
                key={node.id}
                node={node}
                index={i + 1}
                isFocused={!commandBarFocused && isFocusedSpeaker && focus.nodeIndex === i}
                isMarkSource={markModeNodeId === node.id}
                dimmed={dropsOnlyFilter && !node.dropped}
              />
            ))}
            {/* POI markers */}
            {speakerPois.map((poi) => (
              <div
                key={poi.id}
                className="flex items-center gap-1.5 px-2 py-0.5 mb-0.5 rounded text-[9px] font-mono"
                style={{
                  background: poi.accepted ? '#4a9e6e12' : '#8888a008',
                  borderLeft: `2px solid ${poi.accepted ? '#4a9e6e' : '#555568'}`,
                }}
              >
                <span style={{ color: poi.accepted ? '#4a9e6e' : '#555568' }}>
                  {poi.accepted ? 'POI ✓' : 'POI ✗'}
                </span>
                <span className="text-text-muted">from {poi.offeredBy}</span>
                {poi.content && (
                  <span className="text-text-secondary truncate">— {poi.content}</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
