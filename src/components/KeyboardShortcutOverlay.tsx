interface Props {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Global',
    shortcuts: [
      ['/', 'Focus command bar'],
      ['Esc', 'Close / Unfocus / Exit classify'],
      ['Tab', 'Cycle sidebar'],
      ['Space', 'Start/Stop timer'],
      ['Ctrl+R', 'Reset timer'],
      ['Ctrl+L', 'Toggle all links'],
      ['Ctrl+D', 'Toggle drops filter'],
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Shift+Z', 'Redo'],
      ['Ctrl+→/←', 'Cycle speaker (resets timer)'],
      ['Ctrl+P', 'Speech Prep sidebar'],
      ['Ctrl+W', 'Whip Check sidebar'],
      ['?', 'This overlay'],
    ],
  },
  {
    title: 'Quick Flow',
    shortcuts: [
      ['/ + type + Enter', 'Quick note → current speaker'],
      ['/ + pm c text', 'Structured: speaker + type + text'],
      ['/ + lo r pm.1 text', 'Refute PM claim #1'],
      ['/ + mg e og.2 text', 'Extend OG node #2'],
      ['/ + poi lo pm a', 'POI from LO to PM (accepted)'],
    ],
  },
  {
    title: 'Classification (after quick note)',
    shortcuts: [
      ['c/w/i/r/h/e', 'Set type (claim/warrant/impact/...)'],
      ['1-8', 'Set speaker (PM=1, LO=2, ...)'],
      ['t', 'Toggle classify mode on focused node'],
      ['Enter', 'Confirm classification'],
      ['/', 'Back to command bar'],
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      ['H / L', 'Move left/right (columns)'],
      ['J / K', 'Move down/up (nodes)'],
      ['1-4', 'Jump to column (when not classifying)'],
      ['Shift+J/K', 'Offset node position'],
      ['Enter', 'Edit selected node text'],
      ['X / Delete', 'Delete node'],
    ],
  },
  {
    title: 'Node Actions',
    shortcuts: [
      ['F', 'Flag/star node'],
      ['Shift+D', 'Toggle dropped'],
      ['!', 'Toggle must respond'],
      ['m', 'Mark mode (link source)'],
      ['l', 'Link to marked node (clash)'],
      ['Shift+L', 'Search & link (opens search)'],
    ],
  },
  {
    title: 'Overlays & Files',
    shortcuts: [
      ['W', 'Weighing Matrix'],
      ['Ctrl+X', 'Extension Audit'],
      ['Ctrl+E', 'Export .ledger'],
      ['Ctrl+O', 'Open .ledger'],
      ['Ctrl+N', 'New round'],
    ],
  },
];

export function KeyboardShortcutOverlay({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-subtle rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-bright font-sans text-base font-medium">Keyboard Shortcuts</h2>
          <span className="text-text-muted text-xs font-mono">Press ? or Esc to close</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-text-secondary text-[11px] font-mono uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd className="text-[9px] font-mono text-text-bright bg-bg-primary px-1.5 py-0.5 rounded border border-border-subtle min-w-[50px] text-center shrink-0">
                      {key}
                    </kbd>
                    <span className="text-[10px] text-text-secondary">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
