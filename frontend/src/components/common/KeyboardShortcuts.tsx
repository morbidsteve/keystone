interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Command Palette',
    shortcuts: [
      { keys: ['\u2318', 'K'], description: 'Open command palette' },
      { keys: ['>'], description: 'Commands mode (in palette)' },
      { keys: ['#'], description: 'Search NSN / TAMCN / DODIC (in palette)' },
      { keys: ['@'], description: 'Search personnel (in palette)' },
      { keys: ['!'], description: 'Search equipment by bumper / serial (in palette)' },
      { keys: ['/'], description: 'Navigate to page (in palette)' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'M'], description: 'Go to Map' },
      { keys: ['G', 'S'], description: 'Go to Supply' },
      { keys: ['G', 'E'], description: 'Go to Equipment' },
      { keys: ['G', 'R'], description: 'Go to Readiness' },
      { keys: ['G', 'T'], description: 'Go to Transportation' },
      { keys: ['G', 'P'], description: 'Go to Personnel' },
      { keys: ['G', 'A'], description: 'Go to Alerts' },
    ],
  },
  {
    title: 'Create',
    shortcuts: [
      { keys: ['N', 'R'], description: 'New requisition' },
      { keys: ['N', 'W'], description: 'New work order' },
      { keys: ['N', 'C'], description: 'Plan convoy' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialog' },
    ],
  },
];

const kbdStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-hover)',
  border: '1px solid var(--color-border)',
  borderRadius: 3,
  padding: '2px 6px',
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-bright)',
  display: 'inline-block',
  lineHeight: '16px',
};

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-[100] inset-0"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[8px] max-w-[500px] w-[90%] max-h-[80vh] overflow-y-auto" style={{ padding: '24px' }}
      >
        <h2
          className="font-[var(--font-mono)] text-sm font-bold tracking-[2px] text-[var(--color-text-bright)] mb-5 uppercase"
        >
          Keyboard Shortcuts
        </h2>

        {shortcutGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <h3
              className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-2"
            >
              {group.title}
            </h3>
            {group.shortcuts.map((shortcut) => (
              <div
                key={shortcut.description}
                className="flex justify-between items-center py-1.5 px-0 border-b border-b-[var(--color-border)]"
              >
                <span
                  className="font-[var(--font-mono)] text-xs text-[var(--color-text)]"
                >
                  {shortcut.description}
                </span>
                <span className="flex gap-1 items-center">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      {i > 0 && (
                        <span
                          className="text-[var(--color-text-muted)] text-[10px] mr-1"
                        >
                          +
                        </span>
                      )}
                      <kbd style={kbdStyle}>{key}</kbd>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
