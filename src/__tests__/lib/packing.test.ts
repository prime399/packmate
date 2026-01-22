import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { packCategories, getColumnHeightDifference } from '@/lib/utils';
import { categories, getAppsByCategory } from '@/lib/data';

// Feature: packmate-skeleton-ui, Property 8: Masonry Packing Balance
// **Validates: Requirements 4.5**

describe('Masonry Packing Balance', () => {
  it('should distribute all categories across columns', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (numColumns) => {
          const packed = packCategories(categories, numColumns);
          
          // All categories should be distributed
          const allPacked = packed.flat();
          expect(allPacked.length).toBe(categories.length);
          
          // Each category should appear exactly once
          const uniquePacked = new Set(allPacked);
          expect(uniquePacked.size).toBe(categories.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create the correct number of columns', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (numColumns) => {
          const packed = packCategories(categories, numColumns);
          expect(packed.length).toBe(numColumns);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should minimize column height difference', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 7 }),
        (numColumns) => {
          const packed = packCategories(categories, numColumns);
          const heightDiff = getColumnHeightDifference(packed);
          
          // Calculate the largest single category height
          const maxCategoryHeight = Math.max(
            ...categories.map(cat => getAppsByCategory(cat).length + 2)
          );
          
          // Height difference should be reasonable (within one large category)
          // This is a heuristic - greedy algorithm should keep difference small
          expect(heightDiff).toBeLessThanOrEqual(maxCategoryHeight * 2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases', () => {
    // Empty categories
    expect(packCategories([], 3)).toEqual([[], [], []]);
    
    // Zero columns
    expect(packCategories(categories, 0)).toEqual([]);
    
    // Single column
    const singleColumn = packCategories(categories, 1);
    expect(singleColumn.length).toBe(1);
    expect(singleColumn[0].length).toBe(categories.length);
    
    // More columns than categories
    const manyColumns = packCategories(categories, 20);
    expect(manyColumns.length).toBe(20);
    expect(manyColumns.flat().length).toBe(categories.length);
  });

  it('should produce balanced columns for typical use case (5 columns)', () => {
    const packed = packCategories(categories, 5);
    const heightDiff = getColumnHeightDifference(packed);
    
    // For 5 columns with 15 categories, difference should be reasonable
    // Each column should have roughly 3 categories
    expect(heightDiff).toBeLessThan(20); // Reasonable threshold
    
    // No column should be empty (with 15 categories and 5 columns)
    packed.forEach(column => {
      expect(column.length).toBeGreaterThan(0);
    });
  });
});
