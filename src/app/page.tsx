'use client';

import { useState, useMemo, useEffect } from 'react';
import { Package } from 'lucide-react';
import { ThemeProvider } from '@/hooks/useTheme';
import { usePackmateInit } from '@/hooks/usePackmateInit';
import { useTooltip } from '@/hooks/useTooltip';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { OSSelector } from '@/components/os';
import { PackageManagerSelector } from '@/components/packageManager';
import { CommandFooter } from '@/components/command';
import { HowItWorks, GitHubLink, ContributeLink } from '@/components/header';
import { CategorySection } from '@/components/app';
import { Tooltip, LoadingSkeleton } from '@/components/common';
import { categories, getAppsByCategory, Category } from '@/lib/data';
import { packCategories } from '@/lib/utils';

// Requirements: 1.1, 1.2, 1.7, 1.8, 4.1, 4.3, 4.4 - Main page with full layout

function HomeContent() {
  const {
    selectedOS,
    setSelectedOS,
    selectedPackageManager,
    setSelectedPackageManager,
    selectedApps,
    toggleApp,
    isAppAvailable,
    selectedCount,
    isHydrated,
  } = usePackmateInit();

  const { tooltip, showTooltip, hideTooltip } = useTooltip();
  
  // Track expanded state for each category
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    () => new Set(categories)
  );

  const toggleCategory = (category: Category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Pack categories into columns using masonry algorithm
  // Use 5 columns on desktop, 2 on mobile (handled via CSS)
  const packedColumns = useMemo(() => packCategories(categories, 5), []);
  const packedColumnsMobile = useMemo(() => packCategories(categories, 2), []);

  // Trigger entrance animations after hydration
  useEffect(() => {
    if (isHydrated) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Animation ready - could be used for GSAP animations
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-10" /> {/* Placeholder for header */}
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <LoadingSkeleton columns={5} categoriesPerColumn={3} appsPerCategory={4} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Logo and Tagline */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                <Package size={24} className="text-[var(--text-primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Packmate</h1>
                <p className="text-xs text-[var(--text-muted)]">The Cross-Platform Bulk App Installer</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <HowItWorks />
              <ContributeLink />
              <GitHubLink />
              <div className="h-6 w-px bg-[var(--border-primary)]" />
              <OSSelector selectedOS={selectedOS} onSelect={setSelectedOS} />
              <PackageManagerSelector 
                selectedOS={selectedOS}
                selectedPackageManager={selectedPackageManager}
                onSelect={setSelectedPackageManager}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* pb-24 provides space for the fixed CommandFooter when it appears */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Desktop Layout - 5 columns */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4">
          {packedColumns.map((columnCategories, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {columnCategories.map((category, catIndex) => {
                const categoryApps = getAppsByCategory(category);
                return (
                  <CategorySection
                    key={category}
                    category={category}
                    categoryApps={categoryApps}
                    selectedApps={selectedApps}
                    isAppAvailable={isAppAvailable}
                    selectedOS={selectedOS}
                    toggleApp={toggleApp}
                    isExpanded={expandedCategories.has(category)}
                    onToggleExpanded={() => toggleCategory(category)}
                    categoryIndex={colIndex * 3 + catIndex}
                    onTooltipEnter={showTooltip}
                    onTooltipLeave={hideTooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet Layout - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          {packedColumnsMobile.map((columnCategories, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {columnCategories.map((category, catIndex) => {
                const categoryApps = getAppsByCategory(category);
                return (
                  <CategorySection
                    key={category}
                    category={category}
                    categoryApps={categoryApps}
                    selectedApps={selectedApps}
                    isAppAvailable={isAppAvailable}
                    selectedOS={selectedOS}
                    toggleApp={toggleApp}
                    isExpanded={expandedCategories.has(category)}
                    onToggleExpanded={() => toggleCategory(category)}
                    categoryIndex={colIndex * 8 + catIndex}
                    onTooltipEnter={showTooltip}
                    onTooltipLeave={hideTooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Command Footer - Requirement 6.1: Appears when apps are selected */}
      <CommandFooter
        selectedApps={selectedApps}
        packageManagerId={selectedPackageManager}
        selectedCount={selectedCount}
      />

      {/* Tooltip */}
      <Tooltip
        isVisible={tooltip.isVisible}
        text={tooltip.text}
        x={tooltip.x}
        y={tooltip.y}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
