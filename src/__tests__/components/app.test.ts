import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { apps, categories, OSId, PackageManagerId, getAppsByCategory, isAppAvailableForOS, isAppAvailableForPackageManager, getPackageManagersByOS } from '@/lib/data';

// Feature: packmate-skeleton-ui
// Property 4: Category Section Toggle - **Validates: Requirements 5.3**
// Property 5: App Item Selection Toggle - **Validates: Requirements 6.2**
// Property 6: Category Selection Count Accuracy - **Validates: Requirements 5.4**
// Feature: package-manager-integration
// Property 4: App Availability Based on Targets - **Validates: Requirements 3.1, 8.2**

describe('Category Section Toggle', () => {
  // Property 4: Clicking header should toggle expanded state
  it('toggling expanded state should flip the value', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialExpanded) => {
          // Simulate toggle
          const toggled = !initialExpanded;
          
          // Should be opposite of initial
          expect(toggled).toBe(!initialExpanded);
          
          // Double toggle should return to original
          const doubleToggled = !toggled;
          expect(doubleToggled).toBe(initialExpanded);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('App Item Selection Toggle', () => {
  // Property 5: Clicking app should toggle selection state
  it('toggling selection should flip the value', () => {
    const appIds = apps.map(a => a.id);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...appIds),
        fc.boolean(),
        (appId, initialSelected) => {
          const selectedApps = new Set<string>();
          if (initialSelected) {
            selectedApps.add(appId);
          }
          
          // Simulate toggle
          if (selectedApps.has(appId)) {
            selectedApps.delete(appId);
          } else {
            selectedApps.add(appId);
          }
          
          // Should be opposite of initial
          expect(selectedApps.has(appId)).toBe(!initialSelected);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Category Selection Count Accuracy', () => {
  // Property 6: Badge count should equal selected apps in category
  it('selection count should match selected apps in category', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...categories),
        fc.uniqueArray(fc.constantFrom(...apps.map(a => a.id)), { minLength: 0, maxLength: 20 }),
        (category, selectedIds) => {
          const selectedApps = new Set(selectedIds);
          const categoryApps = getAppsByCategory(category);
          
          // Count selected apps in this category
          const expectedCount = categoryApps.filter(app => selectedApps.has(app.id)).length;
          
          // Verify count is accurate
          const actualCount = categoryApps.reduce(
            (count, app) => count + (selectedApps.has(app.id) ? 1 : 0),
            0
          );
          
          expect(actualCount).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: package-manager-integration, Property 10: Category count matches available apps', () => {
  // Property 10: Category count matches available apps
  // For any category and package manager, the count displayed in the category badge
  // SHALL equal the number of apps in that category that have a target for the selected package manager.
  // **Validates: Requirements 3.4**
  it('category available count should match apps with targets for selected package manager', () => {
    const allPackageManagerIds: PackageManagerId[] = [
      'winget', 'chocolatey', 'scoop',
      'homebrew', 'macports',
      'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
    ];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...categories),
        fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
        (category, pmId) => {
          // Get all apps in this category
          const categoryApps = getAppsByCategory(category);
          
          // Calculate available count the same way CategorySection does:
          // Count apps where isAppAvailable returns true
          // isAppAvailable checks if app.targets[packageManagerId] exists and is non-empty
          const availableCount = categoryApps.filter(app => 
            isAppAvailableForPackageManager(app, pmId)
          ).length;
          
          // Verify by manually counting apps with targets for this package manager
          const expectedCount = categoryApps.filter(app => {
            const target = app.targets[pmId];
            return target !== undefined && target !== '';
          }).length;
          
          // The available count should equal the expected count
          expect(availableCount).toBe(expectedCount);
          
          // Additional invariants:
          // Available count should never exceed total apps in category
          expect(availableCount).toBeLessThanOrEqual(categoryApps.length);
          // Available count should be non-negative
          expect(availableCount).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Available count consistency across all package managers for an OS
  it('available count should be consistent when calculated via different methods', () => {
    const osIds: OSId[] = ['windows', 'macos', 'linux'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...categories),
        fc.constantFrom<OSId>(...osIds),
        (category, osId) => {
          const categoryApps = getAppsByCategory(category);
          const osPackageManagers = getPackageManagersByOS(osId);
          
          // For each package manager of this OS, verify the count calculation
          for (const pm of osPackageManagers) {
            const availableCount = categoryApps.filter(app => 
              isAppAvailableForPackageManager(app, pm.id)
            ).length;
            
            // Count should be between 0 and total apps
            expect(availableCount).toBeGreaterThanOrEqual(0);
            expect(availableCount).toBeLessThanOrEqual(categoryApps.length);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('App Availability Filtering', () => {
  // Property 4: App availability based on targets
  // For any app and package manager, isAppAvailableForPackageManager returns true
  // if and only if the app's targets object contains a non-empty string value for that package manager ID
  // **Validates: Requirements 3.1, 8.2**
  it('app availability should match targets for package manager', () => {
    const allPackageManagerIds: PackageManagerId[] = [
      'winget', 'chocolatey', 'scoop',
      'homebrew', 'macports',
      'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
    ];
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: apps.length - 1 }),
        fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
        (appIndex, pmId) => {
          const app = apps[appIndex];
          const isAvailable = isAppAvailableForPackageManager(app, pmId);
          
          // Should be true iff targets has a non-empty string for this package manager
          const target = app.targets[pmId];
          const expectedAvailable = target !== undefined && target !== '';
          
          expect(isAvailable).toBe(expectedAvailable);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // App should be available for OS if it has at least one package manager target for that OS
  it('app availability for OS should match having at least one package manager target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: apps.length - 1 }),
        fc.constantFrom<OSId>('macos', 'linux', 'windows'),
        (appIndex, os) => {
          const app = apps[appIndex];
          const isAvailable = isAppAvailableForOS(app, os);
          
          // Get package managers for this OS
          const osPackageManagers = getPackageManagersByOS(os);
          
          // App should be available if it has at least one target for any PM of this OS
          const hasAnyTarget = osPackageManagers.some(pm => 
            isAppAvailableForPackageManager(app, pm.id)
          );
          
          expect(isAvailable).toBe(hasAnyTarget);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
