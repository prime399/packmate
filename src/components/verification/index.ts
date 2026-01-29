// Verification components barrel export
// Requirements: 4.1 - Export VerificationBadge and related components

export { 
  VerificationBadge, 
  getBadgeConfig, 
  formatVerificationDate 
} from './VerificationBadge';
export type { VerificationBadgeProps, BadgeConfig } from './VerificationBadge';

export { 
  VerificationTooltip, 
  buildTooltipContent, 
  getVerificationTooltipContent 
} from './VerificationTooltip';
export type { VerificationTooltipProps } from './VerificationTooltip';
