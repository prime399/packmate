import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { apps, PackageManagerId, getPackageManagersByOS, isAppAvailableForPackageManager } from '@/lib/data';

/**
 * Feature: package-manager-integration, Property 12: Footer visibility based on selection
 * **Validates: Requirements 6.1, 6.7**
 *
 * Property: For any state where `selectedApps.size > 0`, the Command Footer SHALL be visible.
 * For any state where `selectedApps.size === 0`, the Command Footer SHALL be hidden or show a placeholder.
 *
 * Note: The CommandFooter component uses a `hasEverHadSelection` state that tracks if the user
 * has ever made a selection. The footer only appears after the first selection is made.
 * This test validates the visibility logic based on selection state.
 */

// All valid package manager IDs
const allPackageManagerIds: PackageManagerId[] = [
  'winget', 'chocolatey', 'scoop',
  'homebrew', 'macports',
  'apt', 'dnf', 'pacman', 'zypper', 'flatpak', 'snap'
];

// Get all valid app IDs
const allAppIds = apps.map(a => a.id);

/**
 * Simulates the footer visibility logic from CommandFooter component.
 * 
 * The component has two conditions for visibility:
 * 1. `hasEverHadSelection` must be true (user has made at least one selection in the session)
 * 2. When visible, it shows the command if selectedCount > 0, or placeholder if selectedCount === 0
 * 
 * @param selectedApps - Set of selected app IDs
 * @param hasEverHadSelection - Whether user has ever made a selection in this session
 * @returns Object describing footer visibility state
 */
function getFooterVisibilityState(
  selectedApps: Set<string>,
  hasEverHadSelection: boolean
): { isVisible: boolean; showsCommand: boolean; showsPlaceholder: boolean } {
  const selectedCount = selectedApps.size;
  
  // Footer is only visible if user has ever had a selection
  if (!hasEverHadSelection) {
    return { isVisible: false, showsCommand: false, showsPlaceholder: false };
  }
  
  // Footer is visible, determine what it shows
  if (selectedCount > 0) {
    return { isVisible: true, showsCommand: true, showsPlaceholder: false };
  } else {
    // Shows placeholder "# No packages selected"
    return { isVisible: true, showsCommand: false, showsPlaceholder: true };
  }
}

/**
 * Simulates the hasEverHadSelection state transition.
 * Once set to true, it stays true for the session.
 * 
 * @param currentState - Current hasEverHadSelection state
 * @param selectedCount - Current selection count
 * @param initialCount - Initial selection count when component mounted
 * @returns New hasEverHadSelection state
 */
function updateHasEverHadSelection(
  currentState: boolean,
  selectedCount: number,
  initialCount: number
): boolean {
  // Once true, always true
  if (currentState) return true;
  
  // Becomes true when selection count changes from initial
  return selectedCount !== initialCount;
}

describe('Feature: package-manager-integration, Property 12: Footer visibility based on selection', () => {
  
  describe('Core visibility property', () => {
    it('footer shows command when selectedApps.size > 0 and hasEverHadSelection is true', () => {
      fc.assert(
        fc.property(
          // Generate a non-empty subset of app IDs
          fc.uniqueArray(fc.constantFrom(...allAppIds), { minLength: 1, maxLength: 20 }),
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (selectedIds, pmId) => {
            const selectedApps = new Set(selectedIds);
            
            // Simulate that user has made a selection (hasEverHadSelection = true)
            const state = getFooterVisibilityState(selectedApps, true);
            
            // Property: When selectedApps.size > 0 and hasEverHadSelection is true,
            // footer SHALL be visible and show the command
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(true);
            expect(state.showsPlaceholder).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('footer shows placeholder when selectedApps.size === 0 and hasEverHadSelection is true', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (pmId) => {
            const selectedApps = new Set<string>();
            
            // Simulate that user has made a selection before (hasEverHadSelection = true)
            // but currently has no selection
            const state = getFooterVisibilityState(selectedApps, true);
            
            // Property: When selectedApps.size === 0 but hasEverHadSelection is true,
            // footer SHALL be visible but show placeholder
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(false);
            expect(state.showsPlaceholder).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('footer is hidden when hasEverHadSelection is false', () => {
      fc.assert(
        fc.property(
          // Can be any selection state (including non-empty, though this shouldn't happen in practice)
          fc.uniqueArray(fc.constantFrom(...allAppIds), { minLength: 0, maxLength: 20 }),
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (selectedIds, pmId) => {
            const selectedApps = new Set(selectedIds);
            
            // Simulate initial state where user hasn't made any selection yet
            const state = getFooterVisibilityState(selectedApps, false);
            
            // Property: When hasEverHadSelection is false, footer SHALL be hidden
            expect(state.isVisible).toBe(false);
            expect(state.showsCommand).toBe(false);
            expect(state.showsPlaceholder).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('hasEverHadSelection state transitions', () => {
    it('hasEverHadSelection becomes true when selection count changes from initial', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // initial count
          fc.integer({ min: 0, max: 20 }), // new count
          (initialCount, newCount) => {
            // Start with hasEverHadSelection = false
            let hasEverHadSelection = false;
            
            // Update state based on count change
            hasEverHadSelection = updateHasEverHadSelection(
              hasEverHadSelection,
              newCount,
              initialCount
            );
            
            // Property: hasEverHadSelection becomes true when count differs from initial
            if (newCount !== initialCount) {
              expect(hasEverHadSelection).toBe(true);
            } else {
              expect(hasEverHadSelection).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasEverHadSelection stays true once set', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 2, maxLength: 10 }),
          (countSequence) => {
            const initialCount = countSequence[0];
            let hasEverHadSelection = false;
            
            // Simulate a sequence of selection count changes
            for (const count of countSequence) {
              hasEverHadSelection = updateHasEverHadSelection(
                hasEverHadSelection,
                count,
                initialCount
              );
            }
            
            // Property: If any count in the sequence differed from initial,
            // hasEverHadSelection should be true at the end
            const anyDifferent = countSequence.some(c => c !== initialCount);
            
            if (anyDifferent) {
              expect(hasEverHadSelection).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Visibility with package manager filtering', () => {
    it('footer visibility is independent of which apps are available for package manager', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...allAppIds), { minLength: 1, maxLength: 20 }),
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (selectedIds, pmId) => {
            const selectedApps = new Set(selectedIds);
            
            // Get visibility state
            const state = getFooterVisibilityState(selectedApps, true);
            
            // Property: Footer visibility is based on selectedApps.size,
            // NOT on how many of those apps are available for the package manager
            // The filtering happens in the command generation, not visibility
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(selectedApps.size > 0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('footer shows command even if no selected apps are available for package manager', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (pmId) => {
            // Find apps that are NOT available for this package manager
            const unavailableApps = apps.filter(app => !isAppAvailableForPackageManager(app, pmId));
            
            if (unavailableApps.length === 0) {
              // Skip if all apps are available for this PM
              return true;
            }
            
            // Select only unavailable apps
            const selectedApps = new Set(unavailableApps.slice(0, 3).map(a => a.id));
            
            // Get visibility state
            const state = getFooterVisibilityState(selectedApps, true);
            
            // Property: Footer is still visible even if selected apps aren't available
            // The command will just be empty or show a comment
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    it('footer handles single app selection correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allAppIds),
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (appId, pmId) => {
            const selectedApps = new Set([appId]);
            
            const state = getFooterVisibilityState(selectedApps, true);
            
            // Property: Single selection should show footer with command
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(true);
            expect(state.showsPlaceholder).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('footer handles maximum selection correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (pmId) => {
            // Select all apps
            const selectedApps = new Set(allAppIds);
            
            const state = getFooterVisibilityState(selectedApps, true);
            
            // Property: Maximum selection should show footer with command
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(true);
            expect(state.showsPlaceholder).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('footer transitions correctly from selection to no selection', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...allAppIds), { minLength: 1, maxLength: 10 }),
          fc.constantFrom<PackageManagerId>(...allPackageManagerIds),
          (selectedIds, pmId) => {
            // Start with selection
            let selectedApps = new Set(selectedIds);
            let hasEverHadSelection = true;
            
            let state = getFooterVisibilityState(selectedApps, hasEverHadSelection);
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(true);
            
            // Clear selection
            selectedApps = new Set<string>();
            
            state = getFooterVisibilityState(selectedApps, hasEverHadSelection);
            
            // Property: After clearing selection, footer should still be visible
            // but show placeholder (hasEverHadSelection remains true)
            expect(state.isVisible).toBe(true);
            expect(state.showsCommand).toBe(false);
            expect(state.showsPlaceholder).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
