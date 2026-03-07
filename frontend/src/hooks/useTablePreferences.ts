import { useState, useCallback } from 'react';

interface TablePreferences {
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
}

const DEFAULT_PREFS: TablePreferences = {
  pageSize: 25,
  sortColumn: null,
  sortDirection: 'asc',
};

export function useTablePreferences(tableKey: string) {
  const storageKey = `keystone_table_${tableKey}`;

  const [prefs, setPrefs] = useState<TablePreferences>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const updatePrefs = useCallback((updates: Partial<TablePreferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  return { prefs, updatePrefs };
}
