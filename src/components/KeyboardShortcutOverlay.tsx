interface Props {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Global',
    shortcuts: [
      ['/', 'Focus command bar'],
      ['Esc', 'Close / Unfocus'],
      ['Tab', 'Cycle sidebar'],
      ['Space', 'Start/Stop timer'],
      ['Ctrl+R', 'Reset timer'],
      ['Ctrl+L', 'Toggle all links'],
      ['Ctrl+D', 'Toggle drops filter'],
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Shift+Z', 'Redo'],
      ['Ctrl+→/←', 'Cycle speaker'],
      ['Ctrl+P', 'Open Speech Prep'],
      ['?', 'This overlay'],
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      ['H / L', 'Move left/right (columns)'],
      ['J / K', 'Move down/up (nodes)'],
      ['1-4', 'Jump to column'],
      ['Shift+J/K', 'Offset node up/down'],
      ['Enter', 'Edit selected node'],
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
      ['l', 'Link to marked node'],
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
  {
    title: 'Command Bar',
    shortcuts: [
      ['Enter', 'Submit command'],
      ['Up/Down', 'History navigation'],
      ['Esc', 'Clear and unfocus'],
    ],
  },
  {
    title: 'Command Syntax',
    shortcuts: [
      ['pm c text', 'Add Claim to PM'],
      ['lo r pm.1 text', 'Refute PM node #1'],
      ['mg e og.2 text', 'Extend OG node #2'],
      ['poi lo pm a text', 'POI from LO to PM (accepted)'],
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
        className="bg-bg-card border border-border-subtle rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
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
                    <kbd className="text-[10px] font-mono text-text-bright bg-bg-primary px-1.5 py-0.5 rounded border border-border-subtle min-w-[60px] text-center shrink-0">
                      {key}
                    </kbd>
                    <span className="text-[11px] text-text-secondary">{desc}</span>
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
