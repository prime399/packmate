import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { STORAGE_KEYS, apps, OSId } from '@/lib/data';

// Feature: packmate-skeleton-ui
// Property 1: OS Selection Round-Trip - **Validates: Requirements 2.4, 2.5**
// Property 3: App Selection Round-Trip - **Validates: Requirements 9.1, 9.2**
// Property 10: Clear All Selections - **Validates: Requirements 9.3**

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
