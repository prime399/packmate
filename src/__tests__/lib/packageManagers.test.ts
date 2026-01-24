import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getPackageManagersByOS,
  packageManagers,
  type OSId,
} from '@/lib/data';

/**
 * Feature: package-manager-integration, Property 1: Package manager filtering by OS
 * **Validates: Requirements 2.1, 2.2, 8.5**
 *
 * Property: For any operating system ID, the `getPackageManagersByOS` function
 * SHALL return only package managers where `packageManager.osId` equals the
 * given OS ID, and the returned list SHALL be non-empty.
 */
describe('Feature: package-manager-integration, Property 1: Package manager filtering by OS', () => {
  // All valid OS IDs for property testing
  const validOSIds: OSId[] = ['windows', 'macos', 'linux'];

  it('returns only package managers for the given OS', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validOSIds),
        (osId: OSId) => {
          const result = getPackageManagersByOS(osId);

          // Property: All returned package managers must have osId equal to the given OS
          const allMatchOS = result.every((pm) => pm.osId === osId);

          return allMatchOS;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns a non-empty list for each OS', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validOSIds),
        (osId: OSId) => {
          const result = getPackageManagersByOS(osId);

          // Property: The returned list must be non-empty
          return result.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns all package managers for the given OS (completeness)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validOSIds),
        (osId: OSId) => {
          const result = getPackageManagersByOS(osId);

          // Property: The result should contain all package managers for that OS
          const expectedPMs = packageManagers.filter((pm) => pm.osId === osId);

          return result.length === expectedPMs.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns package managers with valid structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validOSIds),
        (osId: OSId) => {
          const result = getPackageManagersByOS(osId);

          // Property: Each returned package manager must have all required properties
          return result.every(
            (pm) =>
              typeof pm.id === 'string' &&
              pm.id.length > 0 &&
              typeof pm.name === 'string' &&
              pm.name.length > 0 &&
              typeof pm.iconUrl === 'string' &&
              typeof pm.color === 'string' &&
              typeof pm.installPrefix === 'string' &&
              pm.installPrefix.length > 0 &&
              pm.osId === osId
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit tests for specific OS expectations
  describe('specific OS package manager counts', () => {
    it('returns 3 package managers for Windows (winget, chocolatey, scoop)', () => {
      const result = getPackageManagersByOS('windows');
      expect(result.length).toBe(3);
      expect(result.map((pm) => pm.id)).toContain('winget');
      expect(result.map((pm) => pm.id)).toContain('chocolatey');
      expect(result.map((pm) => pm.id)).toContain('scoop');
    });

    it('returns 2 package managers for macOS (homebrew, macports)', () => {
      const result = getPackageManagersByOS('macos');
      expect(result.length).toBe(2);
      expect(result.map((pm) => pm.id)).toContain('homebrew');
      expect(result.map((pm) => pm.id)).toContain('macports');
    });

    it('returns 6 package managers for Linux (apt, dnf, pacman, zypper, flatpak, snap)', () => {
      const result = getPackageManagersByOS('linux');
      expect(result.length).toBe(6);
      expect(result.map((pm) => pm.id)).toContain('apt');
      expect(result.map((pm) => pm.id)).toContain('dnf');
      expect(result.map((pm) => pm.id)).toContain('pacman');
      expect(result.map((pm) => pm.id)).toContain('zypper');
      expect(result.map((pm) => pm.id)).toContain('flatpak');
      expect(result.map((pm) => pm.id)).toContain('snap');
    });
  });
});
