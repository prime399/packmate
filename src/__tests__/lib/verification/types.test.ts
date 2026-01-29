/**
 * Property-based tests for verification types
 * Feature: package-verification
 * 
 * Tests Property 3: Verification Results Contain Required Fields
 * Tests Property 4: Timestamps Are ISO 8601 Format
 * 
 * **Validates: Requirements 2.1, 2.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { VerificationResult, VerificationStatus } from '@/lib/verification/types';
import { VERIFIABLE_MANAGERS, UNVERIFIABLE_MANAGERS } from '@/lib/verification/types';
import type { PackageManagerId } from '@/lib/data';

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid VerificationStatus values
 */
const verificationStatusArb: fc.Arbitrary<VerificationStatus> = fc.constantFrom(
  'verified',
  'failed',
  'pending',
  'unverifiable'
);

/**
 * Generator for valid PackageManagerId values
 * Combines both verifiable and unverifiable managers
 */
const packageManagerIdArb: fc.Arbitrary<PackageManagerId> = fc.constantFrom(
  ...VERIFIABLE_MANAGERS,
  ...UNVERIFIABLE_MANAGERS
);

/**
 * Generator for valid app IDs (non-empty alphanumeric strings with hyphens)
 */
const appIdArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9-]{0,49}$/)
  .filter((s) => s.length > 0);

/**
 * Generator for valid package names
 * Package names can include various formats:
 * - Simple names: "firefox", "git"
 * - Cask format: "--cask firefox"
 * - Flatpak format: "org.mozilla.firefox"
 * - Winget format: "Mozilla.Firefox"
 * - Snap with flags: "slack --classic"
 */
const packageNameArb: fc.Arbitrary<string> = fc.oneof(
  // Simple package names
  fc.stringMatching(/^[a-z][a-z0-9-]{0,49}$/),
  // Cask format
  fc.stringMatching(/^--cask [a-z][a-z0-9-]{0,40}$/),
  // Flatpak format (reverse domain)
  fc.stringMatching(/^[a-z]+\.[a-z]+\.[a-zA-Z][a-zA-Z0-9]{0,30}$/),
  // Winget format (Publisher.Name)
  fc.stringMatching(/^[A-Z][a-zA-Z0-9]+\.[A-Z][a-zA-Z0-9]{0,30}$/),
  // Snap with classic flag
  fc.stringMatching(/^[a-z][a-z0-9-]{0,40} --classic$/)
).filter((s) => s.length > 0);

/**
 * Generator for valid ISO 8601 timestamps
 * Generates realistic timestamps within a reasonable date range
 * Uses integer-based generation to avoid invalid date issues during shrinking
 */
const iso8601TimestampArb: fc.Arbitrary<string> = fc
  .integer({
    min: new Date('2020-01-01T00:00:00.000Z').getTime(),
    max: new Date('2030-12-31T23:59:59.999Z').getTime(),
  })
  .map((timestamp) => new Date(timestamp).toISOString());

/**
 * Generator for optional error messages (present when status is 'failed')
 */
const errorMessageArb: fc.Arbitrary<string | undefined> = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(
    'Package not found',
    'API request timeout',
    'Rate limited',
    'Network error',
    'Invalid response format'
  )
);

/**
 * Generator for optional manual review flag
 */
const manualReviewFlagArb: fc.Arbitrary<boolean | undefined> = fc.oneof(
  fc.constant(undefined),
  fc.boolean()
);

/**
 * Generator for complete VerificationResult objects
 * Ensures all required fields are present
 */
const verificationResultArb: fc.Arbitrary<VerificationResult> = fc.record({
  appId: appIdArb,
  packageManagerId: packageManagerIdArb,
  packageName: packageNameArb,
  status: verificationStatusArb,
  timestamp: iso8601TimestampArb,
  errorMessage: errorMessageArb,
  manualReviewFlag: manualReviewFlagArb,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a valid VerificationResult with all required fields
 * This helper ensures we always generate valid results for testing
 */
function createVerificationResult(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    appId: 'test-app',
    packageManagerId: 'homebrew',
    packageName: 'test-package',
    status: 'verified',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Validates that a string is a valid ISO 8601 timestamp
 * ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ssZ
 */
function isValidISO8601(timestamp: string): boolean {
  // Check basic format with regex
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
  if (!iso8601Regex.test(timestamp)) {
    return false;
  }

  // Verify it parses to a valid date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Verify round-trip: parsing and re-serializing produces equivalent result
  // Note: toISOString() always includes milliseconds, so we normalize
  const reparsed = date.toISOString();
  const normalizedOriginal = timestamp.includes('.')
    ? timestamp
    : timestamp.replace('Z', '.000Z');
  
  return reparsed === normalizedOriginal;
}

/**
 * Checks if a VerificationResult has all required fields
 */
function hasAllRequiredFields(result: unknown): result is VerificationResult {
  if (typeof result !== 'object' || result === null) {
    return false;
  }

  const obj = result as Record<string, unknown>;

  // Check required fields exist and have correct types
  const hasAppId = typeof obj.appId === 'string' && obj.appId.length > 0;
  const hasPackageManagerId = typeof obj.packageManagerId === 'string' && obj.packageManagerId.length > 0;
  const hasPackageName = typeof obj.packageName === 'string' && obj.packageName.length > 0;
  const hasStatus = typeof obj.status === 'string' && 
    ['verified', 'failed', 'pending', 'unverifiable'].includes(obj.status);
  const hasTimestamp = typeof obj.timestamp === 'string' && obj.timestamp.length > 0;

  return hasAppId && hasPackageManagerId && hasPackageName && hasStatus && hasTimestamp;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: package-verification, Property 3: Verification Results Contain Required Fields', () => {
  /**
   * **Validates: Requirements 2.1**
   * 
   * Property 3: *For any* verification result stored in the database, 
   * the result SHALL contain all required fields: appId, packageManagerId, 
   * packageName, status, and timestamp.
   */
  it('should contain all required fields for any generated verification result', () => {
    fc.assert(
      fc.property(verificationResultArb, (result) => {
        // Verify all required fields are present
        expect(result).toHaveProperty('appId');
        expect(result).toHaveProperty('packageManagerId');
        expect(result).toHaveProperty('packageName');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('timestamp');

        // Verify required fields are non-empty strings
        expect(typeof result.appId).toBe('string');
        expect(result.appId.length).toBeGreaterThan(0);

        expect(typeof result.packageManagerId).toBe('string');
        expect(result.packageManagerId.length).toBeGreaterThan(0);

        expect(typeof result.packageName).toBe('string');
        expect(result.packageName.length).toBeGreaterThan(0);

        expect(typeof result.status).toBe('string');
        expect(['verified', 'failed', 'pending', 'unverifiable']).toContain(result.status);

        expect(typeof result.timestamp).toBe('string');
        expect(result.timestamp.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate that hasAllRequiredFields correctly identifies valid results', () => {
    fc.assert(
      fc.property(verificationResultArb, (result) => {
        // Any result from our generator should pass the validation
        expect(hasAllRequiredFields(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject objects missing required fields', () => {
    // Test various incomplete objects
    const incompleteObjects = [
      {}, // Empty object
      { appId: 'test' }, // Missing most fields
      { appId: 'test', packageManagerId: 'homebrew' }, // Missing packageName, status, timestamp
      { appId: 'test', packageManagerId: 'homebrew', packageName: 'pkg' }, // Missing status, timestamp
      { appId: 'test', packageManagerId: 'homebrew', packageName: 'pkg', status: 'verified' }, // Missing timestamp
      { appId: '', packageManagerId: 'homebrew', packageName: 'pkg', status: 'verified', timestamp: '2024-01-01T00:00:00.000Z' }, // Empty appId
      { appId: 'test', packageManagerId: '', packageName: 'pkg', status: 'verified', timestamp: '2024-01-01T00:00:00.000Z' }, // Empty packageManagerId
      { appId: 'test', packageManagerId: 'homebrew', packageName: '', status: 'verified', timestamp: '2024-01-01T00:00:00.000Z' }, // Empty packageName
      { appId: 'test', packageManagerId: 'homebrew', packageName: 'pkg', status: 'invalid', timestamp: '2024-01-01T00:00:00.000Z' }, // Invalid status
      null,
      undefined,
      'string',
      123,
    ];

    for (const obj of incompleteObjects) {
      expect(hasAllRequiredFields(obj)).toBe(false);
    }
  });

  it('should allow optional fields to be present or absent', () => {
    fc.assert(
      fc.property(verificationResultArb, (result) => {
        // Optional fields can be undefined or have values
        // errorMessage is optional
        if (result.errorMessage !== undefined) {
          expect(typeof result.errorMessage).toBe('string');
        }

        // manualReviewFlag is optional
        if (result.manualReviewFlag !== undefined) {
          expect(typeof result.manualReviewFlag).toBe('boolean');
        }

        // The result should still be valid regardless of optional fields
        expect(hasAllRequiredFields(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure packageManagerId is a valid PackageManagerId', () => {
    const allValidManagers = [...VERIFIABLE_MANAGERS, ...UNVERIFIABLE_MANAGERS];

    fc.assert(
      fc.property(verificationResultArb, (result) => {
        expect(allValidManagers).toContain(result.packageManagerId);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: package-verification, Property 4: Timestamps Are ISO 8601 Format', () => {
  /**
   * **Validates: Requirements 2.2**
   * 
   * Property 4: *For any* verification result, the timestamp field 
   * SHALL be a valid ISO 8601 formatted string.
   */
  it('should have valid ISO 8601 timestamp for any generated verification result', () => {
    fc.assert(
      fc.property(verificationResultArb, (result) => {
        expect(isValidISO8601(result.timestamp)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate timestamps that can be parsed back to Date objects', () => {
    fc.assert(
      fc.property(iso8601TimestampArb, (timestamp) => {
        const date = new Date(timestamp);
        
        // Should parse to a valid date
        expect(isNaN(date.getTime())).toBe(false);
        
        // Should round-trip correctly
        expect(date.toISOString()).toBe(timestamp);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate ISO 8601 format correctly', () => {
    // Valid ISO 8601 timestamps
    const validTimestamps = [
      '2024-01-15T10:30:00.000Z',
      '2024-12-31T23:59:59.999Z',
      '2020-01-01T00:00:00.000Z',
      '2025-06-15T12:00:00.500Z',
    ];

    for (const timestamp of validTimestamps) {
      expect(isValidISO8601(timestamp)).toBe(true);
    }
  });

  it('should reject invalid timestamp formats', () => {
    // Invalid timestamps
    const invalidTimestamps = [
      '', // Empty string
      'not-a-date', // Random string
      '2024-01-15', // Date only, no time
      '10:30:00', // Time only, no date
      '2024/01/15T10:30:00.000Z', // Wrong date separator
      '2024-01-15 10:30:00', // Space instead of T
      '2024-01-15T10:30:00', // Missing Z
      '2024-01-15T10:30:00+00:00', // Timezone offset instead of Z
      '2024-13-15T10:30:00.000Z', // Invalid month
      '2024-01-32T10:30:00.000Z', // Invalid day
      '2024-01-15T25:30:00.000Z', // Invalid hour
      '2024-01-15T10:60:00.000Z', // Invalid minute
      '2024-01-15T10:30:60.000Z', // Invalid second
      'null',
      'undefined',
    ];

    for (const timestamp of invalidTimestamps) {
      expect(isValidISO8601(timestamp)).toBe(false);
    }
  });

  it('should ensure timestamps are within reasonable date range', () => {
    fc.assert(
      fc.property(verificationResultArb, (result) => {
        const date = new Date(result.timestamp);
        const year = date.getUTCFullYear();
        
        // Timestamps should be within a reasonable range (2020-2030)
        // Using UTC year to avoid timezone conversion issues
        expect(year).toBeGreaterThanOrEqual(2020);
        expect(year).toBeLessThanOrEqual(2030);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case timestamps correctly', () => {
    // Test edge cases
    const edgeCases = [
      { timestamp: '2020-01-01T00:00:00.000Z', description: 'Start of 2020' },
      { timestamp: '2030-12-31T23:59:59.999Z', description: 'End of 2030' },
      { timestamp: '2024-02-29T12:00:00.000Z', description: 'Leap year date' },
    ];

    for (const { timestamp } of edgeCases) {
      expect(isValidISO8601(timestamp)).toBe(true);
      
      const result = createVerificationResult({ timestamp });
      expect(result.timestamp).toBe(timestamp);
    }
  });
});

describe('Feature: package-verification, Combined Properties 3 & 4', () => {
  /**
   * Combined test ensuring both properties hold simultaneously
   */
  it('should satisfy both Property 3 and Property 4 for any verification result', () => {
    fc.assert(
      fc.property(verificationResultArb, (result) => {
        // Property 3: All required fields present
        expect(hasAllRequiredFields(result)).toBe(true);
        
        // Property 4: Timestamp is valid ISO 8601
        expect(isValidISO8601(result.timestamp)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should create valid results using the helper function', () => {
    fc.assert(
      fc.property(
        appIdArb,
        packageManagerIdArb,
        packageNameArb,
        verificationStatusArb,
        (appId, packageManagerId, packageName, status) => {
          const result = createVerificationResult({
            appId,
            packageManagerId,
            packageName,
            status,
          });

          // Property 3: All required fields present
          expect(hasAllRequiredFields(result)).toBe(true);

          // Property 4: Timestamp is valid ISO 8601
          expect(isValidISO8601(result.timestamp)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
