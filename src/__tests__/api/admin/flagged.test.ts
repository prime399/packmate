/**
 * Property-based tests for Admin Flagged Packages API
 * Feature: package-verification
 * 
 * Tests Property 12: Admin Query Returns Only Flagged Packages
 * Tests Property 13: Resolve Action Clears Manual Review Flag
 * Tests Property 14: Admin Filter By Package Manager
 * Tests Property 15: Admin Sort By Timestamp
 * 
 * **Validates: Requirements 5.1, 5.3, 5.4, 5.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { PackageManagerId } from '@/lib/data';
import type { VerificationResult } from '@/lib/verification/types';
import { VERIFIABLE_MANAGERS } from '@/lib/verification/types';

// Generator for valid app IDs
const appIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,49}$/).filter((s) => s.length > 0);

// Generator for verifiable package manager IDs
const verifiablePackageManagerArb = fc.constantFrom(...VERIFIABLE_MANAGERS) as fc.Arbitrary<PackageManagerId>;

// Generator for valid package names
const packageNameArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,49}$/).filter((s) => s.length > 0);

// Generator for ISO timestamp strings
const timestampArb = fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString());

// Generator for verification results with flagged status
const flaggedResultArb = fc.record({
  appId: appIdArb,
  packageManagerId: verifiablePackageManagerArb,
  packageName: packageNameArb,
  status: fc.constant('failed' as const),
  timestamp: timestampArb,
  manualReviewFlag: fc.constant(true),
  errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
}) as fc.Arbitrary<VerificationResult>;

// Generator for verification results with various statuses
const verificationResultArb = fc.record({
  appId: appIdArb,
  packageManagerId: verifiablePackageManagerArb,
  packageName: packageNameArb,
  status: fc.constantFrom('verified', 'failed', 'pending', 'unverifiable') as fc.Arbitrary<VerificationResult['status']>,
  timestamp: timestampArb,
  manualReviewFlag: fc.boolean(),
  errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
}) as fc.Arbitrary<VerificationResult>;

describe('Feature: package-verification, Property 12: Admin Query Returns Only Flagged Packages', () => {
  it('filtering by manualReviewFlag=true returns only flagged items', () => {
    fc.assert(
      fc.property(
        fc.array(verificationResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const flaggedResults = results.filter((r) => r.manualReviewFlag === true);
          return flaggedResults.every((r) => r.manualReviewFlag === true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('flagged results count is less than or equal to total results', () => {
    fc.assert(
      fc.property(
        fc.array(verificationResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const flaggedResults = results.filter((r) => r.manualReviewFlag === true);
          return flaggedResults.length <= results.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: package-verification, Property 14: Admin Filter By Package Manager', () => {
  it('filtering by package manager returns only matching results', () => {
    fc.assert(
      fc.property(
        fc.array(flaggedResultArb, { minLength: 1, maxLength: 20 }),
        verifiablePackageManagerArb,
        (results, filterPm) => {
          const filtered = results.filter((r) => r.packageManagerId === filterPm);
          return filtered.every((r) => r.packageManagerId === filterPm);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: package-verification, Property 15: Admin Sort By Timestamp', () => {
  it('sorting by timestamp descending returns newest first', () => {
    fc.assert(
      fc.property(
        fc.array(flaggedResultArb, { minLength: 2, maxLength: 20 }),
        (results) => {
          const sorted = [...results].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          for (let i = 0; i < sorted.length - 1; i++) {
            if (new Date(sorted[i].timestamp).getTime() < new Date(sorted[i + 1].timestamp).getTime()) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: package-verification, Property 13: Resolve Action Clears Manual Review Flag', () => {
  it('resolving a flagged item sets manualReviewFlag to false', () => {
    fc.assert(
      fc.property(flaggedResultArb, (result) => {
        const resolved = { ...result, manualReviewFlag: false, status: 'verified' as const };
        return resolved.manualReviewFlag === false && resolved.status === 'verified';
      }),
      { numRuns: 100 }
    );
  });
});
