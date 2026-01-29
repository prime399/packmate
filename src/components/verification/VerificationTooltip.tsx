'use client';

import { memo } from 'react';
import type { VerificationStatus } from '@/lib/verification/types';
import { formatVerificationDate } from './VerificationBadge';

// Requirements: 4.5, 4.6 - Tooltip content with last verification date and error message

export interface VerificationTooltipProps {
  status: VerificationStatus;
  timestamp?: string;
  errorMessage?: string;
}

/**
 * Build tooltip content based on verification status
 * - Requirement 4.5: Show last verification date for all statuses
 * - Requirement 4.6: Include error message for failed verifications
 */
export function buildTooltipContent(
  status: VerificationStatus,
  timestamp?: string,
  errorMessage?: string
): string {
  const dateText = `Last checked: ${formatVerificationDate(timestamp)}`;
  
  // Requirement 4.6: Failed verifications show error message
  if (status === 'failed' && errorMessage) {
    return `${errorMessage}\n${dateText}`;
  }
  
  // Status-specific messages
  switch (status) {
    case 'verified':
      return `Package verified in repository\n${dateText}`;
    case 'unverifiable':
      return `Package manager does not support verification\n${dateText}`;
    case 'pending':
      return 'Verification pending';
    default:
      return dateText;
  }
}

/**
 * VerificationTooltip component
 * Displays tooltip content for verification status
 * Integrates with existing Tooltip component via content string
 */
export const VerificationTooltip = memo(function VerificationTooltip({
  status,
  timestamp,
  errorMessage,
}: VerificationTooltipProps) {
  const content = buildTooltipContent(status, timestamp, errorMessage);
  
  return (
    <div className="text-xs leading-relaxed">
      {content.split('\n').map((line, index) => (
        <p key={index} className={index === 0 ? 'font-medium' : 'text-(--text-tertiary)'}>
          {line}
        </p>
      ))}
    </div>
  );
});

/**
 * Get tooltip content string for use with existing Tooltip component
 * This allows integration with the follow-cursor tooltip system
 */
export function getVerificationTooltipContent(
  status: VerificationStatus,
  timestamp?: string,
  errorMessage?: string
): string {
  return buildTooltipContent(status, timestamp, errorMessage);
}
