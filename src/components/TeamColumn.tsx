import type { Team } from '../types';
import { TEAM_SPEAKERS, TEAM_COLORS } from '../types';
import { SpeakerSection } from './SpeakerSection';

interface Props {
  team: Team;
  columnIndex: number;
}

const TEAM_LABELS: Record<Team, string> = {
  OG: 'Opening Gov',
  OO: 'Opening Opp',
  CG: 'Closing Gov',
  CO: 'Closing Opp',
};

export function TeamColumn({ team, columnIndex }: Props) {
  const [topSpeaker, bottomSpeaker] = TEAM_SPEAKERS[team];
  const teamColor = TEAM_COLORS[team];

  return (
    <div
      className="flex flex-col h-full flex-1"
      style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Team header */}
      <div
        className="flex items-center justify-center px-2 py-1"
        style={{
          borderBottom: `2px solid ${teamColor}40`,
          background: `${teamColor}08`,
        }}
      >
        <span
          className="text-[10px] font-mono uppercase tracking-widest font-bold"
          style={{ color: teamColor }}
        >
          {team}
        </span>
        <span className="text-[9px] ml-2 font-sans hidden lg:inline" style={{ color: `${teamColor}90` }}>
          {TEAM_LABELS[team]}
        </span>
      </div>

      {/* Two speaker sections stacked */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <SpeakerSection speaker={topSpeaker} columnIndex={columnIndex} speakerIndex={0} />
        </div>
        <div className="flex-1 min-h-0">
          <SpeakerSection speaker={bottomSpeaker} columnIndex={columnIndex} speakerIndex={1} />
        </div>
      </div>
    </div>
  );
}
