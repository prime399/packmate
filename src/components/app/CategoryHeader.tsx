'use client';

import { memo } from 'react';
import { ChevronDown, Globe, MessageCircle, Music, Gamepad2, FileText, Palette, Code, Terminal, Wrench, Network, Shield, Share2, Settings, Cpu, LucideIcon } from 'lucide-react';
import { Category } from '@/lib/data';

// Requirements: 5.1, 5.2, 5.4 - Category header with icon, name, chevron, and selection count

interface CategoryHeaderProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  selectedCount: number;
  availableCount: number;
  totalCount: number;
  color: string;
  isFocused?: boolean;
  isKeyboardNavigating?: boolean;
}

// Map categories to icons
const categoryIcons: Record<Category, LucideIcon> = {
  'Web Browsers': Globe,
  'Communication': MessageCircle,
  'Media': Music,
  'Gaming': Gamepad2,
  'Office': FileText,
  'Creative': Palette,
  'Dev: Editors': Code,
  'Dev: Tools': Wrench,
  'Dev: Languages': Cpu,
  'Terminal': Terminal,
  'CLI Tools': Terminal,
  'VPN & Network': Network,
  'Security': Shield,
  'File Sharing': Share2,
  'System': Settings,
};

export const CategoryHeader = memo(function CategoryHeader({
  category,
  isExpanded,
  onToggle,
  selectedCount,
  availableCount,
  totalCount,
  color,
  isFocused = false,
  isKeyboardNavigating = false,
}: CategoryHeaderProps) {
  const Icon = categoryIcons[category] || Settings;

  return (
    <button
      onClick={onToggle}
      data-nav-id={`category:${category}`}
      className={`w-full flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-(--bg-hover) transition-colors category-header relative overflow-hidden ${
        // Requirement 1.4, 1.5: Focus ring styling when keyboard navigating
        isFocused && isKeyboardNavigating
          ? 'ring-2 ring-(--accent) ring-offset-1 ring-offset-(--bg-secondary)'
          : ''
      }`}
      aria-expanded={isExpanded}
    >
      {/* Vertical highlighter - straight line, not affected by rounded corners */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: color }}
      />
      <span style={{ color }} className="ml-1">
        <Icon size={18} />
      </span>
      <span className="flex-1 text-left text-sm font-medium text-foreground truncate min-w-0">
        {category}
      </span>
      {/* Requirements: 3.4 - Display badge showing count of available apps */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-(--bg-tertiary) text-(--text-muted) whitespace-nowrap">
          {availableCount} of {totalCount}
        </span>
        {selectedCount > 0 && (
          <span 
            className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white whitespace-nowrap"
            style={{ backgroundColor: color }}
          >
            {selectedCount}
          </span>
        )}
        <ChevronDown 
          size={16} 
          className={`text-(--text-muted) chevron-spring ${isExpanded ? '' : '-rotate-90'}`}
        />
      </div>
    </button>
  );
});
