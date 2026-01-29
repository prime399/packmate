/**
 * Property-based tests for ChocolateyVerifier URL construction
 * Feature: package-verification, Property 1: URL Construction (Chocolatey)
 * 
 * **Validates: Requirements 1.2**
 * 
 * Property 1: *For any* verifiable package manager and any valid package name,
 * the verifier SHALL construct the correct API URL according to the package
 * manager's API specification.
 * 
 * For Chocolatey:
 * - URL: `https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '{id}'`
 * - Uses OData format with proper escaping (single quotes doubled)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ChocolateyVerifier } from '@/lib/verification/verifiers/chocolatey';

// ============================================================================
// Constants
// ============================================================================

const CHOCOLATEY_API_BASE = 'https://community.chocolatey.org/api/v2/Packages()';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid Chocolatey package names
 * 
 * Chocolatey package IDs follow these conventions:
 * - Alphanumeric characters, hyphens, underscores, and periods
 * - Must start with a letter or number
 * - Case-insensitive (but typically lowercase)
 * - Cannot contain spaces
 * 
 * Examples: "git", "nodejs", "vscode", "7zip", "notepadplusplus", "GoogleChrome"
 */
const chocolateyPackageNameArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/)
  .filter((s) => s.length >= 1 && s.length <= 100);

/**
 * Generator for package names that contain single quotes
 * These require special escaping in OData queries
 * 
 * Note: While rare, package names could theoretically contain single quotes
 * and the escaping logic must handle them correctly
 */
const packageNameWithSingleQuotesArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/).filter((s) => s.length >= 1 && s.length <= 30),
    fc.stringMatching(/^[a-zA-Z0-9._-]+$/).filter((s) => s.length >= 1 && s.length <= 30)
  )
  .map(([prefix, suffix]) => `${prefix}'${suffix}`);

/**
 * Generator for package names with multiple single quotes
 */
const packageNameWithMultipleSingleQuotesArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/).filter((s) => s.length >= 1 && s.length <= 20),
    fc.stringMatching(/^[a-zA-Z0-9._-]+$/).filter((s) => s.length >= 1 && s.length <= 20),
    fc.stringMatching(/^[a-zA-Z0-9._-]+$/).filter((s) => s.length >= 1 && s.length <= 20)
  )
  .map(([a, b, c]) => `${a}'${b}'${c}`);

/**
 * Generator for any valid package name (with or without special characters)
 */
const anyPackageNameArb: fc.Arbitrary<string> = fc.oneof(
  { weight: 8, arbitrary: chocolateyPackageNameArb },
  { weight: 1, arbitrary: packageNameWithSingleQuotesArb },
  { weight: 1, arbitrary: packageNameWithMultipleSingleQuotesArb }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escapes single quotes for OData string literals by doubling them
 * This is the expected escaping behavior per OData specification
 * 
 * @param str - The string to escape
 * @returns The escaped string with single quotes doubled
 */
function escapeODataString(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Constructs the expected Chocolatey API URL for a package name
 * 
 * @param packageName - The package name to query
 * @returns The expected OData API URL
 */
function expectedUrl(packageName: string): string {
  const escapedName = escapeODataString(packageName);
  return `${CHOCOLATEY_API_BASE}?$filter=Id eq '${escapedName}'`;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: package-verification, Property 1: URL Construction (Chocolatey)', () => {
  /**
   * **Validates: Requirements 1.2**
   * 
   * Property 1: For any valid Chocolatey package name, the verifier SHALL
   * construct the URL as `https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '{id}'`
   */
  describe('Basic URL Construction', () => {
    it('should construct correct OData URL for any valid package name', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          const expected = expectedUrl(packageName);
          
          expect(url).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should use the Chocolatey API base URL', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // URL should start with the Chocolatey API base
          expect(url.startsWith(CHOCOLATEY_API_BASE)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should include OData $filter query parameter', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // URL should contain the $filter parameter
          expect(url).toContain('?$filter=');
        }),
        { numRuns: 100 }
      );
    });

    it('should use OData Id eq filter format', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // URL should contain "Id eq" for the OData filter
          expect(url).toContain('Id eq');
        }),
        { numRuns: 100 }
      );
    });

    it('should wrap package name in single quotes for OData string literal', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // The filter should contain the package name wrapped in single quotes
          // Pattern: Id eq '{packageName}'
          expect(url).toMatch(/Id eq '[^']*'$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should include the exact package name in the filter', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // Extract the package name from the URL
          const match = url.match(/Id eq '([^']*)'/);
          expect(match).not.toBeNull();
          expect(match![1]).toBe(packageName);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   * 
   * Property 1: For package names containing single quotes, the verifier SHALL
   * properly escape them by doubling the single quotes per OData specification
   */
  describe('Single Quote Escaping', () => {
    it('should escape single quotes by doubling them', () => {
      fc.assert(
        fc.property(packageNameWithSingleQuotesArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          const escapedName = escapeODataString(packageName);
          
          // The URL should contain the escaped name (with doubled quotes)
          expect(url).toContain(`Id eq '${escapedName}'`);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple single quotes correctly', () => {
      fc.assert(
        fc.property(packageNameWithMultipleSingleQuotesArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          const escapedName = escapeODataString(packageName);
          
          // The URL should contain the properly escaped name
          expect(url).toContain(`Id eq '${escapedName}'`);
          
          // Count the single quotes - escaped should have double the original
          const originalQuoteCount = (packageName.match(/'/g) || []).length;
          const escapedQuoteCount = (escapedName.match(/''/g) || []).length;
          expect(escapedQuoteCount).toBe(originalQuoteCount);
        }),
        { numRuns: 100 }
      );
    });

    it('should double all single quotes from the original package name', () => {
      fc.assert(
        fc.property(packageNameWithSingleQuotesArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // Extract the filter value (between the outer quotes of "Id eq '...'")
          const filterStart = url.indexOf("Id eq '") + 7;
          const filterEnd = url.lastIndexOf("'");
          const filterValue = url.substring(filterStart, filterEnd);
          
          // The escaped value should have all single quotes doubled
          const expectedEscaped = escapeODataString(packageName);
          expect(filterValue).toBe(expectedEscaped);
          
          // Verify the escaping: count of '' in escaped should equal count of ' in original
          const originalQuoteCount = (packageName.match(/'/g) || []).length;
          const doubledQuoteCount = (filterValue.match(/''/g) || []).length;
          expect(doubledQuoteCount).toBe(originalQuoteCount);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   * 
   * Combined properties for URL construction correctness
   */
  describe('Combined URL Construction Properties', () => {
    it('should construct deterministic URLs for any package name', () => {
      fc.assert(
        fc.property(anyPackageNameArb, (packageName) => {
          // Calling buildUrl multiple times should return the same result
          const url1 = ChocolateyVerifier.buildUrl(packageName);
          const url2 = ChocolateyVerifier.buildUrl(packageName);
          
          expect(url1).toBe(url2);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid HTTPS URLs', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // Should be a valid HTTPS URL
          expect(url.startsWith('https://')).toBe(true);
          
          // Should be parseable as a URL
          expect(() => new URL(url)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should produce URLs with correct OData structure', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // URL should match the OData pattern
          const urlPattern = /^https:\/\/community\.chocolatey\.org\/api\/v2\/Packages\(\)\?\$filter=Id eq '.+'$/;
          expect(url).toMatch(urlPattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle package names with various valid characters', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // URL should be constructable without errors
          expect(url).toBeDefined();
          expect(typeof url).toBe('string');
          expect(url.length).toBeGreaterThan(CHOCOLATEY_API_BASE.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve package name case in the URL', () => {
      fc.assert(
        fc.property(chocolateyPackageNameArb, (packageName) => {
          const url = ChocolateyVerifier.buildUrl(packageName);
          
          // The package name should appear in the URL with original case
          expect(url).toContain(packageName);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   * 
   * Edge case properties
   */
  describe('Edge Cases', () => {
    it('should handle single character package names', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9]$/).filter((s) => s.length === 1),
          (packageName) => {
            const url = ChocolateyVerifier.buildUrl(packageName);
            
            expect(url).toBe(expectedUrl(packageName));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle package names with periods', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z0-9]+$/).filter((s) => s.length >= 3 && s.length <= 50),
          (packageName) => {
            const url = ChocolateyVerifier.buildUrl(packageName);
            
            expect(url).toBe(expectedUrl(packageName));
            expect(url).toContain(packageName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle package names with underscores', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*_[a-zA-Z0-9]+$/).filter((s) => s.length >= 3 && s.length <= 50),
          (packageName) => {
            const url = ChocolateyVerifier.buildUrl(packageName);
            
            expect(url).toBe(expectedUrl(packageName));
            expect(url).toContain(packageName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle package names with hyphens', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*-[a-zA-Z0-9]+$/).filter((s) => s.length >= 3 && s.length <= 50),
          (packageName) => {
            const url = ChocolateyVerifier.buildUrl(packageName);
            
            expect(url).toBe(expectedUrl(packageName));
            expect(url).toContain(packageName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle numeric package names', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[0-9][a-zA-Z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          (packageName) => {
            const url = ChocolateyVerifier.buildUrl(packageName);
            
            expect(url).toBe(expectedUrl(packageName));
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

describe('ChocolateyVerifier URL Construction - Unit Tests', () => {
  describe('Known Package Examples', () => {
    const packageExamples = [
      { 
        name: 'git', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'git'" 
      },
      { 
        name: 'nodejs', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'nodejs'" 
      },
      { 
        name: 'vscode', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'vscode'" 
      },
      { 
        name: '7zip', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '7zip'" 
      },
      { 
        name: 'notepadplusplus', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'notepadplusplus'" 
      },
      { 
        name: 'GoogleChrome', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'GoogleChrome'" 
      },
      { 
        name: 'python3', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'python3'" 
      },
      { 
        name: 'vlc', 
        expectedUrl: "https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'vlc'" 
      },
    ];

    it.each(packageExamples)(
      'should construct correct URL for package "$name"',
      ({ name, expectedUrl }) => {
        const url = ChocolateyVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('Single Quote Escaping Examples', () => {
    it("should escape single quote in package name: test'package", () => {
      const url = ChocolateyVerifier.buildUrl("test'package");
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'test''package'");
    });

    it("should escape multiple single quotes: a'b'c", () => {
      const url = ChocolateyVerifier.buildUrl("a'b'c");
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'a''b''c'");
    });

    it("should escape consecutive single quotes: test''name", () => {
      const url = ChocolateyVerifier.buildUrl("test''name");
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'test''''name'");
    });

    it("should handle single quote at start: 'package", () => {
      const url = ChocolateyVerifier.buildUrl("'package");
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '''package'");
    });

    it("should handle single quote at end: package'", () => {
      const url = ChocolateyVerifier.buildUrl("package'");
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'package'''");
    });
  });

  describe('Package Names with Special Characters', () => {
    it('should handle package name with period: Microsoft.VisualStudio.2022.Community', () => {
      const url = ChocolateyVerifier.buildUrl('Microsoft.VisualStudio.2022.Community');
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'Microsoft.VisualStudio.2022.Community'");
    });

    it('should handle package name with hyphen: visual-studio-code', () => {
      const url = ChocolateyVerifier.buildUrl('visual-studio-code');
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'visual-studio-code'");
    });

    it('should handle package name with underscore: some_package', () => {
      const url = ChocolateyVerifier.buildUrl('some_package');
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'some_package'");
    });

    it('should handle mixed case package name: GoogleChrome', () => {
      const url = ChocolateyVerifier.buildUrl('GoogleChrome');
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq 'GoogleChrome'");
    });

    it('should handle numeric prefix: 7zip', () => {
      const url = ChocolateyVerifier.buildUrl('7zip');
      expect(url).toBe("https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '7zip'");
    });
  });

  describe('URL Structure Validation', () => {
    it('should use HTTPS protocol', () => {
      const url = ChocolateyVerifier.buildUrl('test');
      expect(url.startsWith('https://')).toBe(true);
    });

    it('should use community.chocolatey.org domain', () => {
      const url = ChocolateyVerifier.buildUrl('test');
      expect(url).toContain('community.chocolatey.org');
    });

    it('should use v2 API path', () => {
      const url = ChocolateyVerifier.buildUrl('test');
      expect(url).toContain('/api/v2/');
    });

    it('should use Packages() endpoint', () => {
      const url = ChocolateyVerifier.buildUrl('test');
      expect(url).toContain('Packages()');
    });

    it('should use $filter query parameter', () => {
      const url = ChocolateyVerifier.buildUrl('test');
      expect(url).toContain('?$filter=');
    });

    it('should use Id eq filter', () => {
      const url = ChocolateyVerifier.buildUrl('test');
      expect(url).toContain('Id eq');
    });
  });
});
