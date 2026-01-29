/**
 * Property-based tests for FlatpakVerifier URL construction
 * Feature: package-verification, Property 1: URL Construction (Flatpak)
 * 
 * **Validates: Requirements 1.4**
 * 
 * Property 1: *For any* verifiable package manager and any valid package name,
 * the verifier SHALL construct the correct API URL according to the package
 * manager's API specification.
 * 
 * For Flatpak:
 * - URL: `https://flathub.org/api/v2/appstream/{app_id}`
 * - Flatpak app IDs follow reverse domain notation (e.g., "org.mozilla.firefox", "com.spotify.Client")
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FlatpakVerifier } from '@/lib/verification/verifiers/flatpak';

// ============================================================================
// Constants
// ============================================================================

const FLATHUB_API_BASE = 'https://flathub.org/api/v2/appstream';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid domain segments (TLD, organization, etc.)
 * 
 * Domain segments follow these conventions:
 * - Lowercase letters and numbers
 * - Must start with a letter
 * - Cannot be empty
 * 
 * Examples: "org", "com", "io", "mozilla", "spotify", "gnome"
 */
const domainSegmentArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9]*$/)
  .filter((s) => s.length >= 1 && s.length <= 30);

/**
 * Generator for valid Flatpak app name segments (the final part of the app ID)
 * 
 * App name segments follow these conventions:
 * - Can contain letters (mixed case), numbers
 * - Must start with a letter
 * - Typically PascalCase or lowercase
 * 
 * Examples: "firefox", "Firefox", "Client", "Spotify", "GIMP"
 */
const appNameSegmentArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9]*$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generator for simple Flatpak app IDs (3 parts: tld.org.app)
 * 
 * Examples: "org.mozilla.firefox", "com.spotify.Client", "org.gnome.Calculator"
 */
const simpleFlatpakIdArb: fc.Arbitrary<string> = fc
  .tuple(domainSegmentArb, domainSegmentArb, appNameSegmentArb)
  .map(([tld, org, app]) => `${tld}.${org}.${app}`);

/**
 * Generator for Flatpak app IDs with additional segments (4+ parts)
 * 
 * Examples: "org.freedesktop.Platform.GL.default", "com.github.user.AppName"
 */
const multiPartFlatpakIdArb: fc.Arbitrary<string> = fc
  .tuple(
    domainSegmentArb,
    domainSegmentArb,
    fc.array(domainSegmentArb, { minLength: 1, maxLength: 2 }),
    appNameSegmentArb
  )
  .map(([tld, org, middleParts, app]) => 
    `${tld}.${org}.${middleParts.join('.')}.${app}`
  );

/**
 * Generator for any valid Flatpak app ID
 */
const flatpakAppIdArb: fc.Arbitrary<string> = fc.oneof(
  { weight: 7, arbitrary: simpleFlatpakIdArb },
  { weight: 3, arbitrary: multiPartFlatpakIdArb }
);

/**
 * Generator for whitespace strings (spaces only)
 * Used to test whitespace trimming behavior
 */
const whitespaceArb: fc.Arbitrary<string> = fc
  .integer({ min: 0, max: 3 })
  .map((count) => ' '.repeat(count));

/**
 * Generator for Flatpak app IDs with leading/trailing whitespace
 * Used to test whitespace trimming behavior
 */
const flatpakAppIdWithWhitespaceArb: fc.Arbitrary<string> = fc
  .tuple(whitespaceArb, flatpakAppIdArb, whitespaceArb)
  .map(([leading, appId, trailing]) => `${leading}${appId}${trailing}`);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Constructs the expected Flathub API URL for a Flatpak app ID
 * 
 * @param appId - The Flatpak app ID (e.g., "org.mozilla.firefox")
 * @returns The expected Flathub API URL
 */
function expectedUrl(appId: string): string {
  const cleanAppId = appId.trim();
  return `${FLATHUB_API_BASE}/${cleanAppId}`;
}

/**
 * Extracts the TLD from a Flatpak app ID
 * @param appId - The Flatpak app ID
 * @returns The TLD (e.g., "org", "com", "io")
 */
function extractTld(appId: string): string {
  return appId.trim().split('.')[0];
}

/**
 * Extracts the organization from a Flatpak app ID
 * @param appId - The Flatpak app ID
 * @returns The organization (e.g., "mozilla", "spotify", "gnome")
 */
function extractOrganization(appId: string): string {
  return appId.trim().split('.')[1];
}

/**
 * Extracts the app name (last segment) from a Flatpak app ID
 * @param appId - The Flatpak app ID
 * @returns The app name (e.g., "firefox", "Client", "Calculator")
 */
function extractAppName(appId: string): string {
  const parts = appId.trim().split('.');
  return parts[parts.length - 1];
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: package-verification, Property 1: URL Construction (Flatpak)', () => {
  /**
   * **Validates: Requirements 1.4**
   * 
   * Property 1: For any valid Flatpak app ID (reverse domain notation),
   * the verifier SHALL construct the URL as:
   * `https://flathub.org/api/v2/appstream/{app_id}`
   */
  describe('Basic URL Construction', () => {
    it('should construct correct Flathub API URL for any valid Flatpak app ID', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          const expected = expectedUrl(appId);
          
          expect(url).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should use the Flathub API base URL', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          // URL should start with the Flathub API base
          expect(url.startsWith(FLATHUB_API_BASE)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should include the appstream path in the URL', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          expect(url).toContain('/appstream/');
        }),
        { numRuns: 100 }
      );
    });

    it('should include the exact app ID in the URL path', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          // URL should end with the app ID
          expect(url.endsWith(`/${appId}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * 
   * Property 1: The URL SHALL preserve the complete app ID including all segments
   */
  describe('App ID Preservation', () => {
    it('should preserve all segments of simple app IDs (tld.org.app)', () => {
      fc.assert(
        fc.property(simpleFlatpakIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          const tld = extractTld(appId);
          const org = extractOrganization(appId);
          const appName = extractAppName(appId);
          
          // URL should contain all parts of the app ID
          expect(url).toContain(tld);
          expect(url).toContain(org);
          expect(url).toContain(appName);
          
          // The full app ID should be in the URL
          expect(url).toContain(appId);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all segments of multi-part app IDs', () => {
      fc.assert(
        fc.property(multiPartFlatpakIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          // The full app ID (with all dots) should be preserved
          expect(url.endsWith(`/${appId}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve case in app ID', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          // The app ID should appear with original case
          expect(url).toContain(appId);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve dots in the app ID', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          const dotCount = (appId.match(/\./g) || []).length;
          
          // Extract the app ID portion from the URL
          const appIdInUrl = url.split('/appstream/')[1];
          const dotsInUrl = (appIdInUrl.match(/\./g) || []).length;
          
          // Same number of dots should be preserved
          expect(dotsInUrl).toBe(dotCount);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * 
   * Property 1: The verifier SHALL handle whitespace correctly by trimming
   */
  describe('Whitespace Handling', () => {
    it('should trim leading whitespace from app ID', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const appIdWithLeadingSpace = `   ${appId}`;
          const url = FlatpakVerifier.buildUrl(appIdWithLeadingSpace);
          
          // URL should not contain leading spaces
          expect(url).not.toContain('/   ');
          expect(url.endsWith(`/${appId}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should trim trailing whitespace from app ID', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const appIdWithTrailingSpace = `${appId}   `;
          const url = FlatpakVerifier.buildUrl(appIdWithTrailingSpace);
          
          // URL should not contain trailing spaces
          expect(url).not.toMatch(/\s$/);
          expect(url.endsWith(`/${appId}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should trim both leading and trailing whitespace', () => {
      fc.assert(
        fc.property(flatpakAppIdWithWhitespaceArb, (appIdWithWhitespace) => {
          const url = FlatpakVerifier.buildUrl(appIdWithWhitespace);
          const cleanAppId = appIdWithWhitespace.trim();
          
          // URL should use the trimmed app ID
          expect(url).toBe(expectedUrl(cleanAppId));
          expect(url.endsWith(`/${cleanAppId}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce same URL regardless of surrounding whitespace', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const urlNoWhitespace = FlatpakVerifier.buildUrl(appId);
          const urlWithLeading = FlatpakVerifier.buildUrl(`  ${appId}`);
          const urlWithTrailing = FlatpakVerifier.buildUrl(`${appId}  `);
          const urlWithBoth = FlatpakVerifier.buildUrl(`  ${appId}  `);
          
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
   * **Validates: Requirements 1.4**
   * 
   * Combined properties for URL construction correctness
   */
  describe('Combined URL Construction Properties', () => {
    it('should construct deterministic URLs for any app ID', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          // Calling buildUrl multiple times should return the same result
          const url1 = FlatpakVerifier.buildUrl(appId);
          const url2 = FlatpakVerifier.buildUrl(appId);
          
          expect(url1).toBe(url2);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid HTTPS URLs', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          // Should be a valid HTTPS URL
          expect(url.startsWith('https://')).toBe(true);
          
          // Should be parseable as a URL
          expect(() => new URL(url)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should produce URLs with correct structure: base/{app_id}', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          // URL should match pattern: https://flathub.org/api/v2/appstream/{app_id}
          const expectedPattern = `${FLATHUB_API_BASE}/${appId}`;
          expect(url).toBe(expectedPattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should use flathub.org domain', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          expect(url).toContain('flathub.org');
        }),
        { numRuns: 100 }
      );
    });

    it('should use v2 API path', () => {
      fc.assert(
        fc.property(flatpakAppIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          
          expect(url).toContain('/api/v2/');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * 
   * Tests for reverse domain notation format
   */
  describe('Reverse Domain Notation Format', () => {
    it('should handle common TLDs (org, com, io, net)', () => {
      const tlds = ['org', 'com', 'io', 'net'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...tlds),
          domainSegmentArb,
          appNameSegmentArb,
          (tld, org, app) => {
            const appId = `${tld}.${org}.${app}`;
            const url = FlatpakVerifier.buildUrl(appId);
            
            expect(url).toBe(`${FLATHUB_API_BASE}/${appId}`);
            expect(url).toContain(`/${tld}.`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle app IDs with exactly 3 segments', () => {
      fc.assert(
        fc.property(simpleFlatpakIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          const segments = appId.split('.');
          
          expect(segments.length).toBe(3);
          expect(url).toBe(`${FLATHUB_API_BASE}/${appId}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle app IDs with more than 3 segments', () => {
      fc.assert(
        fc.property(multiPartFlatpakIdArb, (appId) => {
          const url = FlatpakVerifier.buildUrl(appId);
          const segments = appId.split('.');
          
          expect(segments.length).toBeGreaterThan(3);
          expect(url).toBe(`${FLATHUB_API_BASE}/${appId}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * 
   * Edge case properties
   */
  describe('Edge Cases', () => {
    it('should handle app IDs with single character segments', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z]$/),
          fc.stringMatching(/^[a-z]$/),
          fc.stringMatching(/^[A-Za-z]$/),
          (tld, org, app) => {
            const appId = `${tld}.${org}.${app}`;
            const url = FlatpakVerifier.buildUrl(appId);
            
            expect(url).toBe(`${FLATHUB_API_BASE}/${appId}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle app IDs with numeric characters in segments', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z][a-z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          fc.stringMatching(/^[a-z][a-z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          fc.stringMatching(/^[A-Za-z][A-Za-z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          (tld, org, app) => {
            const appId = `${tld}.${org}.${app}`;
            const url = FlatpakVerifier.buildUrl(appId);
            
            expect(url).toBe(`${FLATHUB_API_BASE}/${appId}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle app IDs with mixed case app names', () => {
      fc.assert(
        fc.property(
          domainSegmentArb,
          domainSegmentArb,
          fc.stringMatching(/^[A-Z][a-zA-Z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 30),
          (tld, org, app) => {
            const appId = `${tld}.${org}.${app}`;
            const url = FlatpakVerifier.buildUrl(appId);
            
            // Case should be preserved
            expect(url).toContain(app);
            expect(url).toBe(`${FLATHUB_API_BASE}/${appId}`);
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

describe('FlatpakVerifier URL Construction - Unit Tests', () => {
  describe('Known Package Examples', () => {
    const packageExamples = [
      {
        name: 'org.mozilla.firefox',
        expectedUrl: 'https://flathub.org/api/v2/appstream/org.mozilla.firefox',
      },
      {
        name: 'com.spotify.Client',
        expectedUrl: 'https://flathub.org/api/v2/appstream/com.spotify.Client',
      },
      {
        name: 'org.gnome.Calculator',
        expectedUrl: 'https://flathub.org/api/v2/appstream/org.gnome.Calculator',
      },
      {
        name: 'org.gimp.GIMP',
        expectedUrl: 'https://flathub.org/api/v2/appstream/org.gimp.GIMP',
      },
      {
        name: 'com.visualstudio.code',
        expectedUrl: 'https://flathub.org/api/v2/appstream/com.visualstudio.code',
      },
      {
        name: 'org.videolan.VLC',
        expectedUrl: 'https://flathub.org/api/v2/appstream/org.videolan.VLC',
      },
      {
        name: 'com.slack.Slack',
        expectedUrl: 'https://flathub.org/api/v2/appstream/com.slack.Slack',
      },
      {
        name: 'org.libreoffice.LibreOffice',
        expectedUrl: 'https://flathub.org/api/v2/appstream/org.libreoffice.LibreOffice',
      },
    ];

    it.each(packageExamples)(
      'should construct correct URL for package "$name"',
      ({ name, expectedUrl }) => {
        const url = FlatpakVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('Multi-Part App ID Examples', () => {
    const multiPartExamples = [
      {
        name: 'org.freedesktop.Platform',
        expectedUrl: 'https://flathub.org/api/v2/appstream/org.freedesktop.Platform',
      },
      {
        name: 'com.github.user.AppName',
        expectedUrl: 'https://flathub.org/api/v2/appstream/com.github.user.AppName',
      },
      {
        name: 'io.github.user.project.App',
        expectedUrl: 'https://flathub.org/api/v2/appstream/io.github.user.project.App',
      },
    ];

    it.each(multiPartExamples)(
      'should construct correct URL for multi-part app ID "$name"',
      ({ name, expectedUrl }) => {
        const url = FlatpakVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('Whitespace Handling Examples', () => {
    it('should trim leading whitespace', () => {
      const url = FlatpakVerifier.buildUrl('  org.mozilla.firefox');
      expect(url).toBe('https://flathub.org/api/v2/appstream/org.mozilla.firefox');
    });

    it('should trim trailing whitespace', () => {
      const url = FlatpakVerifier.buildUrl('org.mozilla.firefox  ');
      expect(url).toBe('https://flathub.org/api/v2/appstream/org.mozilla.firefox');
    });

    it('should trim both leading and trailing whitespace', () => {
      const url = FlatpakVerifier.buildUrl('  org.mozilla.firefox  ');
      expect(url).toBe('https://flathub.org/api/v2/appstream/org.mozilla.firefox');
    });

    it('should handle tabs and newlines', () => {
      const url = FlatpakVerifier.buildUrl('\torg.mozilla.firefox\n');
      expect(url).toBe('https://flathub.org/api/v2/appstream/org.mozilla.firefox');
    });
  });

  describe('URL Structure Validation', () => {
    it('should use HTTPS protocol', () => {
      const url = FlatpakVerifier.buildUrl('org.test.App');
      expect(url.startsWith('https://')).toBe(true);
    });

    it('should use flathub.org domain', () => {
      const url = FlatpakVerifier.buildUrl('org.test.App');
      expect(url).toContain('flathub.org');
    });

    it('should use v2 API path', () => {
      const url = FlatpakVerifier.buildUrl('org.test.App');
      expect(url).toContain('/api/v2/');
    });

    it('should use appstream endpoint', () => {
      const url = FlatpakVerifier.buildUrl('org.test.App');
      expect(url).toContain('/appstream/');
    });
  });

  describe('Case Preservation', () => {
    it('should preserve lowercase TLD and org', () => {
      const url = FlatpakVerifier.buildUrl('org.mozilla.firefox');
      expect(url).toContain('org.mozilla');
    });

    it('should preserve PascalCase app name', () => {
      const url = FlatpakVerifier.buildUrl('org.gnome.Calculator');
      expect(url).toContain('Calculator');
    });

    it('should preserve all-caps app name', () => {
      const url = FlatpakVerifier.buildUrl('org.gimp.GIMP');
      expect(url).toContain('GIMP');
    });

    it('should preserve mixed case throughout', () => {
      const url = FlatpakVerifier.buildUrl('com.Spotify.Client');
      expect(url).toBe('https://flathub.org/api/v2/appstream/com.Spotify.Client');
    });
  });

  describe('Common TLD Examples', () => {
    const tldExamples = [
      { tld: 'org', example: 'org.mozilla.firefox' },
      { tld: 'com', example: 'com.spotify.Client' },
      { tld: 'io', example: 'io.github.user.App' },
      { tld: 'net', example: 'net.sourceforge.App' },
      { tld: 'de', example: 'de.company.App' },
      { tld: 'uk', example: 'uk.co.company.App' },
    ];

    it.each(tldExamples)(
      'should handle $tld TLD correctly',
      ({ example }) => {
        const url = FlatpakVerifier.buildUrl(example);
        expect(url).toBe(`${FLATHUB_API_BASE}/${example}`);
      }
    );
  });
});
