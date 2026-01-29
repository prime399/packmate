import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getBadgeConfig, formatVerificationDate } from '@/components/verification/VerificationBadge';
import type { VerificationStatus } from '@/lib/verification/types';

/**
 * Property tests for VerificationBadge component
 * Feature: package-verification
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */
describe('VerificationBadge', () => {
  // All valid verification statuses
  const validStatuses: VerificationStatus[] = ['verified', 'failed', 'pending', 'unverifiable'];

  /**
   * **Property 10: Badge Rendering Matches Status**
   * For any verification status, the VerificationBadge component SHALL render
   * the correct icon and color:
   * - "verified" → green checkmark
   * - "failed" → red X
   * - "unverifiable" → yellow warning
   * - "pending" → gray clock
   */
  describe('Property 10: Badge Rendering Matches Status', () => {
    it('should return correct badge config for any valid status', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validStatuses),
          (status: VerificationStatus) => {
            const config = getBadgeConfig(status);

            // All configs must have required fields
            expect(config).toHaveProperty('icon');
            expect(config).toHaveProperty('color');
            expect(config).toHaveProperty('label');
            expect(config).toHaveProperty('bgColor');

            // Verify correct color mapping
            switch (status) {
              case 'verified':
                expect(config.color).toBe('text-green-500');
                expect(config.label).toBe('Verified');
                break;
              case 'failed':
                expect(config.color).toBe('text-red-500');
                expect(config.label).toBe('Failed');
                break;
              case 'unverifiable':
                expect(config.color).toBe('text-yellow-500');
                expect(config.label).toBe('Unverifiable');
                break;
              case 'pending':
                expect(config.color).toBe('text-gray-400');
                expect(config.label).toBe('Pending');
                break;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unknown status as pending (default case)', () => {
      // Test that unknown statuses fall through to pending
      const config = getBadgeConfig('unknown' as VerificationStatus);
      expect(config.color).toBe('text-gray-400');
      expect(config.label).toBe('Pending');
    });
  });

  describe('formatVerificationDate', () => {
    it('should return "Never verified" for undefined timestamp', () => {
      expect(formatVerificationDate(undefined)).toBe('Never verified');
    });

    it('should format valid ISO 8601 timestamps', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date: Date) => {
            // fast-check might generate invalid dates if min/max are somehow problematic
            // or due to edge cases, so we guard against it
            if (isNaN(date.getTime())) return;
            
            const isoString = date.toISOString();
            const formatted = formatVerificationDate(isoString);
            
            // Should not return error messages for valid dates
            expect(formatted).not.toBe('Never verified');
            expect(formatted).not.toBe('Invalid Date');
            
            // Should contain year
            expect(formatted).toMatch(/\d{4}/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "Invalid Date" for invalid timestamps', () => {
      const result = formatVerificationDate('not-a-date');
      expect(result).toBe('Invalid Date');
    });
  });
});
