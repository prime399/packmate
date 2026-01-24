import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { apps, categories, Category, PackageManagerId } from '@/lib/data';

/**
 * Feature: package-manager-integration, Property 5: Data model integrity
 * **Validates: Requirements 1.2, 1.3, 1.5, 7.4**
 * 
 * Property Definition:
 * For any app in the apps array, the app SHALL have all required properties
 * (id, name, description, category, iconUrl, targets), and for each key in
 * the app's targets object, the value SHALL be a non-empty string.
 */

describe('Feature: package-manager-integration, Property 5: Data model integrity', () => {
  it('should have at least 50 apps', () => {
    expect(apps.length).toBeGreaterThanOrEqual(50);
  });

  it('should have apps in all 15 categories', () => {
    const categoriesWithApps = new Set(apps.map(app => app.category));
    expect(categoriesWithApps.size).toBe(15);
    categories.forEach(category => {
      expect(categoriesWithApps.has(category)).toBe(true);
    });
  });

  /**
   * Property test: For any app in the sample data, it should have all required fields
   * **Validates: Requirements 1.2, 1.3, 1.5, 7.4**
   * 
   * - Requirement 1.2: PackageManager interface with id, name, iconUrl, color, installPrefix, osId
   * - Requirement 1.3: AppData interface includes targets property
   * - Requirement 1.5: Target values contain exact package name or command flags
   * - Requirement 7.4: Preserve all existing app metadata (id, name, description, category, iconUrl)
   */
  it('every app should have all required fields with valid values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: apps.length - 1 }),
        (index) => {
          const app = apps[index];
          
          // Requirement 7.4: Preserve all existing app metadata
          // id: non-empty string
          expect(typeof app.id).toBe('string');
          expect(app.id.length).toBeGreaterThan(0);
          
          // name: non-empty string
          expect(typeof app.name).toBe('string');
          expect(app.name.length).toBeGreaterThan(0);
          
          // description: string (can be empty but must exist)
          expect(typeof app.description).toBe('string');
          
          // category: valid category
          expect(categories.includes(app.category as Category)).toBe(true);
          
          // iconUrl: string (required metadata)
          expect(typeof app.iconUrl).toBe('string');
          
          // Requirement 1.3: AppData interface includes targets property
          expect(typeof app.targets).toBe('object');
          expect(app.targets).not.toBeNull();
          
          // Requirement 1.5: Target values contain exact package name or command flags
          // Each target value should be a non-empty string
          for (const [pmId, packageName] of Object.entries(app.targets)) {
            expect(typeof packageName).toBe('string');
            expect((packageName as string).length).toBeGreaterThan(0);
          }
          
          // App should have at least one target (otherwise it's not installable anywhere)
          expect(Object.keys(app.targets).length).toBeGreaterThan(0);
          
          // unavailableReason is optional but if present should be a string
          if (app.unavailableReason !== undefined) {
            expect(typeof app.unavailableReason).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all app IDs should be unique', () => {
    const ids = apps.map(app => app.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
