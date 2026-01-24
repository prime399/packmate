'use client';

import { memo, useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { AppData } from '@/lib/data';

// Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.5, 6.6 - App row with checkbox, icon, name, and availability handling

interface AppItemProps {
  app: AppData;
  isSelected: boolean;
  isAvailable: boolean;
  onToggle: () => void;
  onTooltipEnter: (text: string, event: React.MouseEvent) => void;
  onTooltipLeave: () => void;
  color: string;
  animationDelay?: number;
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

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onTooltipLeave}
      className={`w-full flex items-center gap-2 py-1.5 px-1 rounded transition-colors app-item ${
        isAvailable 
          ? 'hover:bg-[var(--bg-hover)] cursor-pointer' 
          : 'opacity-40 cursor-not-allowed'  // Requirement 3.2: Reduced opacity for unavailable apps
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      disabled={!isAvailable}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
    >
      {/* Checkbox - Requirement 3.1: Visual indicator of availability */}
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          isSelected 
            ? 'checkbox-pop' 
            : isAvailable
              ? 'border-[var(--border-secondary)]'
              : 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)]'  // Disabled checkbox styling
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
          ? 'text-[var(--text-secondary)]' 
          : 'text-[var(--text-tertiary)]'  // Requirement 3.2: Dimmed text for unavailable apps
      }`}>
        {app.name}
      </span>

      {/* Requirement 3.3: Visual indicator for unavailable apps with reason */}
      {!isAvailable && app.unavailableReason && (
        <AlertCircle 
          size={14} 
          className="text-[var(--text-tertiary)] ml-auto flex-shrink-0" 
          aria-label="Not available for selected package manager"
        />
      )}
    </button>
  );
});
