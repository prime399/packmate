import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildTooltipContent, getVerificationTooltipContent } from '@/components/verification/VerificationTooltip';
import type { VerificationStatus } from '@/lib/verification/types';

/**
 * Property tests for VerificationTooltip component
 * Feature: package-verification
 * **Validates: Requirements 4.5, 4.6**
 */
describe('VerificationTooltip', () => {
  const validStatuses: VerificationStatus[] = ['verified', 'failed', 'pending', 'unverifiable'];

  // Helper to generate valid ISO date strings - use integer arbitrary to avoid NaN dates
  const validDateArb = fc.integer({ 
    min: new Date('2020-01-01T00:00:00.000Z').getTime(), 
    max: new Date('2030-12-31T23:59:59.999Z').getTime() 
  }).map(ts => new Date(ts).toISOString());

  // Helper to generate non-empty error messages that won't match status text
  const errorMessageArb = fc.stringMatching(/^[a-zA-Z0-9]{5,50}$/).filter(s => 
    !s.includes('Package') && 
    !s.includes('verified') && 
    !s.includes('Last') &&
    !s.includes('pending')
  );

  /**
   * **Property 11: Tooltip Content Matches Status**
   * For any verification result, the tooltip SHALL display the last verification date.
   * Additionally, for failed verifications, the tooltip SHALL also display the error message.
   */
  describe('Property 11: Tooltip Content Matches Status', () => {
    it('should always include date information for non-pending statuses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('verified', 'failed', 'unverifiable') as fc.Arbitrary<VerificationStatus>,
          validDateArb,
          (status: VerificationStatus, timestamp: string) => {
            const content = buildTooltipContent(status, timestamp);
            
            // Requirement 4.5: Should include last verification date
            expect(content).toContain('Last checked:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include error message for failed verifications with error', () => {
      fc.assert(
        fc.property(
          errorMessageArb,
          validDateArb,
          (errorMessage: string, timestamp: string) => {
            const content = buildTooltipContent('failed', timestamp, errorMessage);
            
            // Requirement 4.6: Failed verifications show error message
            expect(content).toContain(errorMessage);
            expect(content).toContain('Last checked:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include arbitrary error message for non-failed statuses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('verified', 'pending', 'unverifiable') as fc.Arbitrary<VerificationStatus>,
          errorMessageArb,
          validDateArb,
          (status: VerificationStatus, errorMessage: string, timestamp: string) => {
            const content = buildTooltipContent(status, timestamp, errorMessage);
            
            // Error message should not appear for non-failed statuses
            expect(content).not.toContain(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "Verification pending" for pending status', () => {
      const content = buildTooltipContent('pending');
      expect(content).toBe('Verification pending');
    });

    it('should include status-specific messages', () => {
      const timestamp = new Date().toISOString();
      
      // Verified status
      const verifiedContent = buildTooltipContent('verified', timestamp);
      expect(verifiedContent).toContain('Package verified');
      
      // Unverifiable status
      const unverifiableContent = buildTooltipContent('unverifiable', timestamp);
      expect(unverifiableContent).toContain('does not support verification');
    });
  });

  describe('getVerificationTooltipContent', () => {
    it('should return same content as buildTooltipContent', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validStatuses),
          fc.option(validDateArb, { nil: undefined }),
          fc.option(errorMessageArb, { nil: undefined }),
          (status: VerificationStatus, timestamp: string | undefined, errorMessage: string | undefined) => {
            const content1 = buildTooltipContent(status, timestamp, errorMessage);
            const content2 = getVerificationTooltipContent(status, timestamp, errorMessage);
            
            expect(content1).toBe(content2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
