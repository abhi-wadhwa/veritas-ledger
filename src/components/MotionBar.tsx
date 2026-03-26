import { useEffect, useRef, useState } from 'react';
import { useRoundStore } from '../store';
import { SPEAKER_ORDER } from '../types';

export function MotionBar() {
  const meta = useRoundStore((s) => s.meta);
  const setMeta = useRoundStore((s) => s.setMeta);
  const currentSpeaker = useRoundStore((s) => s.currentSpeaker);
  const timerSeconds = useRoundStore((s) => s.timerSeconds);
  const timerRunning = useRoundStore((s) => s.timerRunning);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div
      className="flex items-center justify-between px-4 py-2 select-none"
      style={{ minHeight: '44px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0c0c12' }}
    >
      {/* Motion text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs font-mono uppercase tracking-wider shrink-0" style={{ color: '#555568' }}>Motion</span>
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

      {/* Current speaker indicator */}
      <div className="flex items-center gap-3 mx-4">
        <span className="text-xs font-mono" style={{ color: '#555568' }}>Speaking:</span>
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
          style={{ color: '#f0f0f8', background: '#13131a' }}
        >
          {SPEAKER_ORDER[currentSpeaker]}
        </span>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-sm tabular-nums"
          style={{ color: timerRunning ? '#f0f0f8' : '#8888a0' }}
        >
          {formatTime(timerSeconds)}
        </span>
        <div
          className={`w-1.5 h-1.5 rounded-full ${timerRunning ? 'animate-pulse' : ''}`}
          style={{ background: timerRunning ? '#b94a4a' : '#555568' }}
        />
      </div>
    </div>
  );
}
