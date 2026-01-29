'use client';

import { memo, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { CategoryHeader } from './CategoryHeader';
import { AppItem } from './AppItem';
import { AppData, Category, OSId, getCategoryColor, PackageManagerId } from '@/lib/data';
import type { VerificationResult } from '@/lib/verification/types';

// Requirements: 5.3, 5.5, 5.6 - Collapsible category section with animations

interface CategorySectionProps {
  category: Category;
  categoryApps: AppData[];
  selectedApps: Set<string>;
  isAppAvailable: (id: string) => boolean;
  selectedOS: OSId;
  selectedPackageManager: PackageManagerId;
  toggleApp: (id: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  categoryIndex: number;
  onTooltipEnter: (text: string, event: React.MouseEvent) => void;
  onTooltipLeave: () => void;
  focusedItem?: { type: 'category' | 'app'; id: string } | null;
  isKeyboardNavigating?: boolean;
  /** Function to get verification status for an app */
  getVerificationStatus?: (appId: string, packageManagerId: PackageManagerId) => VerificationResult | undefined;
}

export const CategorySection = memo(function CategorySection({
  category,
  categoryApps,
  selectedApps,
  isAppAvailable,
  selectedPackageManager,
  toggleApp,
  isExpanded,
  onToggleExpanded,
  categoryIndex,
  onTooltipEnter,
  onTooltipLeave,
  focusedItem,
  isKeyboardNavigating = false,
  getVerificationStatus,
}: CategorySectionProps) {
  // Animation refs for GSAP
  // Requirements: 3.5, 5.2 - Track animation state and filter changes
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const prevAppCount = useRef(categoryApps.length);

  // Initial entrance animation
  // Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.3 - Animate category header and app items
  useLayoutEffect(() => {
    if (!sectionRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const section = sectionRef.current;
    const header = section.querySelector('.category-header');
    const items = section.querySelectorAll('.app-item');

    requestAnimationFrame(() => {
      // Set initial state with GPU acceleration
      gsap.set(header, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(items, { y: -15, opacity: 0, force3D: true });

      // Staggered delay based on category index
      const delay = categoryIndex * 0.05;

      // Animate header with clip-path reveal
      gsap.to(header, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.6,
        ease: 'power2.out',
        delay: delay + 0.05
      });

      // Animate items with translateY and opacity
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
        delay: delay + 0.1,
        force3D: true
      });
    });
  }, [categoryIndex]);

  // Handle app count changes (filter changes)
  // Requirements: 5.1, 5.3 - Reset item visibility when app count changes
  useEffect(() => {
    if (categoryApps.length !== prevAppCount.current && sectionRef.current) {
      const items = sectionRef.current.querySelectorAll('.app-item');
      gsap.set(items, { y: 0, opacity: 1, clearProps: 'all' });
    }
    prevAppCount.current = categoryApps.length;
  }, [categoryApps.length]);

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

  // Calculate max height for collapse animation (increased for larger item padding)
  const maxHeight = isExpanded ? `${categoryApps.length * 44 + 24}px` : '0px';

  return (
    <div 
      ref={sectionRef}
      className="bg-(--bg-secondary) rounded-lg p-2.5 stagger-item"
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
        isFocused={focusedItem?.type === 'category' && focusedItem?.id === category}
        isKeyboardNavigating={isKeyboardNavigating}
      />
      
      <div 
        className="collapse-content overflow-hidden transition-all duration-300"
        style={{ maxHeight, opacity: isExpanded ? 1 : 0 }}
      >
        <div className="pt-1.5">
          {categoryApps.map((app, index) => {
            const verificationResult = getVerificationStatus?.(app.id, selectedPackageManager);
            return (
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
                isFocused={focusedItem?.type === 'app' && focusedItem?.id === app.id}
                isKeyboardNavigating={isKeyboardNavigating}
                verificationStatus={verificationResult?.status}
                verificationTimestamp={verificationResult?.timestamp}
                verificationError={verificationResult?.errorMessage}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
