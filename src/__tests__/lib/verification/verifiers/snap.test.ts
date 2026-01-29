/**
 * Property-based tests for SnapVerifier URL construction
 * Feature: package-verification, Property 1: URL Construction (Snap)
 * 
 * **Validates: Requirements 1.5**
 * 
 * Property 1: *For any* verifiable package manager and any valid package name,
 * the verifier SHALL construct the correct API URL according to the package
 * manager's API specification.
 * 
 * For Snap:
 * - URL: `https://api.snapcraft.io/v2/snaps/info/{name}`
 * - Snap packages may include installation flags (e.g., "slack --classic", "code --devmode")
 * - Flags like --classic, --devmode, --jailmode must be stripped before verification
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SnapVerifier } from '@/lib/verification/verifiers/snap';

// ============================================================================
// Constants
// ============================================================================

const SNAPCRAFT_API_BASE = 'https://api.snapcraft.io/v2/snaps/info';

/**
 * Valid Snap installation flags that can be appended to package names
 */
const SNAP_FLAGS = ['--classic', '--devmode', '--jailmode', '--dangerous', '--edge', '--beta', '--candidate', '--stable'] as const;

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid Snap package names (without flags)
 * 
 * Snap package names follow these conventions:
 * - Lowercase letters, numbers, and hyphens
 * - Must start with a letter
 * - Cannot start or end with a hyphen
 * - Cannot have consecutive hyphens
 * 
 * Examples: "slack", "spotify", "code", "firefox", "vlc"
 */
const snapNameArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)
  .filter((s) => s.length >= 1 && s.length <= 50);


/**
 * Generator for a single Snap flag
 */
const snapFlagArb: fc.Arbitrary<string> = fc.constantFrom(...SNAP_FLAGS);

/**
 * Generator for Snap package names with a single flag
 * Format: "packagename --flag"
 * 
 * Examples: "slack --classic", "code --devmode", "firefox --jailmode"
 */
const snapNameWithSingleFlagArb: fc.Arbitrary<string> = fc
  .tuple(snapNameArb, snapFlagArb)
  .map(([name, flag]) => `${name} ${flag}`);

/**
 * Generator for Snap package names with multiple flags
 * Format: "packagename --flag1 --flag2"
 * 
 * Examples: "slack --classic --edge", "code --devmode --beta"
 */
const snapNameWithMultipleFlagsArb: fc.Arbitrary<string> = fc
  .tuple(
    snapNameArb,
    fc.array(snapFlagArb, { minLength: 1, maxLength: 3 })
  )
  .map(([name, flags]) => `${name} ${flags.join(' ')}`);

/**
 * Generator for any valid Snap package name (with or without flags)
 */
const snapPackageNameArb: fc.Arbitrary<string> = fc.oneof(
  { weight: 5, arbitrary: snapNameArb },
  { weight: 3, arbitrary: snapNameWithSingleFlagArb },
  { weight: 2, arbitrary: snapNameWithMultipleFlagsArb }
);

/**
 * Generator for whitespace strings (spaces only)
 * Used to test whitespace trimming behavior
 */
const whitespaceArb: fc.Arbitrary<string> = fc
  .integer({ min: 0, max: 3 })
  .map((count) => ' '.repeat(count));

/**
 * Generator for Snap package names with leading/trailing whitespace
 */
const snapNameWithWhitespaceArb: fc.Arbitrary<string> = fc
  .tuple(whitespaceArb, snapNameArb, whitespaceArb)
  .map(([leading, name, trailing]) => `${leading}${name}${trailing}`);


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Constructs the expected Snapcraft API URL for a Snap package name
 * 
 * @param packageName - The Snap package name (may include flags)
 * @returns The expected Snapcraft API URL
 */
function expectedUrl(packageName: string): string {
  const cleanName = packageName.trim().split(/\s+/)[0];
  return `${SNAPCRAFT_API_BASE}/${cleanName}`;
}

/**
 * Extracts the clean package name from a package string with flags
 * 
 * @param packageName - The package name, possibly with flags
 * @returns The clean package name without flags
 */
function extractCleanName(packageName: string): string {
  return packageName.trim().split(/\s+/)[0];
}

/**
 * Checks if a package name contains any flags
 * Kept for potential future use in tests
 * 
 * @param packageName - The package name to check
 * @returns true if the package name contains flags
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hasFlags(packageName: string): boolean {
  return packageName.includes('--');
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: package-verification, Property 1: URL Construction (Snap)', () => {
  /**
   * **Validates: Requirements 1.5**
   * 
   * Property 1: For any valid Snap package name (with or without flags),
   * the verifier SHALL construct the URL as:
   * `https://api.snapcraft.io/v2/snaps/info/{name}`
   * where {name} is the package name with flags stripped
   */
  describe('Basic URL Construction', () => {
    it('should construct correct Snapcraft API URL for any valid Snap package name', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          const expected = expectedUrl(packageName);
          
          expect(url).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });


    it('should use the Snapcraft API base URL', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          
          // URL should start with the Snapcraft API base
          expect(url.startsWith(SNAPCRAFT_API_BASE)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should include the snaps/info path in the URL', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          
          expect(url).toContain('/snaps/info/');
        }),
        { numRuns: 100 }
      );
    });

    it('should include only the clean package name in the URL path', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          const cleanName = extractCleanName(packageName);
          
          // URL should end with the clean package name
          expect(url.endsWith(`/${cleanName}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.5**
   * 
   * Property 1: The verifier SHALL strip installation flags from package names
   */
  describe('Flag Stripping', () => {
    it('should strip --classic flag from package name', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const packageNameWithFlag = `${name} --classic`;
          const url = SnapVerifier.buildUrl(packageNameWithFlag);
          
          // URL should not contain the flag
          expect(url).not.toContain('--classic');
          expect(url.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });


    it('should strip --devmode flag from package name', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const packageNameWithFlag = `${name} --devmode`;
          const url = SnapVerifier.buildUrl(packageNameWithFlag);
          
          // URL should not contain the flag
          expect(url).not.toContain('--devmode');
          expect(url.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should strip --jailmode flag from package name', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const packageNameWithFlag = `${name} --jailmode`;
          const url = SnapVerifier.buildUrl(packageNameWithFlag);
          
          // URL should not contain the flag
          expect(url).not.toContain('--jailmode');
          expect(url.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should strip any single flag from package name', () => {
      fc.assert(
        fc.property(snapNameWithSingleFlagArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          const cleanName = extractCleanName(packageName);
          
          // URL should not contain any flags
          expect(url).not.toContain('--');
          expect(url.endsWith(`/${cleanName}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should strip multiple flags from package name', () => {
      fc.assert(
        fc.property(snapNameWithMultipleFlagsArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          const cleanName = extractCleanName(packageName);
          
          // URL should not contain any flags
          expect(url).not.toContain('--');
          expect(url.endsWith(`/${cleanName}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });


    it('should produce same URL regardless of flags present', () => {
      fc.assert(
        fc.property(snapNameArb, snapFlagArb, (name, flag) => {
          const urlWithoutFlag = SnapVerifier.buildUrl(name);
          const urlWithFlag = SnapVerifier.buildUrl(`${name} ${flag}`);
          
          // Both should produce the same URL
          expect(urlWithFlag).toBe(urlWithoutFlag);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.5**
   * 
   * Property 1: Tests for stripFlags static method
   */
  describe('stripFlags Method', () => {
    it('should return the package name unchanged when no flags present', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const result = SnapVerifier.stripFlags(name);
          
          expect(result).toBe(name);
        }),
        { numRuns: 100 }
      );
    });

    it('should extract only the package name when flags are present', () => {
      fc.assert(
        fc.property(snapNameWithSingleFlagArb, (packageName) => {
          const result = SnapVerifier.stripFlags(packageName);
          const expectedName = extractCleanName(packageName);
          
          expect(result).toBe(expectedName);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple flags correctly', () => {
      fc.assert(
        fc.property(snapNameWithMultipleFlagsArb, (packageName) => {
          const result = SnapVerifier.stripFlags(packageName);
          const expectedName = extractCleanName(packageName);
          
          expect(result).toBe(expectedName);
          expect(result).not.toContain('--');
        }),
        { numRuns: 100 }
      );
    });


    it('should trim leading whitespace before extracting name', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const packageNameWithLeadingSpace = `   ${name}`;
          const result = SnapVerifier.stripFlags(packageNameWithLeadingSpace);
          
          expect(result).toBe(name);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace between name and flags', () => {
      fc.assert(
        fc.property(snapNameArb, snapFlagArb, (name, flag) => {
          // Test with extra whitespace between name and flag
          const packageName = `${name}    ${flag}`;
          const result = SnapVerifier.stripFlags(packageName);
          
          expect(result).toBe(name);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.5**
   * 
   * Property 1: The verifier SHALL handle whitespace correctly
   */
  describe('Whitespace Handling', () => {
    it('should trim leading whitespace from package name', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const packageNameWithLeadingSpace = `   ${name}`;
          const url = SnapVerifier.buildUrl(packageNameWithLeadingSpace);
          
          // URL should not contain leading spaces
          expect(url).not.toContain('/   ');
          expect(url.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should trim trailing whitespace from package name', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const packageNameWithTrailingSpace = `${name}   `;
          const url = SnapVerifier.buildUrl(packageNameWithTrailingSpace);
          
          // URL should not contain trailing spaces
          expect(url).not.toMatch(/\s$/);
          expect(url.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });


    it('should trim both leading and trailing whitespace', () => {
      fc.assert(
        fc.property(snapNameWithWhitespaceArb, (packageNameWithWhitespace) => {
          const url = SnapVerifier.buildUrl(packageNameWithWhitespace);
          const cleanName = packageNameWithWhitespace.trim();
          
          // URL should use the trimmed package name
          expect(url).toBe(expectedUrl(cleanName));
          expect(url.endsWith(`/${cleanName}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce same URL regardless of surrounding whitespace', () => {
      fc.assert(
        fc.property(snapNameArb, (name) => {
          const urlNoWhitespace = SnapVerifier.buildUrl(name);
          const urlWithLeading = SnapVerifier.buildUrl(`  ${name}`);
          const urlWithTrailing = SnapVerifier.buildUrl(`${name}  `);
          const urlWithBoth = SnapVerifier.buildUrl(`  ${name}  `);
          
          // All should produce the same URL
          expect(urlWithLeading).toBe(urlNoWhitespace);
          expect(urlWithTrailing).toBe(urlNoWhitespace);
          expect(urlWithBoth).toBe(urlNoWhitespace);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.5**
   * 
   * Combined properties for URL construction correctness
   */
  describe('Combined URL Construction Properties', () => {
    it('should construct deterministic URLs for any package name', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          // Calling buildUrl multiple times should return the same result
          const url1 = SnapVerifier.buildUrl(packageName);
          const url2 = SnapVerifier.buildUrl(packageName);
          
          expect(url1).toBe(url2);
        }),
        { numRuns: 100 }
      );
    });


    it('should produce valid HTTPS URLs', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          
          // Should be a valid HTTPS URL
          expect(url.startsWith('https://')).toBe(true);
          
          // Should be parseable as a URL
          expect(() => new URL(url)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should produce URLs with correct structure: base/{name}', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          const cleanName = extractCleanName(packageName);
          
          // URL should match pattern: https://api.snapcraft.io/v2/snaps/info/{name}
          const expectedPattern = `${SNAPCRAFT_API_BASE}/${cleanName}`;
          expect(url).toBe(expectedPattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should use api.snapcraft.io domain', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          
          expect(url).toContain('api.snapcraft.io');
        }),
        { numRuns: 100 }
      );
    });

    it('should use v2 API path', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          
          expect(url).toContain('/v2/');
        }),
        { numRuns: 100 }
      );
    });

    it('should never include flags in the URL', () => {
      fc.assert(
        fc.property(snapPackageNameArb, (packageName) => {
          const url = SnapVerifier.buildUrl(packageName);
          
          // URL should never contain any flag patterns
          expect(url).not.toContain('--');
          expect(url).not.toContain('classic');
          expect(url).not.toContain('devmode');
          expect(url).not.toContain('jailmode');
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Validates: Requirements 1.5**
   * 
   * Edge case properties
   */
  describe('Edge Cases', () => {
    it('should handle package names with single character', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z]$/),
          (name) => {
            const url = SnapVerifier.buildUrl(name);
            
            expect(url).toBe(`${SNAPCRAFT_API_BASE}/${name}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle package names with numbers', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z][a-z0-9]+$/).filter((s) => s.length >= 2 && s.length <= 30),
          (name) => {
            const url = SnapVerifier.buildUrl(name);
            
            expect(url).toBe(`${SNAPCRAFT_API_BASE}/${name}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle package names with hyphens', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/).filter((s) => s.length >= 3 && s.length <= 40),
          (name) => {
            const url = SnapVerifier.buildUrl(name);
            
            expect(url).toBe(`${SNAPCRAFT_API_BASE}/${name}`);
            expect(url).toContain('-');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle long package names', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/).filter((s) => s.length >= 20 && s.length <= 50),
          (name) => {
            const url = SnapVerifier.buildUrl(name);
            
            expect(url).toBe(`${SNAPCRAFT_API_BASE}/${name}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Unit Tests for Specific Examples
// ============================================================================

describe('SnapVerifier URL Construction - Unit Tests', () => {
  describe('Known Package Examples', () => {
    const packageExamples = [
      {
        name: 'slack',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/slack',
      },
      {
        name: 'spotify',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/spotify',
      },
      {
        name: 'code',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/code',
      },
      {
        name: 'firefox',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/firefox',
      },
      {
        name: 'vlc',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/vlc',
      },
      {
        name: 'discord',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/discord',
      },
      {
        name: 'postman',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/postman',
      },
      {
        name: 'gimp',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/gimp',
      },
    ];

    it.each(packageExamples)(
      'should construct correct URL for package "$name"',
      ({ name, expectedUrl }) => {
        const url = SnapVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });


  describe('Packages with --classic Flag', () => {
    const classicExamples = [
      {
        name: 'slack --classic',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/slack',
      },
      {
        name: 'code --classic',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/code',
      },
      {
        name: 'sublime-text --classic',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/sublime-text',
      },
      {
        name: 'intellij-idea-community --classic',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/intellij-idea-community',
      },
    ];

    it.each(classicExamples)(
      'should strip --classic flag from "$name"',
      ({ name, expectedUrl }) => {
        const url = SnapVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('Packages with --devmode Flag', () => {
    const devmodeExamples = [
      {
        name: 'myapp --devmode',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/myapp',
      },
      {
        name: 'test-snap --devmode',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/test-snap',
      },
    ];

    it.each(devmodeExamples)(
      'should strip --devmode flag from "$name"',
      ({ name, expectedUrl }) => {
        const url = SnapVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('Packages with --jailmode Flag', () => {
    const jailmodeExamples = [
      {
        name: 'myapp --jailmode',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/myapp',
      },
      {
        name: 'secure-app --jailmode',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/secure-app',
      },
    ];

    it.each(jailmodeExamples)(
      'should strip --jailmode flag from "$name"',
      ({ name, expectedUrl }) => {
        const url = SnapVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });


  describe('Packages with Multiple Flags', () => {
    const multipleFlagExamples = [
      {
        name: 'myapp --classic --edge',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/myapp',
      },
      {
        name: 'test-snap --devmode --beta',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/test-snap',
      },
      {
        name: 'app --dangerous --devmode --edge',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/app',
      },
    ];

    it.each(multipleFlagExamples)(
      'should strip all flags from "$name"',
      ({ name, expectedUrl }) => {
        const url = SnapVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('stripFlags Method Examples', () => {
    it('should return name unchanged when no flags', () => {
      expect(SnapVerifier.stripFlags('slack')).toBe('slack');
      expect(SnapVerifier.stripFlags('firefox')).toBe('firefox');
      expect(SnapVerifier.stripFlags('visual-studio-code')).toBe('visual-studio-code');
    });

    it('should strip --classic flag', () => {
      expect(SnapVerifier.stripFlags('slack --classic')).toBe('slack');
      expect(SnapVerifier.stripFlags('code --classic')).toBe('code');
    });

    it('should strip --devmode flag', () => {
      expect(SnapVerifier.stripFlags('myapp --devmode')).toBe('myapp');
    });

    it('should strip --jailmode flag', () => {
      expect(SnapVerifier.stripFlags('myapp --jailmode')).toBe('myapp');
    });

    it('should strip multiple flags', () => {
      expect(SnapVerifier.stripFlags('myapp --classic --edge')).toBe('myapp');
      expect(SnapVerifier.stripFlags('app --devmode --beta --dangerous')).toBe('app');
    });

    it('should handle extra whitespace', () => {
      expect(SnapVerifier.stripFlags('  slack  ')).toBe('slack');
      expect(SnapVerifier.stripFlags('  slack --classic  ')).toBe('slack');
      expect(SnapVerifier.stripFlags('slack    --classic')).toBe('slack');
    });
  });


  describe('Whitespace Handling Examples', () => {
    it('should trim leading whitespace', () => {
      const url = SnapVerifier.buildUrl('  slack');
      expect(url).toBe('https://api.snapcraft.io/v2/snaps/info/slack');
    });

    it('should trim trailing whitespace', () => {
      const url = SnapVerifier.buildUrl('slack  ');
      expect(url).toBe('https://api.snapcraft.io/v2/snaps/info/slack');
    });

    it('should trim both leading and trailing whitespace', () => {
      const url = SnapVerifier.buildUrl('  slack  ');
      expect(url).toBe('https://api.snapcraft.io/v2/snaps/info/slack');
    });

    it('should handle tabs and newlines', () => {
      const url = SnapVerifier.buildUrl('\tslack\n');
      expect(url).toBe('https://api.snapcraft.io/v2/snaps/info/slack');
    });

    it('should handle whitespace with flags', () => {
      const url = SnapVerifier.buildUrl('  slack --classic  ');
      expect(url).toBe('https://api.snapcraft.io/v2/snaps/info/slack');
    });
  });

  describe('URL Structure Validation', () => {
    it('should use HTTPS protocol', () => {
      const url = SnapVerifier.buildUrl('slack');
      expect(url.startsWith('https://')).toBe(true);
    });

    it('should use api.snapcraft.io domain', () => {
      const url = SnapVerifier.buildUrl('slack');
      expect(url).toContain('api.snapcraft.io');
    });

    it('should use v2 API path', () => {
      const url = SnapVerifier.buildUrl('slack');
      expect(url).toContain('/v2/');
    });

    it('should use snaps/info endpoint', () => {
      const url = SnapVerifier.buildUrl('slack');
      expect(url).toContain('/snaps/info/');
    });
  });

  describe('Hyphenated Package Names', () => {
    const hyphenatedExamples = [
      {
        name: 'visual-studio-code',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/visual-studio-code',
      },
      {
        name: 'sublime-text',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/sublime-text',
      },
      {
        name: 'intellij-idea-community',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/intellij-idea-community',
      },
      {
        name: 'android-studio',
        expectedUrl: 'https://api.snapcraft.io/v2/snaps/info/android-studio',
      },
    ];

    it.each(hyphenatedExamples)(
      'should handle hyphenated package name "$name"',
      ({ name, expectedUrl }) => {
        const url = SnapVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });
});
