/**
 * Property-based tests for HomebrewVerifier URL construction
 * Feature: package-verification, Property 1: URL Construction (Homebrew)
 * 
 * **Validates: Requirements 1.1**
 * 
 * Property 1: *For any* verifiable package manager and any valid package name,
 * the verifier SHALL construct the correct API URL according to the package
 * manager's API specification.
 * 
 * For Homebrew:
 * - Formulae use `https://formulae.brew.sh/api/formula/{name}.json`
 * - Casks (prefixed with `--cask`) use `https://formulae.brew.sh/api/cask/{name}.json`
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { HomebrewVerifier } from '@/lib/verification/verifiers/homebrew';

// ============================================================================
// Constants
// ============================================================================

const HOMEBREW_FORMULA_BASE_URL = 'https://formulae.brew.sh/api/formula';
const HOMEBREW_CASK_BASE_URL = 'https://formulae.brew.sh/api/cask';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid Homebrew formula package names
 * 
 * Homebrew formula names follow these conventions:
 * - Lowercase letters, numbers, and hyphens
 * - Must start with a letter
 * - Cannot start or end with a hyphen
 * - Cannot have consecutive hyphens
 * 
 * Examples: "git", "node", "python3", "ffmpeg", "imagemagick"
 */
const formulaNameArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generator for valid Homebrew cask package names (without --cask prefix)
 * 
 * Cask names follow similar conventions to formulae:
 * - Lowercase letters, numbers, and hyphens
 * - Must start with a letter
 * - Cannot start or end with a hyphen
 * 
 * Examples: "firefox", "visual-studio-code", "google-chrome", "slack"
 */
const caskNameArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generator for cask package names with the --cask prefix
 * This is the format used in Packmate's data.ts for cask packages
 */
const caskPackageNameArb: fc.Arbitrary<string> = caskNameArb.map(
  (name) => `--cask ${name}`
);

/**
 * Generator for any valid Homebrew package name (formula or cask)
 */
const homebrewPackageNameArb: fc.Arbitrary<string> = fc.oneof(
  formulaNameArb,
  caskPackageNameArb
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts the package name from a potentially prefixed package string
 * @param packageName - The package name, possibly prefixed with "--cask "
 * @returns The clean package name without prefix
 */
function extractCleanName(packageName: string): string {
  return packageName.startsWith('--cask ')
    ? packageName.replace('--cask ', '').trim()
    : packageName.trim();
}

/**
 * Determines if a package name represents a cask
 * @param packageName - The package name to check
 * @returns true if the package is a cask (has --cask prefix)
 */
function isCaskPackage(packageName: string): boolean {
  return packageName.startsWith('--cask ');
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: package-verification, Property 1: URL Construction (Homebrew)', () => {
  /**
   * **Validates: Requirements 1.1**
   * 
   * Property 1: For any valid Homebrew formula name, the verifier SHALL
   * construct the URL as `https://formulae.brew.sh/api/formula/{name}.json`
   */
  describe('Formula URL Construction', () => {
    it('should construct correct formula URL for any valid formula name', () => {
      fc.assert(
        fc.property(formulaNameArb, (formulaName) => {
          const url = HomebrewVerifier.buildUrl(formulaName);
          const expectedUrl = `${HOMEBREW_FORMULA_BASE_URL}/${formulaName}.json`;
          
          expect(url).toBe(expectedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('should use the formula API base URL for non-cask packages', () => {
      fc.assert(
        fc.property(formulaNameArb, (formulaName) => {
          const url = HomebrewVerifier.buildUrl(formulaName);
          
          // URL should start with the formula base URL
          expect(url.startsWith(HOMEBREW_FORMULA_BASE_URL)).toBe(true);
          
          // URL should NOT contain the cask base URL
          expect(url.includes('cask')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should append .json extension to formula URLs', () => {
      fc.assert(
        fc.property(formulaNameArb, (formulaName) => {
          const url = HomebrewVerifier.buildUrl(formulaName);
          
          expect(url.endsWith('.json')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should include the exact formula name in the URL path', () => {
      fc.assert(
        fc.property(formulaNameArb, (formulaName) => {
          const url = HomebrewVerifier.buildUrl(formulaName);
          
          // The URL should contain the formula name followed by .json
          expect(url).toContain(`/${formulaName}.json`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.1**
   * 
   * Property 1: For any valid Homebrew cask name (prefixed with --cask),
   * the verifier SHALL construct the URL as `https://formulae.brew.sh/api/cask/{name}.json`
   */
  describe('Cask URL Construction', () => {
    it('should construct correct cask URL for any valid cask package name', () => {
      fc.assert(
        fc.property(caskPackageNameArb, (caskPackageName) => {
          const url = HomebrewVerifier.buildUrl(caskPackageName);
          const cleanName = extractCleanName(caskPackageName);
          const expectedUrl = `${HOMEBREW_CASK_BASE_URL}/${cleanName}.json`;
          
          expect(url).toBe(expectedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('should use the cask API base URL for --cask prefixed packages', () => {
      fc.assert(
        fc.property(caskPackageNameArb, (caskPackageName) => {
          const url = HomebrewVerifier.buildUrl(caskPackageName);
          
          // URL should start with the cask base URL
          expect(url.startsWith(HOMEBREW_CASK_BASE_URL)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should strip --cask prefix from the URL path', () => {
      fc.assert(
        fc.property(caskPackageNameArb, (caskPackageName) => {
          const url = HomebrewVerifier.buildUrl(caskPackageName);
          
          // URL should NOT contain "--cask"
          expect(url.includes('--cask')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should append .json extension to cask URLs', () => {
      fc.assert(
        fc.property(caskPackageNameArb, (caskPackageName) => {
          const url = HomebrewVerifier.buildUrl(caskPackageName);
          
          expect(url.endsWith('.json')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should include the exact cask name (without prefix) in the URL path', () => {
      fc.assert(
        fc.property(caskPackageNameArb, (caskPackageName) => {
          const url = HomebrewVerifier.buildUrl(caskPackageName);
          const cleanName = extractCleanName(caskPackageName);
          
          // The URL should contain the clean cask name followed by .json
          expect(url).toContain(`/${cleanName}.json`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.1**
   * 
   * Combined property: For any valid Homebrew package name (formula or cask),
   * the URL construction should be deterministic and follow the correct pattern
   */
  describe('Combined URL Construction Properties', () => {
    it('should construct deterministic URLs for any package name', () => {
      fc.assert(
        fc.property(homebrewPackageNameArb, (packageName) => {
          // Calling buildUrl multiple times should return the same result
          const url1 = HomebrewVerifier.buildUrl(packageName);
          const url2 = HomebrewVerifier.buildUrl(packageName);
          
          expect(url1).toBe(url2);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly differentiate between formula and cask URLs', () => {
      fc.assert(
        fc.property(homebrewPackageNameArb, (packageName) => {
          const url = HomebrewVerifier.buildUrl(packageName);
          const isCask = isCaskPackage(packageName);
          
          if (isCask) {
            expect(url.startsWith(HOMEBREW_CASK_BASE_URL)).toBe(true);
            expect(url.startsWith(HOMEBREW_FORMULA_BASE_URL)).toBe(false);
          } else {
            expect(url.startsWith(HOMEBREW_FORMULA_BASE_URL)).toBe(true);
            expect(url.startsWith(HOMEBREW_CASK_BASE_URL)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid HTTPS URLs', () => {
      fc.assert(
        fc.property(homebrewPackageNameArb, (packageName) => {
          const url = HomebrewVerifier.buildUrl(packageName);
          
          // Should be a valid HTTPS URL
          expect(url.startsWith('https://')).toBe(true);
          
          // Should be parseable as a URL
          expect(() => new URL(url)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should produce URLs with correct structure: base/name.json', () => {
      fc.assert(
        fc.property(homebrewPackageNameArb, (packageName) => {
          const url = HomebrewVerifier.buildUrl(packageName);
          const cleanName = extractCleanName(packageName);
          
          // URL should match pattern: https://formulae.brew.sh/api/{formula|cask}/{name}.json
          const urlPattern = /^https:\/\/formulae\.brew\.sh\/api\/(formula|cask)\/[a-z0-9-]+\.json$/;
          expect(url).toMatch(urlPattern);
          
          // The name in the URL should match the clean package name
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const nameInUrl = pathParts[pathParts.length - 1].replace('.json', '');
          expect(nameInUrl).toBe(cleanName);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.1**
   * 
   * Tests for parsePackageName static method
   */
  describe('Package Name Parsing', () => {
    it('should correctly identify formula packages (no --cask prefix)', () => {
      fc.assert(
        fc.property(formulaNameArb, (formulaName) => {
          const { isCask, name } = HomebrewVerifier.parsePackageName(formulaName);
          
          expect(isCask).toBe(false);
          expect(name).toBe(formulaName);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly identify cask packages (with --cask prefix)', () => {
      fc.assert(
        fc.property(caskPackageNameArb, (caskPackageName) => {
          const { isCask, name } = HomebrewVerifier.parsePackageName(caskPackageName);
          const expectedName = extractCleanName(caskPackageName);
          
          expect(isCask).toBe(true);
          expect(name).toBe(expectedName);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve the original name for formula packages', () => {
      fc.assert(
        fc.property(formulaNameArb, (formulaName) => {
          const { name } = HomebrewVerifier.parsePackageName(formulaName);
          
          // Name should be unchanged for formula packages
          expect(name).toBe(formulaName);
        }),
        { numRuns: 100 }
      );
    });

    it('should strip --cask prefix and trim whitespace for cask packages', () => {
      fc.assert(
        fc.property(caskNameArb, (caskName) => {
          // Test with standard --cask prefix
          const packageName = `--cask ${caskName}`;
          const { isCask, name } = HomebrewVerifier.parsePackageName(packageName);
          
          expect(isCask).toBe(true);
          expect(name).toBe(caskName);
          expect(name).not.toContain('--cask');
          // Verify no leading or trailing whitespace
          expect(name.startsWith(' ')).toBe(false);
          expect(name.endsWith(' ')).toBe(false);
          expect(name).toBe(name.trim());
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Unit Tests for Specific Examples
// ============================================================================

describe('HomebrewVerifier URL Construction - Unit Tests', () => {
  describe('Known Formula Examples', () => {
    const formulaExamples = [
      { name: 'git', expectedUrl: 'https://formulae.brew.sh/api/formula/git.json' },
      { name: 'node', expectedUrl: 'https://formulae.brew.sh/api/formula/node.json' },
      { name: 'python3', expectedUrl: 'https://formulae.brew.sh/api/formula/python3.json' },
      { name: 'ffmpeg', expectedUrl: 'https://formulae.brew.sh/api/formula/ffmpeg.json' },
      { name: 'imagemagick', expectedUrl: 'https://formulae.brew.sh/api/formula/imagemagick.json' },
      { name: 'wget', expectedUrl: 'https://formulae.brew.sh/api/formula/wget.json' },
      { name: 'curl', expectedUrl: 'https://formulae.brew.sh/api/formula/curl.json' },
    ];

    it.each(formulaExamples)(
      'should construct correct URL for formula "$name"',
      ({ name, expectedUrl }) => {
        const url = HomebrewVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('Known Cask Examples', () => {
    const caskExamples = [
      { name: '--cask firefox', expectedUrl: 'https://formulae.brew.sh/api/cask/firefox.json' },
      { name: '--cask visual-studio-code', expectedUrl: 'https://formulae.brew.sh/api/cask/visual-studio-code.json' },
      { name: '--cask google-chrome', expectedUrl: 'https://formulae.brew.sh/api/cask/google-chrome.json' },
      { name: '--cask slack', expectedUrl: 'https://formulae.brew.sh/api/cask/slack.json' },
      { name: '--cask docker', expectedUrl: 'https://formulae.brew.sh/api/cask/docker.json' },
      { name: '--cask spotify', expectedUrl: 'https://formulae.brew.sh/api/cask/spotify.json' },
      { name: '--cask iterm2', expectedUrl: 'https://formulae.brew.sh/api/cask/iterm2.json' },
    ];

    it.each(caskExamples)(
      'should construct correct URL for cask "$name"',
      ({ name, expectedUrl }) => {
        const url = HomebrewVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('parsePackageName Examples', () => {
    it('should parse formula name correctly', () => {
      const result = HomebrewVerifier.parsePackageName('git');
      expect(result).toEqual({ isCask: false, name: 'git' });
    });

    it('should parse cask name correctly', () => {
      const result = HomebrewVerifier.parsePackageName('--cask firefox');
      expect(result).toEqual({ isCask: true, name: 'firefox' });
    });

    it('should handle hyphenated formula names', () => {
      const result = HomebrewVerifier.parsePackageName('node-sass');
      expect(result).toEqual({ isCask: false, name: 'node-sass' });
    });

    it('should handle hyphenated cask names', () => {
      const result = HomebrewVerifier.parsePackageName('--cask visual-studio-code');
      expect(result).toEqual({ isCask: true, name: 'visual-studio-code' });
    });
  });
});
