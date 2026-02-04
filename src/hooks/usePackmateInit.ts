'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { 
  OSId, 
  apps, 
  categories,
  Category,
  STORAGE_KEYS, 
  PackageManagerId, 
  PackageManager,
  AppData,
  getPackageManagersByOS,
  getPrimaryPackageManager,
} from '@/lib/data';
import {
  filterApps,
  filterCategories,
  getFilteredAppsByCategory,
} from '@/lib/search';

// Requirements: 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5
// Smart Search Requirements: 1.1, 5.1, 6.1, 7.3
// Main state hook for OS selection, package manager selection, app selection, search, and localStorage persistence

interface UsePackmateInitReturn {
  // OS Selection
  selectedOS: OSId;
  setSelectedOS: (os: OSId) => void;
  
  // Package Manager Selection (Requirements 8.1, 8.5)
  selectedPackageManager: PackageManagerId;
  setSelectedPackageManager: (pm: PackageManagerId) => void;
  getAvailablePackageManagers: () => PackageManager[];
  
  // App Selection
  selectedApps: Set<string>;
  toggleApp: (id: string) => void;
  clearAll: () => void;
  selectedCount: number;
  
  // Availability (Requirement 8.2)
  isAppAvailable: (id: string) => boolean;
  
  // Search State (Smart Search Requirements 1.1, 5.1, 6.1, 7.3)
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredApps: AppData[];
  filteredCategories: Category[];
  getFilteredAppsByCategoryFn: (category: Category) => AppData[];
  hasSearchResults: boolean;
  
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

// Get localStorage key for package manager based on OS - Requirement 8.3
function getPackageManagerStorageKey(osId: OSId): string {
  switch (osId) {
    case 'windows':
      return STORAGE_KEYS.PACKAGE_MANAGER_WINDOWS;
    case 'macos':
      return STORAGE_KEYS.PACKAGE_MANAGER_MACOS;
    case 'linux':
      return STORAGE_KEYS.PACKAGE_MANAGER_LINUX;
  }
}

// Get initial package manager from localStorage or OS default - Requirements 8.3, 8.4
function getInitialPackageManager(osId: OSId): PackageManagerId {
  if (typeof window === 'undefined') {
    return getPrimaryPackageManager(osId).id;
  }
  
  try {
    const storageKey = getPackageManagerStorageKey(osId);
    const storedPM = localStorage.getItem(storageKey) as PackageManagerId | null;
    
    if (storedPM) {
      // Validate that the stored PM is valid for this OS
      const availablePMs = getPackageManagersByOS(osId);
      const isValid = availablePMs.some(pm => pm.id === storedPM);
      
      if (isValid) {
        return storedPM;
      } else {
        // Invalid stored PM, log warning and fall back to primary
        console.warn(`Invalid package manager "${storedPM}" for OS "${osId}", falling back to primary`);
      }
    }
  } catch {
    // localStorage not available
  }
  
  return getPrimaryPackageManager(osId).id;
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
  const [selectedPackageManager, setSelectedPackageManagerState] = useState<PackageManagerId>(
    () => getInitialPackageManager(storedOS)
  );
  const [selectedApps, setSelectedApps] = useState<Set<string>>(() => getInitialApps());
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Search state - Smart Search Requirements 1.1, 5.1, 6.1, 7.3
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Persist OS selection and update package manager - Requirements 8.4
  const setSelectedOS = useCallback((os: OSId) => {
    setSelectedOSState(os);
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_OS, os);
    } catch {
      // localStorage not available
    }
    
    // When OS changes, restore persisted PM or fall back to primary - Requirement 8.4
    const newPM = getInitialPackageManager(os);
    setSelectedPackageManagerState(newPM);
  }, []);

  // Set package manager and persist to localStorage - Requirements 8.1, 8.3
  const setSelectedPackageManager = useCallback((pm: PackageManagerId) => {
    // Validate that the PM is valid for the current OS
    const availablePMs = getPackageManagersByOS(selectedOS);
    const isValid = availablePMs.some(availablePM => availablePM.id === pm);
    
    if (!isValid) {
      console.warn(`Package manager "${pm}" is not valid for OS "${selectedOS}"`);
      return;
    }
    
    setSelectedPackageManagerState(pm);
    
    // Persist to localStorage with OS-specific key - Requirement 8.3
    try {
      const storageKey = getPackageManagerStorageKey(selectedOS);
      localStorage.setItem(storageKey, pm);
    } catch {
      // localStorage not available
    }
  }, [selectedOS]);

  // Get available package managers for current OS - Requirement 8.5
  const getAvailablePackageManagers = useCallback((): PackageManager[] => {
    return getPackageManagersByOS(selectedOS);
  }, [selectedOS]);

  // Check if app is available for selected package manager - Requirement 8.2
  // Note: This is defined before toggleApp so it can be used in the dependency array
  const checkAppAvailable = useCallback((id: string): boolean => {
    const app = apps.find(a => a.id === id);
    if (!app) return false;
    
    // Check if app has a target for the selected package manager
    const target = app.targets[selectedPackageManager];
    return target !== undefined && target !== '';
  }, [selectedPackageManager]);

  // Toggle app selection - Requirement 3.5: Prevent selecting unavailable apps
  const toggleApp = useCallback((id: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Always allow removing an app from selection
        next.delete(id);
      } else {
        // Only add if app is available for current package manager - Requirement 3.5
        if (!checkAppAvailable(id)) {
          // Skip toggle if app is unavailable - no-op
          return prev;
        }
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
  }, [checkAppAvailable]);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedApps(new Set());
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify([]));
    } catch {
      // localStorage not available
    }
  }, []);

  // Expose checkAppAvailable as isAppAvailable for external use - Requirement 8.2
  const isAppAvailable = checkAppAvailable;

  // Count of selected apps
  const selectedCount = useMemo(() => selectedApps.size, [selectedApps]);

  // Filtered apps based on search query - Smart Search Requirement 1.1, 7.3
  const filteredApps = useMemo(() => {
    return filterApps(apps, searchQuery);
  }, [searchQuery]);

  // Filtered categories based on search query - Smart Search Requirement 5.1
  const filteredCategories = useMemo(() => {
    return filterCategories(categories, apps, searchQuery);
  }, [searchQuery]);

  // Get filtered apps for a specific category - Smart Search Requirement 5.2
  const getFilteredAppsByCategoryFn = useCallback((category: Category): AppData[] => {
    return getFilteredAppsByCategory(apps, category, searchQuery);
  }, [searchQuery]);

  // Check if there are search results - Smart Search Requirement 6.1
  const hasSearchResults = useMemo(() => {
    return filteredApps.length > 0;
  }, [filteredApps]);

  return {
    selectedOS,
    setSelectedOS,
    selectedPackageManager,
    setSelectedPackageManager,
    getAvailablePackageManagers,
    selectedApps,
    toggleApp,
    clearAll,
    selectedCount,
    isAppAvailable,
    searchQuery,
    setSearchQuery,
    filteredApps,
    filteredCategories,
    getFilteredAppsByCategoryFn,
    hasSearchResults,
    isHydrated,
  };
}
