'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { AppData } from '@/lib/data';

// Requirements: 6.1, 6.2, 6.3, 6.5, 6.6 - App row with checkbox, icon, name

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
  return (
    <button
      onClick={isAvailable ? onToggle : undefined}
      onMouseEnter={(e) => onTooltipEnter(app.description, e)}
      onMouseLeave={onTooltipLeave}
      className={`w-full flex items-center gap-2 py-1.5 px-1 rounded transition-colors app-item ${
        isAvailable 
          ? 'hover:bg-[var(--bg-hover)] cursor-pointer' 
          : 'opacity-40 cursor-not-allowed'
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      disabled={!isAvailable}
      aria-pressed={isSelected}
      aria-disabled={!isAvailable}
    >
      {/* Checkbox */}
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          isSelected 
            ? 'checkbox-pop' 
            : 'border-[var(--border-secondary)]'
        }`}
        style={{
          backgroundColor: isSelected ? color : 'transparent',
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
      <span className="text-sm text-[var(--text-secondary)] truncate">
        {app.name}
      </span>
    </button>
  );
});
