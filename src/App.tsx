import { useState, useEffect } from 'react';
import { TEAMS } from './types';
import { useRoundStore } from './store';
import { MotionBar } from './components/MotionBar';
import { TeamColumn } from './components/TeamColumn';
import { CommandBar } from './components/CommandBar';
import { Sidebar } from './components/Sidebar';
import { ClashLines } from './components/ClashLines';
import { ClaimMap } from './components/ClaimMap';
import { KeyboardShortcutOverlay } from './components/KeyboardShortcutOverlay';
import { WeighingOverlay } from './components/WeighingOverlay';
import { ExtensionAuditOverlay } from './components/ExtensionAuditOverlay';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const [showHelp, setShowHelp] = useState(false);
  const [showWeighing, setShowWeighing] = useState(false);
  const [showExtensionAudit, setShowExtensionAudit] = useState(false);
  const [showClaimMap, setShowClaimMap] = useState(false);
  const tickTimer = useRoundStore((s) => s.tickTimer);
  const timerRunning = useRoundStore((s) => s.timerRunning);

  useKeyboard({
    setShowHelp, showHelp,
    setShowWeighing, showWeighing,
    setShowExtensionAudit, showExtensionAudit,
  });

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  // Toggle claim map with Ctrl+M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setShowClaimMap((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0a0a0f',
      color: '#e0e0e8',
    }}>
      {/* Motion Bar */}
      <MotionBar />

      {/* Main content: columns + sidebar */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {showClaimMap ? (
          /* Split view: flow columns on left, claim map on right */
          <>
            <div style={{ display: 'flex', flex: '0 0 50%', minWidth: 0 }}>
              {TEAMS.map((team, i) => (
                <TeamColumn key={team} team={team} columnIndex={i} />
              ))}
            </div>
            <div style={{ flex: '0 0 50%', minWidth: 0, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <ClaimMap />
            </div>
          </>
        ) : (
          /* Standard view: full columns + sidebar */
          <>
            <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
              {TEAMS.map((team, i) => (
                <TeamColumn key={team} team={team} columnIndex={i} />
              ))}
            </div>
            <Sidebar />
          </>
        )}
      </div>

      {/* Clash lines overlay */}
      <ClashLines />

      {/* Command Bar */}
      <CommandBar />

      {/* Map toggle button */}
      <button
        className="fixed bottom-12 right-3 text-[9px] font-mono px-2 py-1 rounded z-[60] transition-colors"
        style={{
          background: showClaimMap ? '#3d9e9e30' : '#13131a',
          color: showClaimMap ? '#3d9e9e' : '#555568',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={() => setShowClaimMap(!showClaimMap)}
        title="Toggle Claim Map (Ctrl+M)"
      >
        {showClaimMap ? '← Flow' : 'Map →'}
      </button>

      {/* Overlays */}
      {showHelp && (
        <KeyboardShortcutOverlay onClose={() => setShowHelp(false)} />
      )}
      {showWeighing && (
        <WeighingOverlay onClose={() => setShowWeighing(false)} />
      )}
      {showExtensionAudit && (
        <ExtensionAuditOverlay onClose={() => setShowExtensionAudit(false)} />
      )}
    </div>
  );
}

export default App;
