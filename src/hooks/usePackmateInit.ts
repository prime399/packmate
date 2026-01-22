'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { OSId, apps, STORAGE_KEYS } from '@/lib/data';

// Requirements: 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5
// Main state hook for OS selection, app selection, and localStorage persistence

interface UsePackmateInitReturn {
  // OS Selection
  selectedOS: OSId;
  setSelectedOS: (os: OSId) => void;
  
  // App Selection
  selectedApps: Set<string>;
  toggleApp: (id: string) => void;
  clearAll: () => void;
  selectedCount: number;
  
  // Availability
  isAppAvailable: (id: string) => boolean;
  
  // Hydration
  isHydrated: boolean;
}

// Detect user's OS from navigator
function detectOS(): OSId {
  if (typeof window === 'undefined') return 'windows';
  
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'macos';
  }
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }
  return 'windows';
}

// Get initial OS from localStorage or detect
function getInitialOS(): OSId {
  if (typeof window === 'undefined') return 'windows';
  try {
    const storedOS = localStorage.getItem(STORAGE_KEYS.SELECTED_OS) as OSId | null;
    if (storedOS && ['macos', 'linux', 'windows'].includes(storedOS)) {
      return storedOS;
    }
  } catch {
    // localStorage not available
  }
  return detectOS();
}

// Get initial apps from localStorage
function getInitialApps(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const storedApps = localStorage.getItem(STORAGE_KEYS.SELECTED_APPS);
    if (storedApps) {
      const parsed = JSON.parse(storedApps);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // localStorage not available or corrupted data
  }
  return new Set();
}

// Subscribe to storage changes
function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getStoredOS(): OSId {
  return getInitialOS();
}

function getServerOS(): OSId {
  return 'windows';
}

export function usePackmateInit(): UsePackmateInitReturn {
  // Use useSyncExternalStore for hydration-safe localStorage access
  const storedOS = useSyncExternalStore(
    subscribeToStorage,
    getStoredOS,
    getServerOS
  );
  
  const [selectedOS, setSelectedOSState] = useState<OSId>(storedOS);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(() => getInitialApps());
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync with stored OS on mount
  useEffect(() => {
    if (storedOS !== selectedOS) {
      setSelectedOSState(storedOS);
    }
  }, [storedOS]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist OS selection
  const setSelectedOS = useCallback((os: OSId) => {
    setSelectedOSState(os);
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_OS, os);
    } catch {
      // localStorage not available
    }
  }, []);

  // Toggle app selection
  const toggleApp = useCallback((id: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify([...next]));
      } catch {
        // localStorage not available
      }
      
      return next;
    });
  }, []);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedApps(new Set());
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify([]));
    } catch {
      // localStorage not available
    }
  }, []);

  // Check if app is available for selected OS
  const isAppAvailable = useCallback((id: string): boolean => {
    const app = apps.find(a => a.id === id);
    if (!app) return false;
    return app.availability[selectedOS];
  }, [selectedOS]);

  // Count of selected apps
  const selectedCount = useMemo(() => selectedApps.size, [selectedApps]);

  return {
    selectedOS,
    setSelectedOS,
    selectedApps,
    toggleApp,
    clearAll,
    selectedCount,
    isAppAvailable,
    isHydrated,
  };
}
