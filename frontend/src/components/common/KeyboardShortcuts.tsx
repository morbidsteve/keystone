interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
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
    title: 'Quick Actions',
    shortcuts: [
      { keys: ['\u2318', 'K'], description: 'Command Palette' },
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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '2px',
            color: 'var(--color-text-bright)',
            marginBottom: 20,
            textTransform: 'uppercase',
          }}
        >
          Keyboard Shortcuts
        </h2>

        {shortcutGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {group.title}
            </h3>
            {group.shortcuts.map((shortcut) => (
              <div
                key={shortcut.description}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-text)',
                  }}
                >
                  {shortcut.description}
                </span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      {i > 0 && (
                        <span
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: 10,
                            marginRight: 4,
                          }}
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
