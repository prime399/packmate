'use client';

import { memo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import type { VerificationStatus } from '@/lib/verification/types';

// Requirements: 4.1, 4.2, 4.3, 4.4 - Verification badge with status-based icons and colors

export interface VerificationBadgeProps {
  status: VerificationStatus;
  timestamp?: string;
  errorMessage?: string;
  showTooltip?: boolean;
}

/**
 * Badge configuration for each verification status
 * Property 10: Badge Rendering Matches Status
 */
export interface BadgeConfig {
  icon: React.ReactNode;
  color: string;
  label: string;
  bgColor: string;
}

/**
 * Get badge configuration based on verification status
 * - verified: green checkmark (Requirement 4.1)
 * - failed: red X (Requirement 4.3)
 * - unverifiable: yellow warning (Requirement 4.2)
 * - pending: gray clock (Requirement 4.4)
 */
export function getBadgeConfig(status: VerificationStatus): BadgeConfig {
  switch (status) {
    case 'verified':
      return {
        icon: <CheckCircle size={14} />,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Verified',
      };
    case 'failed':
      return {
        icon: <XCircle size={14} />,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Failed',
      };
    case 'unverifiable':
      return {
        icon: <AlertTriangle size={14} />,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Unverifiable',
      };
    case 'pending':
    default:
      return {
        icon: <Clock size={14} />,
        color: 'text-gray-400',
        bgColor: 'bg-gray-400/10',
        label: 'Pending',
      };
  }
}

/**
 * Format timestamp for display in tooltip
 */
export function formatVerificationDate(timestamp?: string): string {
  if (!timestamp) return 'Never verified';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * VerificationBadge component
 * Displays a visual indicator of package verification status
 */
export const VerificationBadge = memo(function VerificationBadge({
  status,
  timestamp,
  errorMessage,
  showTooltip = true,
}: VerificationBadgeProps) {
  const { icon, color, bgColor, label } = getBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${color} ${bgColor}`}
      title={showTooltip ? buildTooltipText(status, timestamp, errorMessage) : undefined}
      aria-label={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
});

/**
 * Build tooltip text based on status
 * Requirements 4.5, 4.6: Show last verification date and error message for failed
 */
function buildTooltipText(
  status: VerificationStatus,
  timestamp?: string,
  errorMessage?: string
): string {
  const dateText = `Last checked: ${formatVerificationDate(timestamp)}`;
  
  if (status === 'failed' && errorMessage) {
    return `${errorMessage}\n${dateText}`;
  }
  
  return dateText;
}
