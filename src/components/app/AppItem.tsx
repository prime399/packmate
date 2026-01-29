'use client';

import { memo, useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { AppData } from '@/lib/data';
import { VerificationBadge } from '@/components/verification/VerificationBadge';
import type { VerificationStatus } from '@/lib/verification/types';

// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.3, 6.5, 6.6 
// App row with checkbox, icon, name, availability handling, and verification badge

interface AppItemProps {
  app: AppData;
  isSelected: boolean;
  isAvailable: boolean;
  onToggle: () => void;
  onTooltipEnter: (text: string, event: React.MouseEvent) => void;
  onTooltipLeave: () => void;
  color: string;
  animationDelay?: number;
  isFocused?: boolean;
  isKeyboardNavigating?: boolean;
  /** Verification status for the current package manager */
  verificationStatus?: VerificationStatus;
  /** Timestamp of last verification */
  verificationTimestamp?: string;
  /** Error message if verification failed */
  verificationError?: string;
}

export const AppItem = memo(function AppItem({
  app,
  isSelected,
  isAvailable,
  onToggle,
  onTooltipEnter,
  onTooltipLeave,
  color,
  animationDelay = 0,
  isFocused = false,
  isKeyboardNavigating = false,
  verificationStatus,
  verificationTimestamp,
  verificationError,
}: AppItemProps) {
  // Requirement 3.3: Show unavailableReason tooltip on hover for unavailable apps
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!isAvailable && app.unavailableReason) {
      // Show unavailableReason for unavailable apps
      onTooltipEnter(app.unavailableReason, e);
    } else {
      // Show description for available apps
      onTooltipEnter(app.description, e);
    }
  }, [isAvailable, app.unavailableReason, app.description, onTooltipEnter]);

  // Requirement 3.2: Prevent checkbox interaction for unavailable apps
  const handleClick = useCallback(() => {
    if (isAvailable) {
      onToggle();
    }
    // No-op for unavailable apps - interaction is prevented
  }, [isAvailable, onToggle]);

  const showFocusHighlight = isFocused && isKeyboardNavigating;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onTooltipLeave}
      data-nav-id={`app:${app.id}`}
      className={`relative w-full flex items-center gap-2.5 py-2 px-2.5 rounded transition-all duration-150 app-item ${
        isAvailable 
          ? 'hover:bg-(--bg-hover) cursor-pointer' 
          : 'opacity-40 cursor-not-allowed'  // Requirement 3.2: Reduced opacity for unavailable apps
      }`}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        // Solid background using category accent color when focused during keyboard navigation
        backgroundColor: showFocusHighlight 
          ? `color-mix(in srgb, ${color} 25%, transparent)` 
          : undefined,
      }}
      disabled={!isAvailable}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
    >
      {/* Vertical highlight line at the start when focused */}
      {showFocusHighlight && (
        <span 
          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {/* Checkbox - Requirement 3.1: Visual indicator of availability */}
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          isSelected 
            ? 'checkbox-pop' 
            : isAvailable
              ? 'border-(--border-secondary)'
              : 'border-(--border-secondary) bg-(--bg-tertiary)'  // Disabled checkbox styling
        }`}
        style={{
          backgroundColor: isSelected ? color : undefined,
          borderColor: isSelected ? color : undefined,
        }}
      >
        {isSelected && (
          <Check size={12} className="text-white check-animate" strokeWidth={3} />
        )}
      </div>

      {/* App Icon */}
      <AppIcon iconUrl={app.iconUrl} name={app.name} size={18} />

      {/* App Name */}
      <span className={`text-sm truncate ${
        isAvailable 
          ? 'text-(--text-secondary)' 
          : 'text-(--text-tertiary)'  // Requirement 3.2: Dimmed text for unavailable apps
      }`}>
        {app.name}
      </span>

      {/* Verification Badge - Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 */}
      {verificationStatus && isAvailable && (
        <VerificationBadge
          status={verificationStatus}
          timestamp={verificationTimestamp}
          errorMessage={verificationError}
        />
      )}

      {/* Requirement 3.3: Visual indicator for unavailable apps with reason */}
      {!isAvailable && app.unavailableReason && (
        <AlertCircle 
          size={14} 
          className="text-(--text-tertiary) ml-auto shrink-0" 
          aria-label="Not available for selected package manager"
        />
      )}
    </button>
  );
});
