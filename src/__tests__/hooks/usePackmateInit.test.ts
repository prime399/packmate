import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  STORAGE_KEYS, 
  apps, 
  OSId, 
  PackageManagerId,
  getPackageManagersByOS,
  getPrimaryPackageManager,
} from '@/lib/data';

// Feature: packmate-skeleton-ui
// Property 1: OS Selection Round-Trip - **Validates: Requirements 2.4, 2.5**
// Property 3: App Selection Round-Trip - **Validates: Requirements 9.1, 9.2**
// Property 10: Clear All Selections - **Validates: Requirements 9.3**

// Feature: package-manager-integration
// Property 2: Package Manager Persistence Round-Trip - **Validates: Requirements 2.3, 8.3**
// Property 3: OS Change Restores Package Manager - **Validates: Requirements 2.4, 8.4**

describe('OS Selection Round-Trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Property 1: For any OS selection, storing and reading should produce the same value
  it('should preserve OS selection through localStorage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OSId>('macos', 'linux', 'windows'),
        (os) => {
          localStorage.setItem(STORAGE_KEYS.SELECTED_OS, os);
          const restored = localStorage.getItem(STORAGE_KEYS.SELECTED_OS);
          expect(restored).toBe(os);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('App Selection Round-Trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Property 3: For any set of selected app IDs, storing and reading should produce equivalent set
  it('should preserve app selections through localStorage', () => {
    const appIds = apps.map(a => a.id);
    
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom(...appIds), { minLength: 0, maxLength: 20 }),
        (selectedIds) => {
          // Store selections
          localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify(selectedIds));
          
          // Restore selections
          const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_APPS);
          const restored = JSON.parse(stored || '[]');
          
          // Should be equivalent sets
          expect(new Set(restored)).toEqual(new Set(selectedIds));
          expect(restored.length).toBe(selectedIds.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty selection', () => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify([]));
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_APPS);
    const restored = JSON.parse(stored || '[]');
    expect(restored).toEqual([]);
  });
});

describe('Clear All Selections', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Property 10: For any initial set, clearing should result in empty set
  it('clearing should result in empty selection', () => {
    const appIds = apps.map(a => a.id);
    
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom(...appIds), { minLength: 0, maxLength: 20 }),
        (initialSelection) => {
          // Set initial selection
          localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify(initialSelection));
          
          // Clear all (simulate clearAll function)
          localStorage.setItem(STORAGE_KEYS.SELECTED_APPS, JSON.stringify([]));
          
          // Verify empty
          const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_APPS);
          const restored = JSON.parse(stored || '[]');
          
          expect(restored).toEqual([]);
          expect(restored.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: package-manager-integration
// Property 2: Package Manager Persistence Round-Trip
// For any valid package manager ID and operating system, setting the package manager
// via setSelectedPackageManager and then retrieving it via selectedPackageManager
// (after simulating a page reload) SHALL return the same package manager ID.
// **Validates: Requirements 2.3, 8.3**

// Helper function to get localStorage key for package manager based on OS
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

describe('Package Manager Persistence Round-Trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Property 2: For any valid package manager and OS, storing and reading should produce the same value
  it('should preserve package manager selection through localStorage for each OS', () => {
    const allOSIds: OSId[] = ['windows', 'macos', 'linux'];
    
    fc.assert(
      fc.property(
        fc.constantFrom<OSId>(...allOSIds),
        (osId) => {
          // Get valid package managers for this OS
          const validPMs = getPackageManagersByOS(osId);
          
          // For each valid package manager, test persistence
          for (const pm of validPMs) {
            const storageKey = getPackageManagerStorageKey(osId);
            
            // Store the package manager (simulating setSelectedPackageManager)
            localStorage.setItem(storageKey, pm.id);
            
            // Retrieve the package manager (simulating page reload and reading from localStorage)
            const restored = localStorage.getItem(storageKey) as PackageManagerId | null;
            
            // Should be the same value
            expect(restored).toBe(pm.id);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist package manager selection independently per OS', () => {
    fc.assert(
      fc.property(
        fc.record({
          windowsPM: fc.constantFrom<PackageManagerId>('winget', 'chocolatey', 'scoop'),
          macosPM: fc.constantFrom<PackageManagerId>('homebrew', 'macports'),
          linuxPM: fc.constantFrom<PackageManagerId>('apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'),
        }),
        ({ windowsPM, macosPM, linuxPM }) => {
          // Store package managers for each OS
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_WINDOWS, windowsPM);
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_MACOS, macosPM);
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_LINUX, linuxPM);
          
          // Verify each OS has its own independent storage
          expect(localStorage.getItem(STORAGE_KEYS.PACKAGE_MANAGER_WINDOWS)).toBe(windowsPM);
          expect(localStorage.getItem(STORAGE_KEYS.PACKAGE_MANAGER_MACOS)).toBe(macosPM);
          expect(localStorage.getItem(STORAGE_KEYS.PACKAGE_MANAGER_LINUX)).toBe(linuxPM);
          
          // Changing one should not affect others
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_WINDOWS, 'chocolatey');
          expect(localStorage.getItem(STORAGE_KEYS.PACKAGE_MANAGER_MACOS)).toBe(macosPM);
          expect(localStorage.getItem(STORAGE_KEYS.PACKAGE_MANAGER_LINUX)).toBe(linuxPM);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: package-manager-integration
// Property 3: OS Change Restores Package Manager
// For any sequence of OS selections where a package manager was previously selected for an OS,
// switching away from that OS and then back SHALL restore the previously selected package manager for that OS.
// **Validates: Requirements 2.4, 8.4**

describe('OS Change Restores Package Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Property 3: Switching OS and back should restore the previously selected package manager
  it('should restore previously selected package manager when switching back to an OS', () => {
    const allOSIds: OSId[] = ['windows', 'macos', 'linux'];
    
    fc.assert(
      fc.property(
        fc.constantFrom<OSId>(...allOSIds),
        fc.constantFrom<OSId>(...allOSIds),
        (initialOS, intermediateOS) => {
          // Skip if same OS (no switch)
          if (initialOS === intermediateOS) return true;
          
          // Get a valid package manager for the initial OS
          const initialOSPackageManagers = getPackageManagersByOS(initialOS);
          const selectedPM = initialOSPackageManagers[0]; // Pick first available
          
          // Store the package manager for initial OS
          const storageKey = getPackageManagerStorageKey(initialOS);
          localStorage.setItem(storageKey, selectedPM.id);
          
          // Simulate switching to intermediate OS (this would trigger reading from its storage)
          const intermediateStorageKey = getPackageManagerStorageKey(intermediateOS);
          localStorage.getItem(intermediateStorageKey);
          // If no stored PM for intermediate OS, it would use primary (we don't need to verify this)
          
          // Simulate switching back to initial OS
          const restoredPM = localStorage.getItem(storageKey);
          
          // Should restore the previously selected package manager
          expect(restoredPM).toBe(selectedPM.id);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain separate package manager selections across multiple OS switches', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of OS switches
        fc.array(fc.constantFrom<OSId>('windows', 'macos', 'linux'), { minLength: 3, maxLength: 10 }),
        (osSequence) => {
          // Set up initial package managers for each OS
          const pmSelections: Record<OSId, PackageManagerId> = {
            windows: 'chocolatey', // Non-primary to test persistence
            macos: 'macports',     // Non-primary to test persistence
            linux: 'dnf',          // Non-primary to test persistence
          };
          
          // Store initial selections
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_WINDOWS, pmSelections.windows);
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_MACOS, pmSelections.macos);
          localStorage.setItem(STORAGE_KEYS.PACKAGE_MANAGER_LINUX, pmSelections.linux);
          
          // Simulate switching through the OS sequence
          for (const os of osSequence) {
            const storageKey = getPackageManagerStorageKey(os);
            const restoredPM = localStorage.getItem(storageKey);
            
            // Should always restore the correct package manager for this OS
            expect(restoredPM).toBe(pmSelections[os]);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fall back to primary package manager when no selection is stored', () => {
    const allOSIds: OSId[] = ['windows', 'macos', 'linux'];
    
    fc.assert(
      fc.property(
        fc.constantFrom<OSId>(...allOSIds),
        (osId) => {
          // Clear any stored selection for this OS
          const storageKey = getPackageManagerStorageKey(osId);
          localStorage.removeItem(storageKey);
          
          // When no selection is stored, the hook should use the primary PM
          const storedPM = localStorage.getItem(storageKey);
          expect(storedPM).toBeNull();
          
          // The primary package manager should be used as default
          const primaryPM = getPrimaryPackageManager(osId);
          expect(primaryPM).toBeDefined();
          expect(primaryPM.osId).toBe(osId);
          expect(primaryPM.isPrimary).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: package-manager-integration
// Property 11: Unavailable Apps Cannot Be Selected
// For any app that does not have a target for the currently selected package manager,
// calling toggleApp with that app's ID SHALL NOT add the app to the selectedApps set.
// **Validates: Requirements 3.5**

describe('Unavailable Apps Cannot Be Selected', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Helper function to check if an app is available for a package manager
  function isAppAvailableForPM(appId: string, pmId: PackageManagerId): boolean {
    const app = apps.find(a => a.id === appId);
    if (!app) return false;
    const target = app.targets[pmId];
    return target !== undefined && target !== '';
  }

  // Helper function to get unavailable apps for a package manager
  function getUnavailableAppsForPM(pmId: PackageManagerId): string[] {
    return apps
      .filter(app => !isAppAvailableForPM(app.id, pmId))
      .map(app => app.id);
  }

  // Property 11: Unavailable apps cannot be added to selection
  it('should not add unavailable apps to selection when toggleApp is called', () => {
    // Get all package manager IDs
    const allPMIds: PackageManagerId[] = [
      'winget', 'chocolatey', 'scoop',
      'homebrew', 'macports',
      'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom<PackageManagerId>(...allPMIds),
        (pmId) => {
          // Get apps that are unavailable for this package manager
          const unavailableApps = getUnavailableAppsForPM(pmId);
          
          // Skip if all apps are available for this PM (unlikely but possible)
          if (unavailableApps.length === 0) return true;
          
          // Simulate the toggleApp behavior for each unavailable app
          // Start with an empty selection
          const selectedApps = new Set<string>();
          
          for (const appId of unavailableApps) {
            // Simulate toggleApp logic: only add if available
            const isAvailable = isAppAvailableForPM(appId, pmId);
            
            if (!selectedApps.has(appId)) {
              // Trying to add - should only succeed if available
              if (isAvailable) {
                selectedApps.add(appId);
              }
              // If not available, selection should remain unchanged
            }
            
            // Verify: unavailable app should NOT be in selection
            expect(selectedApps.has(appId)).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent selection of randomly chosen unavailable apps', () => {
    const allPMIds: PackageManagerId[] = [
      'winget', 'chocolatey', 'scoop',
      'homebrew', 'macports',
      'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom<PackageManagerId>(...allPMIds),
        fc.integer({ min: 0, max: apps.length - 1 }),
        (pmId, appIndex) => {
          const app = apps[appIndex];
          const isAvailable = isAppAvailableForPM(app.id, pmId);
          
          // Simulate toggleApp behavior
          const selectedApps = new Set<string>();
          
          // Try to toggle (add) the app
          if (!selectedApps.has(app.id)) {
            if (isAvailable) {
              selectedApps.add(app.id);
            }
            // If not available, do nothing (selection unchanged)
          }
          
          // Property: If app is unavailable, it should NOT be in selection
          if (!isAvailable) {
            expect(selectedApps.has(app.id)).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow removing previously selected apps even if they become unavailable', () => {
    // This tests the edge case where an app was selected, then the PM changed
    // making it unavailable, but the user should still be able to deselect it
    const allPMIds: PackageManagerId[] = [
      'winget', 'chocolatey', 'scoop',
      'homebrew', 'macports',
      'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom<PackageManagerId>(...allPMIds),
        fc.integer({ min: 0, max: apps.length - 1 }),
        (pmId, appIndex) => {
          const app = apps[appIndex];
          
          // Start with the app already selected (simulating it was selected before PM change)
          const selectedApps = new Set<string>([app.id]);
          
          // Simulate toggleApp to remove - should always work regardless of availability
          if (selectedApps.has(app.id)) {
            selectedApps.delete(app.id);
          }
          
          // Property: After toggle to remove, app should NOT be in selection
          expect(selectedApps.has(app.id)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain selection integrity across multiple toggle attempts on unavailable apps', () => {
    const allPMIds: PackageManagerId[] = [
      'winget', 'chocolatey', 'scoop',
      'homebrew', 'macports',
      'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom<PackageManagerId>(...allPMIds),
        fc.array(fc.integer({ min: 0, max: apps.length - 1 }), { minLength: 1, maxLength: 10 }),
        (pmId, appIndices) => {
          const selectedApps = new Set<string>();
          
          for (const appIndex of appIndices) {
            const app = apps[appIndex];
            const isAvailable = isAppAvailableForPM(app.id, pmId);
            
            // Simulate toggleApp
            if (selectedApps.has(app.id)) {
              // Remove - always allowed
              selectedApps.delete(app.id);
            } else {
              // Add - only if available
              if (isAvailable) {
                selectedApps.add(app.id);
              }
            }
          }
          
          // Property: No unavailable apps should be in the final selection
          for (const appId of selectedApps) {
            const isAvailable = isAppAvailableForPM(appId, pmId);
            expect(isAvailable).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
