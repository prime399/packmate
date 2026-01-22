'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from '@/lib/data';

// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 - Theme toggle with localStorage persistence

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Helper to get initial theme from localStorage
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // localStorage not available
  }
  return 'dark';
}

// Subscribe to storage changes
function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getStoredTheme(): Theme {
  return getInitialTheme();
}

function getServerSnapshot(): Theme {
  return 'dark';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Use useSyncExternalStore for hydration-safe localStorage access
  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    getServerSnapshot
  );
  
  const [theme, setThemeState] = useState<Theme>(storedTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync with stored theme on mount
  useEffect(() => {
    if (storedTheme !== theme) {
      setThemeState(storedTheme);
    }
  }, [storedTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme class to document
  useEffect(() => {
    if (!isHydrated) return;
    
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme, isHydrated]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isHydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
