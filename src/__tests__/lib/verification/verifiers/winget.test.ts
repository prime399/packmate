/**
 * Property-based tests for WingetVerifier URL construction
 * Feature: package-verification, Property 1: URL Construction (Winget)
 * 
 * **Validates: Requirements 1.3**
 * 
 * Property 1: *For any* verifiable package manager and any valid package name,
 * the verifier SHALL construct the correct API URL according to the package
 * manager's API specification.
 * 
 * For Winget:
 * - URL: `https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/{first-letter}/{publisher}/{name}`
 * - Winget IDs are in format: Publisher.PackageName
 * - The first letter is the lowercase first letter of the publisher
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { WingetVerifier, parseWingetPackageId } from '@/lib/verification/verifiers/winget';

// ============================================================================
// Constants
// ============================================================================

const WINGET_GITHUB_API_BASE = 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid Winget publisher names
 * 
 * Publisher names follow these conventions:
 * - Start with a letter (uppercase or lowercase)
 * - Can contain letters, numbers
 * - Typically PascalCase (e.g., "Microsoft", "Google", "Mozilla")
 * 
 * Examples: "Microsoft", "Google", "Mozilla", "JetBrains", "Adobe"
 */
const publisherNameArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9]*$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generator for valid Winget package names (the part after the publisher)
 * 
 * Package names follow these conventions:
 * - Can contain letters, numbers
 * - Typically PascalCase
 * - Can have multiple parts separated by dots
 * 
 * Examples: "VisualStudioCode", "Chrome", "Firefox", "PowerToys"
 */
const packageNamePartArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9]*$/)
  .filter((s) => s.length >= 1 && s.length <= 50);

/**
 * Generator for simple Winget package IDs (Publisher.Name format)
 * 
 * Examples: "Microsoft.VisualStudioCode", "Google.Chrome", "Mozilla.Firefox"
 */
const simpleWingetIdArb: fc.Arbitrary<string> = fc
  .tuple(publisherNameArb, packageNamePartArb)
  .map(([publisher, name]) => `${publisher}.${name}`);

/**
 * Generator for Winget package IDs with multiple name parts (Publisher.Name.SubName format)
 * 
 * Examples: "Microsoft.VisualStudio.2022.Community", "JetBrains.IntelliJIDEA.Ultimate"
 */
const multiPartWingetIdArb: fc.Arbitrary<string> = fc
  .tuple(
    publisherNameArb,
    packageNamePartArb,
    fc.array(packageNamePartArb, { minLength: 1, maxLength: 3 })
  )
  .map(([publisher, name, additionalParts]) => 
    `${publisher}.${name}.${additionalParts.join('.')}`
  );

/**
 * Generator for any valid Winget package ID
 */
const wingetPackageIdArb: fc.Arbitrary<string> = fc.oneof(
  { weight: 7, arbitrary: simpleWingetIdArb },
  { weight: 3, arbitrary: multiPartWingetIdArb }
);

/**
 * Generator for invalid Winget package IDs (missing dot separator)
 */
const invalidWingetIdNoDotArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9]*$/)
  .filter((s) => s.length >= 1 && s.length <= 50 && !s.includes('.'));

/**
 * Generator for invalid Winget package IDs (empty publisher)
 */
const invalidWingetIdEmptyPublisherArb: fc.Arbitrary<string> = packageNamePartArb
  .map((name) => `.${name}`);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts the publisher from a Winget package ID
 * @param packageId - The full Winget package ID (e.g., "Microsoft.VisualStudioCode")
 * @returns The publisher name (e.g., "Microsoft")
 */
function extractPublisher(packageId: string): string {
  return packageId.split('.')[0];
}

/**
 * Extracts the package name (everything after the publisher) from a Winget package ID
 * @param packageId - The full Winget package ID (e.g., "Microsoft.VisualStudioCode")
 * @returns The package name (e.g., "VisualStudioCode")
 */
function extractPackageName(packageId: string): string {
  const parts = packageId.split('.');
  return parts.slice(1).join('.');
}

/**
 * Gets the first letter of the publisher in lowercase
 * @param packageId - The full Winget package ID
 * @returns The lowercase first letter of the publisher
 */
function getFirstLetter(packageId: string): string {
  return extractPublisher(packageId)[0].toLowerCase();
}

/**
 * Constructs the expected GitHub API URL for a Winget package
 * @param packageId - The Winget package ID
 * @returns The expected GitHub API URL
 */
function expectedUrl(packageId: string): string {
  const publisher = extractPublisher(packageId);
  const name = extractPackageName(packageId);
  const firstLetter = getFirstLetter(packageId);
  return `${WINGET_GITHUB_API_BASE}/${firstLetter}/${publisher}/${name}`;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: package-verification, Property 1: URL Construction (Winget)', () => {
  /**
   * **Validates: Requirements 1.3**
   * 
   * Property 1: For any valid Winget package ID (Publisher.PackageName format),
   * the verifier SHALL construct the URL as:
   * `https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/{first-letter}/{publisher}/{name}`
   */
  describe('Basic URL Construction', () => {
    it('should construct correct GitHub API URL for any valid Winget package ID', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const expected = expectedUrl(packageId);
          
          expect(url).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should use the GitHub API base URL for winget-pkgs repository', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          
          // URL should start with the GitHub API base for winget-pkgs
          expect(url).not.toBeNull();
          expect(url!.startsWith(WINGET_GITHUB_API_BASE)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should include the manifests path in the URL', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          
          expect(url).not.toBeNull();
          expect(url).toContain('/manifests/');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * Property 1: The first letter in the URL path SHALL be the lowercase
   * first letter of the publisher
   */
  describe('First Letter Path Component', () => {
    it('should use lowercase first letter of publisher as first path component', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const publisher = extractPublisher(packageId);
          const expectedFirstLetter = publisher[0].toLowerCase();
          
          expect(url).not.toBeNull();
          // The URL should contain /manifests/{firstLetter}/
          expect(url).toContain(`/manifests/${expectedFirstLetter}/`);
        }),
        { numRuns: 100 }
      );
    });

    it('should always use lowercase for the first letter regardless of publisher case', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          
          expect(url).not.toBeNull();
          // Extract the first letter from the URL path
          const pathAfterManifests = url!.split('/manifests/')[1];
          const firstLetterInUrl = pathAfterManifests.split('/')[0];
          
          // First letter should be lowercase
          expect(firstLetterInUrl).toBe(firstLetterInUrl.toLowerCase());
          expect(firstLetterInUrl.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle publishers starting with uppercase letters', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[A-Z][A-Za-z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 30),
            packageNamePartArb
          ).map(([pub, name]) => `${pub}.${name}`),
          (packageId) => {
            const url = WingetVerifier.buildUrl(packageId);
            const publisher = extractPublisher(packageId);
            
            expect(url).not.toBeNull();
            // First letter should be lowercase even if publisher starts with uppercase
            expect(url).toContain(`/manifests/${publisher[0].toLowerCase()}/`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle publishers starting with lowercase letters', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z][A-Za-z0-9]*$/).filter((s) => s.length >= 1 && s.length <= 30),
            packageNamePartArb
          ).map(([pub, name]) => `${pub}.${name}`),
          (packageId) => {
            const url = WingetVerifier.buildUrl(packageId);
            const publisher = extractPublisher(packageId);
            
            expect(url).not.toBeNull();
            // First letter should remain lowercase
            expect(url).toContain(`/manifests/${publisher[0].toLowerCase()}/`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * Property 1: The publisher SHALL be included in the URL path after the first letter
   */
  describe('Publisher Path Component', () => {
    it('should include the exact publisher name in the URL path', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const publisher = extractPublisher(packageId);
          
          expect(url).not.toBeNull();
          // URL should contain /{firstLetter}/{publisher}/
          const firstLetter = publisher[0].toLowerCase();
          expect(url).toContain(`/${firstLetter}/${publisher}/`);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve publisher case in the URL', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const publisher = extractPublisher(packageId);
          
          expect(url).not.toBeNull();
          // The publisher should appear with original case
          expect(url).toContain(`/${publisher}/`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * Property 1: The package name SHALL be included as the final path component
   */
  describe('Package Name Path Component', () => {
    it('should include the package name as the final path component', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const name = extractPackageName(packageId);
          
          expect(url).not.toBeNull();
          // URL should end with the package name
          expect(url!.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multi-part package names correctly', () => {
      fc.assert(
        fc.property(multiPartWingetIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const name = extractPackageName(packageId);
          
          expect(url).not.toBeNull();
          // The full name (with dots) should be the final path component
          expect(url!.endsWith(`/${name}`)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve package name case in the URL', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const name = extractPackageName(packageId);
          
          expect(url).not.toBeNull();
          // The package name should appear with original case
          expect(url).toContain(name);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * Combined properties for URL construction correctness
   */
  describe('Combined URL Construction Properties', () => {
    it('should construct deterministic URLs for any package ID', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          // Calling buildUrl multiple times should return the same result
          const url1 = WingetVerifier.buildUrl(packageId);
          const url2 = WingetVerifier.buildUrl(packageId);
          
          expect(url1).toBe(url2);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid HTTPS URLs', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          
          expect(url).not.toBeNull();
          // Should be a valid HTTPS URL
          expect(url!.startsWith('https://')).toBe(true);
          
          // Should be parseable as a URL
          expect(() => new URL(url!)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should produce URLs with correct structure: base/{firstLetter}/{publisher}/{name}', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          const publisher = extractPublisher(packageId);
          const name = extractPackageName(packageId);
          const firstLetter = publisher[0].toLowerCase();
          
          expect(url).not.toBeNull();
          // URL should match pattern: base/{firstLetter}/{publisher}/{name}
          const expectedPattern = `${WINGET_GITHUB_API_BASE}/${firstLetter}/${publisher}/${name}`;
          expect(url).toBe(expectedPattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should use api.github.com domain', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          
          expect(url).not.toBeNull();
          expect(url).toContain('api.github.com');
        }),
        { numRuns: 100 }
      );
    });

    it('should reference microsoft/winget-pkgs repository', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const url = WingetVerifier.buildUrl(packageId);
          
          expect(url).not.toBeNull();
          expect(url).toContain('/repos/microsoft/winget-pkgs/');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * Tests for parseWingetPackageId helper function
   */
  describe('Package ID Parsing', () => {
    it('should correctly parse valid Winget package IDs', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const parsed = parseWingetPackageId(packageId);
          
          expect(parsed).not.toBeNull();
          expect(parsed!.publisher).toBe(extractPublisher(packageId));
          expect(parsed!.name).toBe(extractPackageName(packageId));
          expect(parsed!.firstLetter).toBe(getFirstLetter(packageId));
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for package IDs without dot separator', () => {
      fc.assert(
        fc.property(invalidWingetIdNoDotArb, (invalidId) => {
          const parsed = parseWingetPackageId(invalidId);
          
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for package IDs with empty publisher', () => {
      fc.assert(
        fc.property(invalidWingetIdEmptyPublisherArb, (invalidId) => {
          const parsed = parseWingetPackageId(invalidId);
          
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should extract lowercase first letter from publisher', () => {
      fc.assert(
        fc.property(wingetPackageIdArb, (packageId) => {
          const parsed = parseWingetPackageId(packageId);
          
          expect(parsed).not.toBeNull();
          expect(parsed!.firstLetter).toBe(parsed!.firstLetter.toLowerCase());
          expect(parsed!.firstLetter.length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.3**
   * 
   * Tests for invalid package ID handling
   */
  describe('Invalid Package ID Handling', () => {
    it('should return null for package IDs without dot separator', () => {
      fc.assert(
        fc.property(invalidWingetIdNoDotArb, (invalidId) => {
          const url = WingetVerifier.buildUrl(invalidId);
          
          expect(url).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for package IDs with empty publisher', () => {
      fc.assert(
        fc.property(invalidWingetIdEmptyPublisherArb, (invalidId) => {
          const url = WingetVerifier.buildUrl(invalidId);
          
          expect(url).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for empty string', () => {
      const url = WingetVerifier.buildUrl('');
      expect(url).toBeNull();
    });
  });
});

// ============================================================================
// Unit Tests for Specific Examples
// ============================================================================

describe('WingetVerifier URL Construction - Unit Tests', () => {
  describe('Known Package Examples', () => {
    const packageExamples = [
      {
        name: 'Microsoft.VisualStudioCode',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/m/Microsoft/VisualStudioCode',
      },
      {
        name: 'Google.Chrome',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/g/Google/Chrome',
      },
      {
        name: 'Mozilla.Firefox',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/m/Mozilla/Firefox',
      },
      {
        name: 'Microsoft.PowerToys',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/m/Microsoft/PowerToys',
      },
      {
        name: 'JetBrains.IntelliJIDEA.Ultimate',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/j/JetBrains/IntelliJIDEA.Ultimate',
      },
      {
        name: 'Adobe.Acrobat.Reader.64-bit',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/a/Adobe/Acrobat.Reader.64-bit',
      },
      {
        name: 'Discord.Discord',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/d/Discord/Discord',
      },
      {
        name: 'Spotify.Spotify',
        expectedUrl: 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/s/Spotify/Spotify',
      },
    ];

    it.each(packageExamples)(
      'should construct correct URL for package "$name"',
      ({ name, expectedUrl }) => {
        const url = WingetVerifier.buildUrl(name);
        expect(url).toBe(expectedUrl);
      }
    );
  });

  describe('parseWingetPackageId Examples', () => {
    it('should parse simple package ID: Microsoft.VisualStudioCode', () => {
      const result = parseWingetPackageId('Microsoft.VisualStudioCode');
      expect(result).toEqual({
        publisher: 'Microsoft',
        name: 'VisualStudioCode',
        firstLetter: 'm',
      });
    });

    it('should parse multi-part package ID: JetBrains.IntelliJIDEA.Ultimate', () => {
      const result = parseWingetPackageId('JetBrains.IntelliJIDEA.Ultimate');
      expect(result).toEqual({
        publisher: 'JetBrains',
        name: 'IntelliJIDEA.Ultimate',
        firstLetter: 'j',
      });
    });

    it('should parse package ID with lowercase publisher: google.Chrome', () => {
      const result = parseWingetPackageId('google.Chrome');
      expect(result).toEqual({
        publisher: 'google',
        name: 'Chrome',
        firstLetter: 'g',
      });
    });

    it('should return null for invalid ID without dot: InvalidPackage', () => {
      const result = parseWingetPackageId('InvalidPackage');
      expect(result).toBeNull();
    });

    it('should return null for invalid ID with empty publisher: .PackageName', () => {
      const result = parseWingetPackageId('.PackageName');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseWingetPackageId('');
      expect(result).toBeNull();
    });
  });

  describe('URL Structure Validation', () => {
    it('should use HTTPS protocol', () => {
      const url = WingetVerifier.buildUrl('Microsoft.Test');
      expect(url).not.toBeNull();
      expect(url!.startsWith('https://')).toBe(true);
    });

    it('should use api.github.com domain', () => {
      const url = WingetVerifier.buildUrl('Microsoft.Test');
      expect(url).not.toBeNull();
      expect(url).toContain('api.github.com');
    });

    it('should reference microsoft/winget-pkgs repository', () => {
      const url = WingetVerifier.buildUrl('Microsoft.Test');
      expect(url).not.toBeNull();
      expect(url).toContain('/repos/microsoft/winget-pkgs/');
    });

    it('should use contents API endpoint', () => {
      const url = WingetVerifier.buildUrl('Microsoft.Test');
      expect(url).not.toBeNull();
      expect(url).toContain('/contents/');
    });

    it('should include manifests path', () => {
      const url = WingetVerifier.buildUrl('Microsoft.Test');
      expect(url).not.toBeNull();
      expect(url).toContain('/manifests/');
    });
  });

  describe('First Letter Case Handling', () => {
    it('should lowercase uppercase first letter: Microsoft -> m', () => {
      const url = WingetVerifier.buildUrl('Microsoft.Test');
      expect(url).toContain('/manifests/m/Microsoft/');
    });

    it('should keep lowercase first letter: google -> g', () => {
      const url = WingetVerifier.buildUrl('google.Test');
      expect(url).toContain('/manifests/g/google/');
    });

    it('should handle various uppercase letters', () => {
      const testCases = [
        { publisher: 'Adobe', expectedLetter: 'a' },
        { publisher: 'Brave', expectedLetter: 'b' },
        { publisher: 'Canonical', expectedLetter: 'c' },
        { publisher: 'Docker', expectedLetter: 'd' },
        { publisher: 'Epic', expectedLetter: 'e' },
        { publisher: 'Facebook', expectedLetter: 'f' },
        { publisher: 'GitHub', expectedLetter: 'g' },
        { publisher: 'HashiCorp', expectedLetter: 'h' },
        { publisher: 'Intel', expectedLetter: 'i' },
        { publisher: 'JetBrains', expectedLetter: 'j' },
        { publisher: 'Kubernetes', expectedLetter: 'k' },
        { publisher: 'Linux', expectedLetter: 'l' },
        { publisher: 'Microsoft', expectedLetter: 'm' },
        { publisher: 'NVIDIA', expectedLetter: 'n' },
        { publisher: 'Oracle', expectedLetter: 'o' },
        { publisher: 'Python', expectedLetter: 'p' },
        { publisher: 'Qt', expectedLetter: 'q' },
        { publisher: 'RedHat', expectedLetter: 'r' },
        { publisher: 'Spotify', expectedLetter: 's' },
        { publisher: 'Twilio', expectedLetter: 't' },
        { publisher: 'Unity', expectedLetter: 'u' },
        { publisher: 'VMware', expectedLetter: 'v' },
        { publisher: 'WhatsApp', expectedLetter: 'w' },
        { publisher: 'Xcode', expectedLetter: 'x' },
        { publisher: 'Yahoo', expectedLetter: 'y' },
        { publisher: 'Zoom', expectedLetter: 'z' },
      ];

      testCases.forEach(({ publisher, expectedLetter }) => {
        const url = WingetVerifier.buildUrl(`${publisher}.TestApp`);
        expect(url).toContain(`/manifests/${expectedLetter}/${publisher}/`);
      });
    });
  });

  describe('Multi-Part Package Names', () => {
    it('should handle two-part names: Microsoft.VisualStudio.2022', () => {
      const url = WingetVerifier.buildUrl('Microsoft.VisualStudio.2022');
      expect(url).toBe(
        'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/m/Microsoft/VisualStudio.2022'
      );
    });

    it('should handle three-part names: Microsoft.VisualStudio.2022.Community', () => {
      const url = WingetVerifier.buildUrl('Microsoft.VisualStudio.2022.Community');
      expect(url).toBe(
        'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/m/Microsoft/VisualStudio.2022.Community'
      );
    });

    it('should preserve dots in package name portion', () => {
      const url = WingetVerifier.buildUrl('Publisher.Name.With.Many.Parts');
      expect(url).toBe(
        'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/p/Publisher/Name.With.Many.Parts'
      );
    });
  });
});
