import { useMemo } from 'react';
import type { Speaker } from '../types';
import { SPEAKER_ORDER, SPEAKER_TO_TEAM, TEAM_COLORS } from '../types';
import { useRoundStore } from '../store';
import { ArgumentNodeCard } from './ArgumentNodeCard';

interface Props {
  speaker: Speaker;
  columnIndex: number;
  speakerIndex: number;
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
  const teamColor = TEAM_COLORS[SPEAKER_TO_TEAM[speaker]];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Speaker header */}
      <div
        className="flex items-center gap-2 px-2 py-0.5"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: isCurrentSpeaker ? `${teamColor}12` : 'transparent',
        }}
      >
        <span
          className="text-[10px] font-mono font-bold tracking-wider"
          style={{ color: isCurrentSpeaker ? teamColor : '#555568' }}
        >
          {speaker}
        </span>
        {isCurrentSpeaker && (
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: teamColor }} />
        )}
        <span className="text-[9px] font-mono ml-auto" style={{ color: '#555568' }}>
          {nodes.length}
        </span>
      </div>

      {/* Nodes */}
      <div className="flex-1 overflow-y-auto px-0.5 py-0.5 space-y-0">
        {nodes.length === 0 && speakerPois.length === 0 ? (
          <div className="text-[9px] px-2 py-2 text-center italic" style={{ color: '#555568' }}>
            —
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
                className="flex items-center gap-1 px-1.5 py-0.5 mb-0.5 rounded text-[8px] font-mono"
                style={{
                  background: poi.accepted ? '#4a9e6e08' : '#8888a008',
                  borderLeft: `2px solid ${poi.accepted ? '#4a9e6e' : '#555568'}`,
                }}
              >
                <span style={{ color: poi.accepted ? '#4a9e6e' : '#555568' }}>
                  POI {poi.accepted ? '✓' : '✗'}
                </span>
                <span className="text-text-muted">{poi.offeredBy}</span>
                {poi.timestampInSpeech && (
                  <span className="text-text-muted">@{poi.timestampInSpeech}</span>
                )}
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
