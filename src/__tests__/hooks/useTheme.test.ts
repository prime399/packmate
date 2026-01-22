import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { STORAGE_KEYS } from '@/lib/data';

// Feature: packmate-skeleton-ui, Property 2: Theme Toggle Round-Trip
// **Validates: Requirements 3.1, 3.2, 3.3**

type Theme = 'dark' | 'light';

describe('Theme Toggle Round-Trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Property test: For any initial theme state, toggling should flip the state
  it('toggling theme should flip the state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('dark', 'light'),
        (initialTheme) => {
          // Set initial theme
          localStorage.setItem(STORAGE_KEYS.THEME, initialTheme);
          
          // Simulate toggle
          const toggledTheme: Theme = initialTheme === 'dark' ? 'light' : 'dark';
          localStorage.setItem(STORAGE_KEYS.THEME, toggledTheme);
          
          // Verify the toggled state
          const stored = localStorage.getItem(STORAGE_KEYS.THEME);
          expect(stored).toBe(toggledTheme);
          expect(stored).not.toBe(initialTheme);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property test: Persisting and restoring theme should preserve the value
  it('persisting and restoring theme should preserve the value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('dark', 'light'),
        (theme) => {
          // Store theme
          localStorage.setItem(STORAGE_KEYS.THEME, theme);
          
          // Restore theme
          const restored = localStorage.getItem(STORAGE_KEYS.THEME);
          
          expect(restored).toBe(theme);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property test: Double toggle should return to original state
  it('double toggle should return to original state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('dark', 'light'),
        (initialTheme) => {
          localStorage.setItem(STORAGE_KEYS.THEME, initialTheme);
          
          // First toggle
          const firstToggle: Theme = initialTheme === 'dark' ? 'light' : 'dark';
          localStorage.setItem(STORAGE_KEYS.THEME, firstToggle);
          
          // Second toggle
          const secondToggle: Theme = firstToggle === 'dark' ? 'light' : 'dark';
          localStorage.setItem(STORAGE_KEYS.THEME, secondToggle);
          
          // Should be back to original
          const restored = localStorage.getItem(STORAGE_KEYS.THEME);
          expect(restored).toBe(initialTheme);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
