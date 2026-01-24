'use client';

import { memo, useMemo } from 'react';
import { CategoryHeader } from './CategoryHeader';
import { AppItem } from './AppItem';
import { AppData, Category, OSId, getCategoryColor } from '@/lib/data';

// Requirements: 5.3, 5.5, 5.6 - Collapsible category section with animations

interface CategorySectionProps {
  category: Category;
  categoryApps: AppData[];
  selectedApps: Set<string>;
  isAppAvailable: (id: string) => boolean;
  selectedOS: OSId;
  toggleApp: (id: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  categoryIndex: number;
  onTooltipEnter: (text: string, event: React.MouseEvent) => void;
  onTooltipLeave: () => void;
}

export const CategorySection = memo(function CategorySection({
  category,
  categoryApps,
  selectedApps,
  isAppAvailable,
  toggleApp,
  isExpanded,
  onToggleExpanded,
  categoryIndex,
  onTooltipEnter,
  onTooltipLeave,
}: CategorySectionProps) {
  const color = getCategoryColor(category);
  
  // Count selected apps in this category
  const selectedCount = useMemo(() => {
    return categoryApps.filter(app => selectedApps.has(app.id)).length;
  }, [categoryApps, selectedApps]);

  // Count available apps in this category based on selected package manager
  // Requirements: 3.4 - Display badge showing count of available apps
  const availableCount = useMemo(() => {
    return categoryApps.filter(app => isAppAvailable(app.id)).length;
  }, [categoryApps, isAppAvailable]);

  const totalCount = categoryApps.length;

  // Calculate max height for collapse animation
  const maxHeight = isExpanded ? `${categoryApps.length * 40 + 20}px` : '0px';

  return (
    <div 
      className="bg-[var(--bg-secondary)] rounded-lg p-2 stagger-item"
      style={{ animationDelay: `${categoryIndex * 50}ms` }}
    >
      <CategoryHeader
        category={category}
        isExpanded={isExpanded}
        onToggle={onToggleExpanded}
        selectedCount={selectedCount}
        availableCount={availableCount}
        totalCount={totalCount}
        color={color}
      />
      
      <div 
        className="collapse-content overflow-hidden transition-all duration-300"
        style={{ maxHeight, opacity: isExpanded ? 1 : 0 }}
      >
        <div className="pt-1">
          {categoryApps.map((app, index) => (
            <AppItem
              key={app.id}
              app={app}
              isSelected={selectedApps.has(app.id)}
              isAvailable={isAppAvailable(app.id)}
              onToggle={() => toggleApp(app.id)}
              onTooltipEnter={onTooltipEnter}
              onTooltipLeave={onTooltipLeave}
              color={color}
              animationDelay={isExpanded ? index * 30 : 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
