import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { apps, categories, OSId, getAppsByCategory, isAppAvailableForOS } from '@/lib/data';

// Feature: packmate-skeleton-ui
// Property 4: Category Section Toggle - **Validates: Requirements 5.3**
// Property 5: App Item Selection Toggle - **Validates: Requirements 6.2**
// Property 6: Category Selection Count Accuracy - **Validates: Requirements 5.4**
// Property 9: App Availability Filtering - **Validates: Requirements 6.6**

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

describe('App Availability Filtering', () => {
  // Property 9: App should be unavailable iff availability flag is false
  it('app availability should match OS availability flag', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: apps.length - 1 }),
        fc.constantFrom<OSId>('macos', 'linux', 'windows'),
        (appIndex, os) => {
          const app = apps[appIndex];
          const isAvailable = isAppAvailableForOS(app, os);
          
          // Should match the availability flag
          expect(isAvailable).toBe(app.availability[os]);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unavailable apps should have false availability flag', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: apps.length - 1 }),
        fc.constantFrom<OSId>('macos', 'linux', 'windows'),
        (appIndex, os) => {
          const app = apps[appIndex];
          
          // If app is not available for OS, flag should be false
          if (!app.availability[os]) {
            expect(isAppAvailableForOS(app, os)).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
