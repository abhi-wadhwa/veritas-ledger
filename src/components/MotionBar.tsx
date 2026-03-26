import { useEffect, useRef, useState } from 'react';
import { useRoundStore } from '../store';
import { SPEAKER_ORDER, SPEAKER_TO_TEAM, TEAM_COLORS } from '../types';

export function MotionBar() {
  const meta = useRoundStore((s) => s.meta);
  const setMeta = useRoundStore((s) => s.setMeta);
  const currentSpeaker = useRoundStore((s) => s.currentSpeaker);
  const timerSeconds = useRoundStore((s) => s.timerSeconds);
  const timerRunning = useRoundStore((s) => s.timerRunning);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const speaker = SPEAKER_ORDER[currentSpeaker];
  const team = SPEAKER_TO_TEAM[speaker];
  const teamColor = TEAM_COLORS[team];

  const SPEECH_DURATION = 7 * 60; // 7 minutes
  const POI_START = 60; // POIs allowed after 1 min
  const POI_END = 6 * 60; // POIs end at 6 min

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const timerPct = Math.min(timerSeconds / SPEECH_DURATION, 1);
  const inPoiWindow = timerSeconds >= POI_START && timerSeconds <= POI_END;
  const isOvertime = timerSeconds > SPEECH_DURATION;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div
      className="flex flex-col select-none"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0c0c12' }}
    >
      {/* Main bar */}
      <div className="flex items-center justify-between px-4 py-1.5" style={{ minHeight: '40px' }}>
        {/* Motion text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider shrink-0" style={{ color: '#555568' }}>Motion</span>
          {editing ? (
            <input
              ref={inputRef}
              className="bg-transparent font-sans text-sm flex-1 outline-none px-1 py-0.5"
              style={{ color: '#f0f0f8', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
              value={meta.motion}
              onChange={(e) => setMeta({ motion: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setEditing(false);
                  e.stopPropagation();
                }
              }}
            />
          ) : (
            <span
              className="text-sm truncate cursor-text flex-1"
              style={{ color: '#f0f0f8' }}
              onDoubleClick={() => setEditing(true)}
              title="Double-click to edit"
            >
              {meta.motion || 'Double-click to set motion...'}
            </span>
          )}
        </div>

        {/* Speaker order - all 8 speakers shown inline */}
        <div className="flex items-center gap-0.5 mx-3">
          {SPEAKER_ORDER.map((s, i) => {
            const sTeam = SPEAKER_TO_TEAM[s];
            const sColor = TEAM_COLORS[sTeam];
            const isActive = i === currentSpeaker;
            const isPast = i < currentSpeaker;
            return (
              <span
                key={s}
                className={`text-[9px] font-mono px-1 py-0.5 rounded transition-all ${
                  isActive ? 'font-bold' : ''
                }`}
                style={{
                  color: isActive ? sColor : isPast ? '#555568' : '#444455',
                  backgroundColor: isActive ? `${sColor}20` : 'transparent',
                  opacity: isPast ? 0.5 : 1,
                }}
                title={`${s} (Ctrl+→/← to change)`}
              >
                {s}
              </span>
            );
          })}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-sm tabular-nums"
            style={{
              color: isOvertime ? '#b94a4a' : timerRunning ? '#f0f0f8' : '#8888a0',
            }}
          >
            {formatTime(timerSeconds)}
          </span>
          <span className="text-[9px] font-mono" style={{ color: '#555568' }}>
            / {formatTime(SPEECH_DURATION)}
          </span>
          {inPoiWindow && timerRunning && (
            <span className="text-[9px] font-mono px-1 rounded" style={{ color: '#4a9e6e', background: '#4a9e6e15' }}>
              POI
            </span>
          )}
          <div
            className={`w-1.5 h-1.5 rounded-full ${timerRunning ? 'animate-pulse' : ''}`}
            style={{ background: isOvertime ? '#b94a4a' : timerRunning ? teamColor : '#555568' }}
          />
        </div>
      </div>

      {/* Timer progress bar */}
      <div className="relative h-1" style={{ background: '#13131a' }}>
        {/* POI window markers */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${(POI_START / SPEECH_DURATION) * 100}%`,
            right: `${(1 - POI_END / SPEECH_DURATION) * 100}%`,
            background: '#4a9e6e10',
            borderLeft: '1px solid #4a9e6e30',
            borderRight: '1px solid #4a9e6e30',
          }}
        />
        {/* Progress */}
        <div
          className="absolute top-0 bottom-0 left-0 transition-all duration-300"
          style={{
            width: `${timerPct * 100}%`,
            background: isOvertime ? '#b94a4a' : teamColor,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}
