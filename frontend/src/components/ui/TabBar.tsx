interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex gap-1 border-b border-b-[var(--color-border)]">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              font-[var(--font-mono)] text-[10px] uppercase tracking-[1.5px] px-4 py-2.5
              bg-transparent border-0 border-b-2 cursor-pointer
              transition-all duration-[var(--transition)]
              ${isActive
                ? 'font-semibold border-b-[var(--color-accent)] text-[var(--color-accent)]'
                : 'font-normal border-b-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }
            `}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[2px] text-[9px] font-bold bg-[var(--color-accent)] text-[var(--color-bg)]"
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
