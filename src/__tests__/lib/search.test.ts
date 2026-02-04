/**
 * Tests for search utility module
 * Feature: smart-search
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  normalizeQuery,
  matchesApp,
  filterApps,
  filterCategories,
  getFilteredAppsByCategory,
} from '@/lib/search';
import { AppData, Category, apps, categories } from '@/lib/data';

// Configure fast-check for 100+ iterations
fc.configureGlobal({ numRuns: 100 });

// Arbitrary for generating valid app-like objects
const appArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  category: fc.constantFrom(...categories) as fc.Arbitrary<Category>,
  icon: fc.constant('TestIcon'),
  targets: fc.constant({}),
});

describe('normalizeQuery', () => {
  describe('unit tests', () => {
    it('should convert to lowercase', () => {
      expect(normalizeQuery('FIREFOX')).toBe('firefox');
      expect(normalizeQuery('FireFox')).toBe('firefox');
    });

    it('should trim whitespace', () => {
      expect(normalizeQuery('  firefox  ')).toBe('firefox');
      expect(normalizeQuery('\tfirefox\n')).toBe('firefox');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeQuery('fire   fox')).toBe('fire fox');
      expect(normalizeQuery('a  b   c')).toBe('a b c');
    });

    it('should handle empty string', () => {
      expect(normalizeQuery('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(normalizeQuery('   ')).toBe('');
      expect(normalizeQuery('\t\n')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(normalizeQuery(null as unknown as string)).toBe('');
      expect(normalizeQuery(undefined as unknown as string)).toBe('');
    });
  });

  describe('property tests', () => {
    /**
     * Property 7: Query Normalization Consistency
     * Validates: Requirements 8.1, 8.2, 8.3
     * 
     * For any search query, searching with different case variations or
     * with added leading/trailing whitespace shall return the same normalized result.
     */
    it('Property 7: Query Normalization Consistency - case variations produce same result', () => {
      fc.assert(
        fc.property(fc.string(), (query) => {
          const normalized = normalizeQuery(query);
          const upperNormalized = normalizeQuery(query.toUpperCase());
          const lowerNormalized = normalizeQuery(query.toLowerCase());
          
          // All case variations should produce the same normalized result
          expect(normalized).toBe(upperNormalized);
          expect(normalized).toBe(lowerNormalized);
        })
      );
    });

    it('Property 7: Query Normalization Consistency - whitespace variations produce same result', () => {
      fc.assert(
        fc.property(fc.string(), (query) => {
          const normalized = normalizeQuery(query);
          const withLeadingSpace = normalizeQuery('  ' + query);
          const withTrailingSpace = normalizeQuery(query + '  ');
          const withBothSpaces = normalizeQuery('  ' + query + '  ');
          
          // All whitespace variations should produce the same normalized result
          expect(normalized).toBe(withLeadingSpace);
          expect(normalized).toBe(withTrailingSpace);
          expect(normalized).toBe(withBothSpaces);
        })
      );
    });

    it('Property 7: Query Normalization Consistency - result is always lowercase', () => {
      fc.assert(
        fc.property(fc.string(), (query) => {
          const normalized = normalizeQuery(query);
          expect(normalized).toBe(normalized.toLowerCase());
        })
      );
    });

    it('Property 7: Query Normalization Consistency - result has no leading/trailing whitespace', () => {
      fc.assert(
        fc.property(fc.string(), (query) => {
          const normalized = normalizeQuery(query);
          expect(normalized).toBe(normalized.trim());
        })
      );
    });
  });
});


describe('matchesApp', () => {
  const testApp: AppData = {
    name: 'Firefox',
    description: 'A fast and secure web browser',
    category: 'Internet',
    icon: 'Firefox',
    targets: {},
  };

  describe('unit tests', () => {
    it('should match by name (case-insensitive)', () => {
      expect(matchesApp(testApp, 'firefox')).toBe(true);
      expect(matchesApp(testApp, 'fire')).toBe(true);
      expect(matchesApp(testApp, 'fox')).toBe(true);
    });

    it('should match by description', () => {
      expect(matchesApp(testApp, 'browser')).toBe(true);
      expect(matchesApp(testApp, 'secure')).toBe(true);
      expect(matchesApp(testApp, 'web')).toBe(true);
    });

    it('should match by category', () => {
      expect(matchesApp(testApp, 'internet')).toBe(true);
      expect(matchesApp(testApp, 'inter')).toBe(true);
    });

    it('should return true for empty query', () => {
      expect(matchesApp(testApp, '')).toBe(true);
    });

    it('should return false for non-matching query', () => {
      expect(matchesApp(testApp, 'xyz123')).toBe(false);
      expect(matchesApp(testApp, 'chrome')).toBe(false);
    });
  });
});

describe('filterApps', () => {
  describe('unit tests', () => {
    it('should return all apps for empty query', () => {
      const result = filterApps(apps, '');
      expect(result).toEqual(apps);
    });

    it('should return all apps for whitespace-only query', () => {
      const result = filterApps(apps, '   ');
      expect(result).toEqual(apps);
    });

    it('should filter by name', () => {
      const result = filterApps(apps, 'firefox');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(app => 
        app.name.toLowerCase().includes('firefox') ||
        app.description.toLowerCase().includes('firefox') ||
        app.category.toLowerCase().includes('firefox')
      )).toBe(true);
    });

    it('should return empty array for non-matching query', () => {
      const result = filterApps(apps, 'xyznonexistent123456');
      expect(result).toEqual([]);
    });
  });

  describe('property tests', () => {
    /**
     * Property 1: All Returned Apps Match Query
     * Validates: Requirements 1.1, 2.1, 3.1, 4.1
     * 
     * For any non-empty search query and any app in the filtered results,
     * that app must match the query by having the normalized query as a
     * substring of its name, description, or category.
     */
    it('Property 1: All Returned Apps Match Query', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (query) => {
            const normalizedQuery = normalizeQuery(query);
            if (!normalizedQuery) return true; // Skip empty normalized queries
            
            const result = filterApps(apps, query);
            
            // Every returned app must match the query
            return result.every(app => {
              const nameMatch = app.name.toLowerCase().includes(normalizedQuery);
              const descMatch = app.description.toLowerCase().includes(normalizedQuery);
              const catMatch = app.category.toLowerCase().includes(normalizedQuery);
              return nameMatch || descMatch || catMatch;
            });
          }
        )
      );
    });

    /**
     * Property 2: Empty Query Returns All Apps
     * Validates: Requirements 1.2, 5.3
     * 
     * For any empty string or whitespace-only query, the filterApps function
     * shall return all apps from the catalog without filtering.
     */
    it('Property 2: Empty Query Returns All Apps', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 10 }),
          (whitespaceChars) => {
            const whitespaceQuery = whitespaceChars.join('');
            const result = filterApps(apps, whitespaceQuery);
            expect(result).toEqual(apps);
          }
        )
      );
    });

    /**
     * Property 3: Name Substring Inclusion
     * Validates: Requirements 2.1, 2.2, 2.3
     * 
     * For any app in the catalog and any non-empty substring of that app's name,
     * searching for that substring shall include that app in the results.
     */
    it('Property 3: Name Substring Inclusion', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...apps),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (app, startOffset, length) => {
            const name = app.name.toLowerCase();
            if (name.length === 0) return true;
            
            const start = startOffset % name.length;
            const end = Math.min(start + (length % name.length) + 1, name.length);
            const substring = name.slice(start, end);
            
            if (!substring) return true;
            
            const result = filterApps(apps, substring);
            expect(result).toContainEqual(app);
          }
        )
      );
    });

    /**
     * Property 4: Description Substring Inclusion
     * Validates: Requirements 3.1, 3.2, 3.3
     * 
     * For any app in the catalog and any non-empty substring of that app's description,
     * searching for that substring shall include that app in the results.
     */
    it('Property 4: Description Substring Inclusion', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...apps.filter(a => a.description.length > 0)),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (app, startOffset, length) => {
            const desc = app.description.toLowerCase();
            if (desc.length === 0) return true;
            
            const start = startOffset % desc.length;
            const end = Math.min(start + (length % desc.length) + 1, desc.length);
            const substring = desc.slice(start, end);
            
            if (!substring) return true;
            
            const result = filterApps(apps, substring);
            expect(result).toContainEqual(app);
          }
        )
      );
    });

    /**
     * Property 5: Category Substring Inclusion
     * Validates: Requirements 4.1, 4.2
     * 
     * For any app in the catalog and any non-empty substring of that app's category name,
     * searching for that substring shall include that app in the results.
     */
    it('Property 5: Category Substring Inclusion', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...apps),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (app, startOffset, length) => {
            const cat = app.category.toLowerCase();
            if (cat.length === 0) return true;
            
            const start = startOffset % cat.length;
            const end = Math.min(start + (length % cat.length) + 1, cat.length);
            const substring = cat.slice(start, end);
            
            if (!substring) return true;
            
            const result = filterApps(apps, substring);
            expect(result).toContainEqual(app);
          }
        )
      );
    });
  });
});


describe('filterCategories', () => {
  describe('unit tests', () => {
    it('should return all categories for empty query', () => {
      const result = filterCategories(categories, apps, '');
      expect(result).toEqual(categories);
    });

    it('should return only categories with matching apps', () => {
      const result = filterCategories(categories, apps, 'firefox');
      expect(result.length).toBeGreaterThan(0);
      
      // Each returned category should have at least one matching app
      result.forEach(category => {
        const categoryApps = apps.filter(app => app.category === category);
        const hasMatch = categoryApps.some(app => 
          app.name.toLowerCase().includes('firefox') ||
          app.description.toLowerCase().includes('firefox') ||
          app.category.toLowerCase().includes('firefox')
        );
        expect(hasMatch).toBe(true);
      });
    });

    it('should return empty array when no categories have matching apps', () => {
      const result = filterCategories(categories, apps, 'xyznonexistent123456');
      expect(result).toEqual([]);
    });
  });

  describe('property tests', () => {
    /**
     * Property 6: Filtered Categories Contain Only Matching Apps
     * Validates: Requirements 5.1, 5.2, 6.3
     * 
     * For any search query and any category in the filtered categories result,
     * that category must contain at least one app that matches the query.
     * Conversely, if a category contains no matching apps, it shall not appear
     * in the filtered categories.
     */
    it('Property 6: Filtered Categories Contain Only Matching Apps', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (query) => {
            const normalizedQuery = normalizeQuery(query);
            if (!normalizedQuery) return true;
            
            const filteredCats = filterCategories(categories, apps, query);
            const filteredAppsList = filterApps(apps, query);
            
            // Every filtered category must have at least one matching app
            filteredCats.forEach(category => {
              const categoryApps = filteredAppsList.filter(app => app.category === category);
              expect(categoryApps.length).toBeGreaterThan(0);
            });
            
            // Categories not in filtered list should have no matching apps
            const excludedCategories = categories.filter(c => !filteredCats.includes(c));
            excludedCategories.forEach(category => {
              const categoryApps = filteredAppsList.filter(app => app.category === category);
              expect(categoryApps.length).toBe(0);
            });
            
            return true;
          }
        )
      );
    });
  });
});

describe('getFilteredAppsByCategory', () => {
  describe('unit tests', () => {
    it('should return all apps in category for empty query', () => {
      const category = categories[0];
      const expectedApps = apps.filter(app => app.category === category);
      const result = getFilteredAppsByCategory(apps, category, '');
      expect(result).toEqual(expectedApps);
    });

    it('should return only matching apps in category', () => {
      const result = getFilteredAppsByCategory(apps, 'Web Browsers', 'browser');
      expect(result.length).toBeGreaterThan(0);
      result.forEach(app => {
        expect(app.category).toBe('Web Browsers');
        const matches = 
          app.name.toLowerCase().includes('browser') ||
          app.description.toLowerCase().includes('browser') ||
          app.category.toLowerCase().includes('browser');
        expect(matches).toBe(true);
      });
    });

    it('should return empty array when no apps match in category', () => {
      const result = getFilteredAppsByCategory(apps, 'Web Browsers', 'xyznonexistent123456');
      expect(result).toEqual([]);
    });
  });
});
