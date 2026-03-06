import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useThemeStore } from '../../src/stores/themeStore';

describe('Theme Store', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useThemeStore.setState({ theme: 'dark' });
    });
  });

  it('default theme is dark', () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe('dark');
  });

  it('toggleTheme switches to light', () => {
    act(() => {
      useThemeStore.getState().toggleTheme();
    });
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggleTheme again switches back to dark', () => {
    act(() => {
      useThemeStore.getState().toggleTheme();
    });
    expect(useThemeStore.getState().theme).toBe('light');

    act(() => {
      useThemeStore.getState().toggleTheme();
    });
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('setTheme sets a specific theme', () => {
    act(() => {
      useThemeStore.getState().setTheme('light');
    });
    expect(useThemeStore.getState().theme).toBe('light');

    act(() => {
      useThemeStore.getState().setTheme('dark');
    });
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('persists theme to localStorage', () => {
    act(() => {
      useThemeStore.getState().setTheme('light');
    });
    expect(localStorage.getItem('keystone_theme')).toBe('light');

    act(() => {
      useThemeStore.getState().toggleTheme();
    });
    expect(localStorage.getItem('keystone_theme')).toBe('dark');
  });
});
