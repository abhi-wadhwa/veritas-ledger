import { useState, useEffect } from 'react';
import { TEAMS } from './types';
import { useRoundStore } from './store';
import { MotionBar } from './components/MotionBar';
import { TeamColumn } from './components/TeamColumn';
import { CommandBar } from './components/CommandBar';
import { Sidebar } from './components/Sidebar';
import { ClashLines } from './components/ClashLines';
import { KeyboardShortcutOverlay } from './components/KeyboardShortcutOverlay';
import { WeighingOverlay } from './components/WeighingOverlay';
import { ExtensionAuditOverlay } from './components/ExtensionAuditOverlay';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const [showHelp, setShowHelp] = useState(false);
  const [showWeighing, setShowWeighing] = useState(false);
  const [showExtensionAudit, setShowExtensionAudit] = useState(false);
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
        {/* Four columns */}
        <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
          {TEAMS.map((team, i) => (
            <TeamColumn key={team} team={team} columnIndex={i} />
          ))}
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Clash lines overlay */}
      <ClashLines />

      {/* Command Bar */}
      <CommandBar />

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
