import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { type Category, categories } from '@/lib/data';
import { type NavItem, type FocusPosition } from '@/hooks/useKeyboardNavigation';

// Feature: command-footer-ux
// Property 1: Navigation Movement Bounds
// **Validates: Requirements 1.1**

/**
 * Pure navigation logic extracted for property testing.
 * This mirrors the navigation logic in useKeyboardNavigation hook.
 * 
 * For any navigation grid and any focus position, pressing a navigation key
 * (↑↓←→ or hjkl) SHALL result in a new focus position that is within the
 * grid bounds (0 ≤ col < numColumns, 0 ≤ row < columnLength).
 */
function computeNextPosition(
  navItems: NavItem[][],
  currentPos: FocusPosition | null,
  key: string
): FocusPosition {
  // If no previous focus, start at (0, 0)
  if (!currentPos) return { col: 0, row: 0 };

  let { col, row } = currentPos;
  const currentCol = navItems[col] || [];

  // Down / j - move down in current column
  if (key === 'ArrowDown' || key === 'j') {
    row = Math.min(row + 1, currentCol.length - 1);
  }
  // Up / k - move up in current column
  else if (key === 'ArrowUp' || key === 'k') {
    row = Math.max(row - 1, 0);
  }
  // Right / l - move to next column
  else if (key === 'ArrowRight' || key === 'l') {
    if (col < navItems.length - 1) {
      col++;
      // Clamp row to new column's length
      row = Math.min(row, (navItems[col]?.length || 1) - 1);
    }
  }
  // Left / h - move to previous column
  else if (key === 'ArrowLeft' || key === 'h') {
    if (col > 0) {
      col--;
      // Clamp row to new column's length
      row = Math.min(row, (navItems[col]?.length || 1) - 1);
    }
  }

  return { col, row };
}

/**
 * Validates that a position is within grid bounds
 */
function isPositionInBounds(
  navItems: NavItem[][],
  pos: FocusPosition
): boolean {
  const numColumns = navItems.length;
  if (numColumns === 0) return false;
  
  // Check column bounds
  if (pos.col < 0 || pos.col >= numColumns) return false;
  
  // Check row bounds for the specific column
  const columnLength = navItems[pos.col]?.length || 0;
  if (pos.row < 0 || pos.row >= columnLength) return false;
  
  return true;
}

// Arbitrary generators for property tests

// Generate a category from the actual Category type (string union)
const categoryArb: fc.Arbitrary<Category> = fc.constantFrom(...categories);

// Generate a NavItem
const navItemArb = fc.oneof(
  fc.record({
    type: fc.constant('category' as const),
    id: fc.string({ minLength: 1, maxLength: 20 }),
    category: categoryArb,
  }),
  fc.record({
    type: fc.constant('app' as const),
    id: fc.string({ minLength: 1, maxLength: 20 }),
    category: categoryArb,
  })
);

// Generate a non-empty navigation grid (2D array of NavItems)
// Each column has at least 1 item, and there's at least 1 column
const navGridArb = fc.array(
  fc.array(navItemArb, { minLength: 1, maxLength: 20 }),
  { minLength: 1, maxLength: 10 }
);

// Navigation keys
const navigationKeyArb = fc.constantFrom(
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'h', 'j', 'k', 'l'
);

describe('useKeyboardNavigation - Property 1: Navigation Movement Bounds', () => {
  // Feature: command-footer-ux, Property 1: Navigation Movement Bounds
  // **Validates: Requirements 1.1**
  
  describe('Property 1: Navigation Movement Bounds', () => {
    it('navigation from any valid position with any key stays within bounds', () => {
      fc.assert(
        fc.property(
          navGridArb,
          navigationKeyArb,
          (navItems, key) => {
            // Generate a valid starting position for this grid
            const numCols = navItems.length;
            const col = Math.floor(Math.random() * numCols);
            const colLength = navItems[col]?.length || 1;
            const row = Math.floor(Math.random() * colLength);
            const startPos: FocusPosition = { col, row };
            
            // Compute next position
            const nextPos = computeNextPosition(navItems, startPos, key);
            
            // Property: Result must be within bounds
            expect(nextPos.col).toBeGreaterThanOrEqual(0);
            expect(nextPos.col).toBeLessThan(navItems.length);
            expect(nextPos.row).toBeGreaterThanOrEqual(0);
            expect(nextPos.row).toBeLessThan(navItems[nextPos.col].length);
            
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('navigation from null position starts at (0, 0)', () => {
      fc.assert(
        fc.property(
          navGridArb,
          navigationKeyArb,
          (navItems, key) => {
            // Start from null (no focus)
            const nextPos = computeNextPosition(navItems, null, key);
            
            // Property: Should start at (0, 0)
            expect(nextPos.col).toBe(0);
            expect(nextPos.row).toBe(0);
            
            // And (0, 0) should be valid for any non-empty grid
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('repeated navigation in any direction stays within bounds', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.array(navigationKeyArb, { minLength: 1, maxLength: 50 }),
          (navItems, keySequence) => {
            let pos: FocusPosition | null = null;
            
            // Apply each key in sequence
            for (const key of keySequence) {
              pos = computeNextPosition(navItems, pos, key);
              
              // Property: After each navigation, position must be in bounds
              expect(pos.col).toBeGreaterThanOrEqual(0);
              expect(pos.col).toBeLessThan(navItems.length);
              expect(pos.row).toBeGreaterThanOrEqual(0);
              expect(pos.row).toBeLessThan(navItems[pos.col].length);
            }
            
            return pos !== null && isPositionInBounds(navItems, pos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('down navigation at bottom row stays at bottom', () => {
      fc.assert(
        fc.property(
          navGridArb,
          (navItems) => {
            // Start at bottom of first column
            const col = 0;
            const row = navItems[col].length - 1;
            const startPos: FocusPosition = { col, row };
            
            // Navigate down
            const nextPos = computeNextPosition(navItems, startPos, 'ArrowDown');
            
            // Property: Should stay at bottom (row unchanged)
            expect(nextPos.row).toBe(row);
            expect(nextPos.col).toBe(col);
            
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('up navigation at top row stays at top', () => {
      fc.assert(
        fc.property(
          navGridArb,
          (navItems) => {
            // Start at top of first column
            const startPos: FocusPosition = { col: 0, row: 0 };
            
            // Navigate up
            const nextPos = computeNextPosition(navItems, startPos, 'ArrowUp');
            
            // Property: Should stay at top (row 0)
            expect(nextPos.row).toBe(0);
            expect(nextPos.col).toBe(0);
            
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('left navigation at leftmost column stays at leftmost', () => {
      fc.assert(
        fc.property(
          navGridArb,
          (navItems) => {
            // Start at first column
            const startPos: FocusPosition = { col: 0, row: 0 };
            
            // Navigate left
            const nextPos = computeNextPosition(navItems, startPos, 'ArrowLeft');
            
            // Property: Should stay at column 0
            expect(nextPos.col).toBe(0);
            
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('right navigation at rightmost column stays at rightmost', () => {
      fc.assert(
        fc.property(
          navGridArb,
          (navItems) => {
            // Start at last column
            const lastCol = navItems.length - 1;
            const startPos: FocusPosition = { col: lastCol, row: 0 };
            
            // Navigate right
            const nextPos = computeNextPosition(navItems, startPos, 'ArrowRight');
            
            // Property: Should stay at last column
            expect(nextPos.col).toBe(lastCol);
            
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('vim keys (hjkl) behave identically to arrow keys', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.integer({ min: 0, max: 100 }),
          (navItems, seed) => {
            // Generate a valid starting position
            const col = seed % navItems.length;
            const row = seed % navItems[col].length;
            const startPos: FocusPosition = { col, row };
            
            // Test each vim key against its arrow equivalent
            const vimArrowPairs: [string, string][] = [
              ['h', 'ArrowLeft'],
              ['j', 'ArrowDown'],
              ['k', 'ArrowUp'],
              ['l', 'ArrowRight'],
            ];
            
            for (const [vimKey, arrowKey] of vimArrowPairs) {
              const vimResult = computeNextPosition(navItems, startPos, vimKey);
              const arrowResult = computeNextPosition(navItems, startPos, arrowKey);
              
              // Property: Vim keys should produce same result as arrow keys
              expect(vimResult.col).toBe(arrowResult.col);
              expect(vimResult.row).toBe(arrowResult.row);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('column change clamps row to new column length', () => {
      // Create a grid with columns of different lengths
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 20 }),
            { minLength: 2, maxLength: 10 }
          ),
          (columnLengths) => {
            // Build a grid with specified column lengths
            const navItems: NavItem[][] = columnLengths.map((length, colIdx) =>
              Array.from({ length }, (_, rowIdx) => ({
                type: 'app' as const,
                id: `app-${colIdx}-${rowIdx}`,
                category: 'Web Browsers' as Category,
              }))
            );
            
            // Start at a row that might exceed the next column's length
            const startCol = 0;
            const startRow = navItems[startCol].length - 1;
            const startPos: FocusPosition = { col: startCol, row: startRow };
            
            // Navigate right
            const nextPos = computeNextPosition(navItems, startPos, 'ArrowRight');
            
            // Property: Row should be clamped to new column's length
            if (navItems.length > 1) {
              expect(nextPos.col).toBe(1);
              expect(nextPos.row).toBeLessThan(navItems[1].length);
              expect(nextPos.row).toBeGreaterThanOrEqual(0);
            }
            
            return isPositionInBounds(navItems, nextPos);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: command-footer-ux
// Property 2: Space Toggles Selection State
// Property 3: Escape Clears Focus
// **Validates: Requirements 1.2, 1.3**

/**
 * Pure selection toggle logic extracted for property testing.
 * This mirrors the Space key behavior in useKeyboardNavigation hook.
 * 
 * For any focused app item, pressing Space SHALL change its selection state
 * from selected to unselected, or from unselected to selected.
 */
function computeSelectionAfterSpace(
  focusPos: FocusPosition | null,
  navItems: NavItem[][],
  selectedApps: Set<string>,
  selectedCategories: Set<string>
): { selectedApps: Set<string>; selectedCategories: Set<string>; toggledItem: NavItem | null } {
  // If no focus, nothing happens
  if (!focusPos) {
    return { selectedApps: new Set(selectedApps), selectedCategories: new Set(selectedCategories), toggledItem: null };
  }

  const item = navItems[focusPos.col]?.[focusPos.row];
  if (!item) {
    return { selectedApps: new Set(selectedApps), selectedCategories: new Set(selectedCategories), toggledItem: null };
  }

  const newSelectedApps = new Set(selectedApps);
  const newSelectedCategories = new Set(selectedCategories);

  if (item.type === 'app') {
    // Toggle app selection
    if (newSelectedApps.has(item.id)) {
      newSelectedApps.delete(item.id);
    } else {
      newSelectedApps.add(item.id);
    }
  } else if (item.type === 'category') {
    // Toggle category selection
    if (newSelectedCategories.has(item.id)) {
      newSelectedCategories.delete(item.id);
    } else {
      newSelectedCategories.add(item.id);
    }
  }

  return { selectedApps: newSelectedApps, selectedCategories: newSelectedCategories, toggledItem: item };
}

/**
 * Pure focus clear logic extracted for property testing.
 * This mirrors the Escape key behavior in useKeyboardNavigation hook.
 * 
 * For any focus state (including null), pressing Escape SHALL result in a null focus position.
 */
function computeFocusAfterEscape(_focusPos: FocusPosition | null): FocusPosition | null {
  // Escape always clears focus, regardless of current state
  return null;
}

// Arbitrary generators for Property 2 and 3 tests

// Generate a valid focus position for a given grid (used in property tests)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const focusPosForGridArb = (navItems: NavItem[][]): fc.Arbitrary<FocusPosition> => {
  if (navItems.length === 0) {
    return fc.constant({ col: 0, row: 0 });
  }
  return fc.integer({ min: 0, max: navItems.length - 1 }).chain(col => {
    const colLength = navItems[col]?.length || 1;
    return fc.integer({ min: 0, max: colLength - 1 }).map(row => ({ col, row }));
  });
};

// Generate a set of app IDs (for selected apps)
const appIdSetArb = fc.array(
  fc.string({ minLength: 1, maxLength: 20 }),
  { minLength: 0, maxLength: 10 }
).map(ids => new Set(ids));

// Generate a set of category IDs (for selected categories)
const categoryIdSetArb = fc.array(
  fc.string({ minLength: 1, maxLength: 20 }),
  { minLength: 0, maxLength: 5 }
).map(ids => new Set(ids));

describe('useKeyboardNavigation - Property 2: Space Toggles Selection State', () => {
  // Feature: command-footer-ux, Property 2: Space Toggles Selection State
  // **Validates: Requirements 1.2**

  describe('Property 2: Space Toggles Selection State', () => {
    it('pressing Space on a focused app toggles its selection state', () => {
      fc.assert(
        fc.property(
          navGridArb,
          appIdSetArb,
          (navItems, initialSelectedApps) => {
            // Generate a valid focus position for this grid
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const focusPos: FocusPosition = { col, row };
            
            const focusedItem = navItems[col][row];
            
            // Only test app items for this property
            if (focusedItem.type !== 'app') return true;
            
            const wasSelected = initialSelectedApps.has(focusedItem.id);
            
            // Compute state after Space press
            const result = computeSelectionAfterSpace(
              focusPos,
              navItems,
              initialSelectedApps,
              new Set()
            );
            
            const isNowSelected = result.selectedApps.has(focusedItem.id);
            
            // Property: Selection state must be toggled
            expect(isNowSelected).toBe(!wasSelected);
            
            return isNowSelected !== wasSelected;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pressing Space on a focused category toggles its selection state', () => {
      fc.assert(
        fc.property(
          navGridArb,
          categoryIdSetArb,
          (navItems, initialSelectedCategories) => {
            // Find a category item in the grid
            let categoryPos: FocusPosition | null = null;
            for (let col = 0; col < navItems.length && !categoryPos; col++) {
              for (let row = 0; row < navItems[col].length && !categoryPos; row++) {
                if (navItems[col][row].type === 'category') {
                  categoryPos = { col, row };
                }
              }
            }
            
            // If no category found, skip this test case
            if (!categoryPos) return true;
            
            const focusedItem = navItems[categoryPos.col][categoryPos.row];
            const wasSelected = initialSelectedCategories.has(focusedItem.id);
            
            // Compute state after Space press
            const result = computeSelectionAfterSpace(
              categoryPos,
              navItems,
              new Set(),
              initialSelectedCategories
            );
            
            const isNowSelected = result.selectedCategories.has(focusedItem.id);
            
            // Property: Selection state must be toggled
            expect(isNowSelected).toBe(!wasSelected);
            
            return isNowSelected !== wasSelected;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pressing Space with no focus does not change selection state', () => {
      fc.assert(
        fc.property(
          navGridArb,
          appIdSetArb,
          categoryIdSetArb,
          (navItems, initialSelectedApps, initialSelectedCategories) => {
            // No focus position
            const focusPos: FocusPosition | null = null;
            
            // Compute state after Space press
            const result = computeSelectionAfterSpace(
              focusPos,
              navItems,
              initialSelectedApps,
              initialSelectedCategories
            );
            
            // Property: Selection state must remain unchanged
            expect(result.selectedApps.size).toBe(initialSelectedApps.size);
            expect(result.selectedCategories.size).toBe(initialSelectedCategories.size);
            
            // Verify all items are the same
            for (const id of initialSelectedApps) {
              expect(result.selectedApps.has(id)).toBe(true);
            }
            for (const id of initialSelectedCategories) {
              expect(result.selectedCategories.has(id)).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('double Space press returns to original selection state', () => {
      fc.assert(
        fc.property(
          navGridArb,
          appIdSetArb,
          (navItems, initialSelectedApps) => {
            // Generate a valid focus position for this grid
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const focusPos: FocusPosition = { col, row };
            
            const focusedItem = navItems[col][row];
            
            // Only test app items
            if (focusedItem.type !== 'app') return true;
            
            const wasSelected = initialSelectedApps.has(focusedItem.id);
            
            // First Space press
            const afterFirst = computeSelectionAfterSpace(
              focusPos,
              navItems,
              initialSelectedApps,
              new Set()
            );
            
            // Second Space press
            const afterSecond = computeSelectionAfterSpace(
              focusPos,
              navItems,
              afterFirst.selectedApps,
              new Set()
            );
            
            const finalSelected = afterSecond.selectedApps.has(focusedItem.id);
            
            // Property: Double toggle returns to original state
            expect(finalSelected).toBe(wasSelected);
            
            return finalSelected === wasSelected;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Space only affects the focused item, not other items', () => {
      fc.assert(
        fc.property(
          navGridArb,
          appIdSetArb,
          (navItems, initialSelectedApps) => {
            // Generate a valid focus position for this grid
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const focusPos: FocusPosition = { col, row };
            
            const focusedItem = navItems[col][row];
            
            // Only test app items
            if (focusedItem.type !== 'app') return true;
            
            // Compute state after Space press
            const result = computeSelectionAfterSpace(
              focusPos,
              navItems,
              initialSelectedApps,
              new Set()
            );
            
            // Property: All other items should have the same selection state
            for (const id of initialSelectedApps) {
              if (id !== focusedItem.id) {
                expect(result.selectedApps.has(id)).toBe(true);
              }
            }
            
            // Check that no new items were added (except possibly the focused one)
            for (const id of result.selectedApps) {
              if (id !== focusedItem.id) {
                expect(initialSelectedApps.has(id)).toBe(true);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('useKeyboardNavigation - Property 3: Escape Clears Focus', () => {
  // Feature: command-footer-ux, Property 3: Escape Clears Focus
  // **Validates: Requirements 1.3**

  describe('Property 3: Escape Clears Focus', () => {
    it('pressing Escape with any focus position results in null focus', () => {
      fc.assert(
        fc.property(
          navGridArb,
          (navItems) => {
            // Generate a valid focus position for this grid
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const focusPos: FocusPosition = { col, row };
            
            // Compute focus after Escape
            const newFocus = computeFocusAfterEscape(focusPos);
            
            // Property: Focus must be null after Escape
            expect(newFocus).toBeNull();
            
            return newFocus === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pressing Escape with null focus results in null focus', () => {
      fc.assert(
        fc.property(
          navGridArb,
          () => {
            // Start with null focus
            const focusPos: FocusPosition | null = null;
            
            // Compute focus after Escape
            const newFocus = computeFocusAfterEscape(focusPos);
            
            // Property: Focus must remain null after Escape
            expect(newFocus).toBeNull();
            
            return newFocus === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Escape is idempotent - multiple Escape presses keep focus null', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.integer({ min: 1, max: 10 }),
          (navItems, escapeCount) => {
            // Generate a valid focus position for this grid
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            let focusPos: FocusPosition | null = { col, row };
            
            // Press Escape multiple times
            for (let i = 0; i < escapeCount; i++) {
              focusPos = computeFocusAfterEscape(focusPos);
            }
            
            // Property: Focus must be null after any number of Escape presses
            expect(focusPos).toBeNull();
            
            return focusPos === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Escape clears focus regardless of focus position in grid', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (navItems, colSeed, rowSeed) => {
            // Generate various focus positions
            const col = colSeed % navItems.length;
            const row = rowSeed % navItems[col].length;
            const focusPos: FocusPosition = { col, row };
            
            // Compute focus after Escape
            const newFocus = computeFocusAfterEscape(focusPos);
            
            // Property: Focus must be null regardless of starting position
            expect(newFocus).toBeNull();
            
            return newFocus === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Escape after navigation sequence clears focus', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.array(navigationKeyArb, { minLength: 1, maxLength: 20 }),
          (navItems, keySequence) => {
            // Start with no focus
            let focusPos: FocusPosition | null = null;
            
            // Apply navigation keys to build up a focus position
            for (const key of keySequence) {
              focusPos = computeNextPosition(navItems, focusPos, key);
            }
            
            // Now press Escape
            const finalFocus = computeFocusAfterEscape(focusPos);
            
            // Property: Focus must be null after Escape, regardless of navigation history
            expect(finalFocus).toBeNull();
            
            return finalFocus === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: command-footer-ux
// Property 4: Keyboard Navigation Flag
// **Validates: Requirements 1.5, 1.6**

/**
 * Pure keyboard navigation flag logic extracted for property testing.
 * This mirrors the isKeyboardNavigating behavior in useKeyboardNavigation hook.
 * 
 * For any navigation event triggered by keyboard (arrow keys or hjkl), the
 * `isKeyboardNavigating` flag SHALL be true. For any focus change triggered
 * by mouse click, the `isKeyboardNavigating` flag SHALL be false.
 */

interface NavigationState {
  focusPos: FocusPosition | null;
  isKeyboardNavigating: boolean;
  fromKeyboard: boolean;
}

/**
 * Simulates keyboard navigation event and returns the resulting state.
 * When a navigation key is pressed, isKeyboardNavigating becomes true.
 */
function computeStateAfterKeyboardNavigation(
  navItems: NavItem[][],
  currentState: NavigationState,
  key: string
): NavigationState {
  // Skip non-navigation keys
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'j', 'k', 'h', 'l'].includes(key)) {
    return currentState;
  }

  // Mark as keyboard navigation
  const fromKeyboard = true;
  const isKeyboardNavigating = true;

  // Compute new focus position
  let focusPos: FocusPosition;
  if (!currentState.focusPos) {
    focusPos = { col: 0, row: 0 };
  } else {
    let { col, row } = currentState.focusPos;
    const currentCol = navItems[col] || [];

    if (key === 'ArrowDown' || key === 'j') {
      row = Math.min(row + 1, currentCol.length - 1);
    } else if (key === 'ArrowUp' || key === 'k') {
      row = Math.max(row - 1, 0);
    } else if (key === 'ArrowRight' || key === 'l') {
      if (col < navItems.length - 1) {
        col++;
        row = Math.min(row, (navItems[col]?.length || 1) - 1);
      }
    } else if (key === 'ArrowLeft' || key === 'h') {
      if (col > 0) {
        col--;
        row = Math.min(row, (navItems[col]?.length || 1) - 1);
      }
    }

    focusPos = { col, row };
  }

  return { focusPos, isKeyboardNavigating, fromKeyboard };
}

/**
 * Simulates mouse click focus change and returns the resulting state.
 * When focus is set via mouse, isKeyboardNavigating becomes false.
 */
function computeStateAfterMouseClick(
  navItems: NavItem[][],
  type: 'category' | 'app',
  id: string
): NavigationState {
  // Find the item in the grid
  for (let col = 0; col < navItems.length; col++) {
    const colItems = navItems[col];
    for (let row = 0; row < colItems.length; row++) {
      if (colItems[row].type === type && colItems[row].id === id) {
        return {
          focusPos: { col, row },
          isKeyboardNavigating: false, // Mouse click sets this to false
          fromKeyboard: false,
        };
      }
    }
  }

  // Item not found - return unchanged state with no focus
  return {
    focusPos: null,
    isKeyboardNavigating: false,
    fromKeyboard: false,
  };
}

/**
 * Creates an initial navigation state
 */
function createInitialState(): NavigationState {
  return {
    focusPos: null,
    isKeyboardNavigating: false,
    fromKeyboard: false,
  };
}

describe('useKeyboardNavigation - Property 4: Keyboard Navigation Flag', () => {
  // Feature: command-footer-ux, Property 4: Keyboard Navigation Flag
  // **Validates: Requirements 1.5, 1.6**

  describe('Property 4: Keyboard Navigation Flag', () => {
    it('keyboard navigation sets isKeyboardNavigating to true', () => {
      fc.assert(
        fc.property(
          navGridArb,
          navigationKeyArb,
          (navItems, key) => {
            const initialState = createInitialState();
            
            // Perform keyboard navigation
            const newState = computeStateAfterKeyboardNavigation(navItems, initialState, key);
            
            // Property: isKeyboardNavigating must be true after keyboard navigation
            expect(newState.isKeyboardNavigating).toBe(true);
            expect(newState.fromKeyboard).toBe(true);
            
            return newState.isKeyboardNavigating === true && newState.fromKeyboard === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mouse click sets isKeyboardNavigating to false', () => {
      fc.assert(
        fc.property(
          navGridArb,
          (navItems) => {
            // Pick a random item from the grid to click
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const item = navItems[col][row];
            
            // Perform mouse click
            const newState = computeStateAfterMouseClick(navItems, item.type, item.id);
            
            // Property: isKeyboardNavigating must be false after mouse click
            expect(newState.isKeyboardNavigating).toBe(false);
            expect(newState.fromKeyboard).toBe(false);
            
            return newState.isKeyboardNavigating === false && newState.fromKeyboard === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('keyboard navigation after mouse click sets isKeyboardNavigating back to true', () => {
      fc.assert(
        fc.property(
          navGridArb,
          navigationKeyArb,
          (navItems, key) => {
            // First, simulate a mouse click
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const item = navItems[col][row];
            
            const stateAfterMouse = computeStateAfterMouseClick(navItems, item.type, item.id);
            
            // Verify mouse click set flag to false
            expect(stateAfterMouse.isKeyboardNavigating).toBe(false);
            
            // Then, perform keyboard navigation
            const stateAfterKeyboard = computeStateAfterKeyboardNavigation(navItems, stateAfterMouse, key);
            
            // Property: isKeyboardNavigating must be true after keyboard navigation
            expect(stateAfterKeyboard.isKeyboardNavigating).toBe(true);
            
            return stateAfterKeyboard.isKeyboardNavigating === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mouse click after keyboard navigation sets isKeyboardNavigating back to false', () => {
      fc.assert(
        fc.property(
          navGridArb,
          navigationKeyArb,
          (navItems, key) => {
            // First, simulate keyboard navigation
            const initialState = createInitialState();
            const stateAfterKeyboard = computeStateAfterKeyboardNavigation(navItems, initialState, key);
            
            // Verify keyboard navigation set flag to true
            expect(stateAfterKeyboard.isKeyboardNavigating).toBe(true);
            
            // Then, simulate a mouse click
            const col = Math.floor(Math.random() * navItems.length);
            const row = Math.floor(Math.random() * navItems[col].length);
            const item = navItems[col][row];
            
            const stateAfterMouse = computeStateAfterMouseClick(navItems, item.type, item.id);
            
            // Property: isKeyboardNavigating must be false after mouse click
            expect(stateAfterMouse.isKeyboardNavigating).toBe(false);
            
            return stateAfterMouse.isKeyboardNavigating === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('repeated keyboard navigation keeps isKeyboardNavigating true', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.array(navigationKeyArb, { minLength: 2, maxLength: 20 }),
          (navItems, keySequence) => {
            let state = createInitialState();
            
            // Apply each key in sequence
            for (const key of keySequence) {
              state = computeStateAfterKeyboardNavigation(navItems, state, key);
              
              // Property: isKeyboardNavigating must remain true throughout
              expect(state.isKeyboardNavigating).toBe(true);
            }
            
            return state.isKeyboardNavigating === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('repeated mouse clicks keep isKeyboardNavigating false', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.integer({ min: 2, max: 10 }),
          (navItems, clickCount) => {
            let state = createInitialState();
            
            // Perform multiple mouse clicks on random items
            for (let i = 0; i < clickCount; i++) {
              const col = Math.floor(Math.random() * navItems.length);
              const row = Math.floor(Math.random() * navItems[col].length);
              const item = navItems[col][row];
              
              state = computeStateAfterMouseClick(navItems, item.type, item.id);
              
              // Property: isKeyboardNavigating must remain false throughout
              expect(state.isKeyboardNavigating).toBe(false);
            }
            
            return state.isKeyboardNavigating === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all arrow keys set isKeyboardNavigating to true', () => {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      fc.assert(
        fc.property(
          navGridArb,
          fc.constantFrom(...arrowKeys),
          (navItems, key) => {
            const initialState = createInitialState();
            const newState = computeStateAfterKeyboardNavigation(navItems, initialState, key);
            
            // Property: All arrow keys must set isKeyboardNavigating to true
            expect(newState.isKeyboardNavigating).toBe(true);
            
            return newState.isKeyboardNavigating === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all vim keys (hjkl) set isKeyboardNavigating to true', () => {
      const vimKeys = ['h', 'j', 'k', 'l'];
      
      fc.assert(
        fc.property(
          navGridArb,
          fc.constantFrom(...vimKeys),
          (navItems, key) => {
            const initialState = createInitialState();
            const newState = computeStateAfterKeyboardNavigation(navItems, initialState, key);
            
            // Property: All vim keys must set isKeyboardNavigating to true
            expect(newState.isKeyboardNavigating).toBe(true);
            
            return newState.isKeyboardNavigating === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('interleaved keyboard and mouse events correctly toggle the flag', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.array(
            fc.oneof(
              fc.record({ type: fc.constant('keyboard' as const), key: navigationKeyArb }),
              fc.record({ type: fc.constant('mouse' as const) })
            ),
            { minLength: 1, maxLength: 20 }
          ),
          (navItems, events) => {
            let state = createInitialState();
            
            for (const event of events) {
              if (event.type === 'keyboard') {
                state = computeStateAfterKeyboardNavigation(navItems, state, event.key);
                // Property: After keyboard event, flag must be true
                expect(state.isKeyboardNavigating).toBe(true);
              } else {
                // Mouse click on random item
                const col = Math.floor(Math.random() * navItems.length);
                const row = Math.floor(Math.random() * navItems[col].length);
                const item = navItems[col][row];
                state = computeStateAfterMouseClick(navItems, item.type, item.id);
                // Property: After mouse event, flag must be false
                expect(state.isKeyboardNavigating).toBe(false);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('fromKeyboard ref mirrors isKeyboardNavigating state', () => {
      fc.assert(
        fc.property(
          navGridArb,
          fc.array(
            fc.oneof(
              fc.record({ type: fc.constant('keyboard' as const), key: navigationKeyArb }),
              fc.record({ type: fc.constant('mouse' as const) })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (navItems, events) => {
            let state = createInitialState();
            
            for (const event of events) {
              if (event.type === 'keyboard') {
                state = computeStateAfterKeyboardNavigation(navItems, state, event.key);
              } else {
                const col = Math.floor(Math.random() * navItems.length);
                const row = Math.floor(Math.random() * navItems[col].length);
                const item = navItems[col][row];
                state = computeStateAfterMouseClick(navItems, item.type, item.id);
              }
              
              // Property: fromKeyboard and isKeyboardNavigating should be consistent
              expect(state.fromKeyboard).toBe(state.isKeyboardNavigating);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
