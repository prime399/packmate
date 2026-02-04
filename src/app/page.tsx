'use client';

import { useState, useMemo, useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import { Package } from 'lucide-react';
import gsap from 'gsap';
import { ThemeProvider } from '@/hooks/useTheme';
import { usePackmateInit } from '@/hooks/usePackmateInit';
import { useTooltip } from '@/hooks/useTooltip';
import { useKeyboardNavigation, type NavItem } from '@/hooks/useKeyboardNavigation';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { OSSelector } from '@/components/os';
import { PackageManagerSelector } from '@/components/packageManager';
import { CommandFooter } from '@/components/command';
import { HowItWorks, GitHubLink, ContributeLink, type HowItWorksRef } from '@/components/header';
import { CategorySection } from '@/components/app';
import { SearchEmptyState } from '@/components/search';
import { Tooltip, LoadingSkeleton } from '@/components/common';
import { categories, Category } from '@/lib/data';
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
    clearAll,
    // Search state from hook - Smart Search Requirements 1.1, 5.1, 5.2
    searchQuery,
    setSearchQuery,
    filteredCategories,
    getFilteredAppsByCategoryFn,
    hasSearchResults,
  } = usePackmateInit();

  const { tooltip, show: showTooltip, hide: hideTooltip, tooltipMouseEnter, tooltipMouseLeave, setTooltipRef } = useTooltip();
  
  // Verification status hook - Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
  const { getStatus: getVerificationStatus } = useVerificationStatus();
  
  // Search input ref for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // HowItWorks ref for "?" shortcut
  const howItWorksRef = useRef<HowItWorksRef>(null);
  
  // Header animation ref
  const headerRef = useRef<HTMLElement>(null);

  // Header entrance animations - Requirements 2.1, 2.2, 2.3, 2.4, 2.5
  useLayoutEffect(() => {
    if (!headerRef.current || !isHydrated) return;

    const header = headerRef.current;
    const title = header.querySelector('.header-animate');
    const controls = header.querySelector('.header-controls');

    // Clip-path reveal for logo/title
    if (title) {
      gsap.fromTo(title,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.1,
          force3D: true,
          onComplete: () => {
            gsap.set(title, { clipPath: 'none' });
          }
        }
      );
    }

    // Fade-in for controls
    if (controls) {
      gsap.fromTo(controls,
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.3,
          force3D: true
        }
      );
    }
  }, [isHydrated]);

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
  // Smart Search: Use filteredCategories instead of all categories
  const packedColumns = useMemo(() => packCategories(filteredCategories, 5), [filteredCategories]);
  const packedColumnsMobile = useMemo(() => packCategories(filteredCategories, 2), [filteredCategories]);

  // Build navigation items grid for keyboard navigation
  // Requirement 1.1: Build navItems grid from categories and apps
  // Smart Search: Use filtered apps for navigation
  const navItems: NavItem[][] = useMemo(() => {
    return packedColumns.map(columnCategories => {
      const items: NavItem[] = [];
      for (const category of columnCategories) {
        // Add category header as navigable item
        items.push({ type: 'category', id: category, category });
        // Add filtered apps in this category
        const categoryApps = getFilteredAppsByCategoryFn(category);
        for (const app of categoryApps) {
          items.push({ type: 'app', id: app.id, category });
        }
      }
      return items;
    });
  }, [packedColumns, getFilteredAppsByCategoryFn]);

  // Toggle category expansion callback for keyboard navigation
  const handleToggleCategoryFromNav = useCallback((id: string) => {
    const category = id as Category;
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Keyboard navigation hook
  // Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
  const {
    focusedItem,
    isKeyboardNavigating,
  } = useKeyboardNavigation(
    navItems,
    handleToggleCategoryFromNav,
    toggleApp,
    searchInputRef
  );

  // "?" keyboard shortcut to open HowItWorks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Skip if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      if (e.key === '?') {
        e.preventDefault();
        howItWorksRef.current?.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background border-(--border-primary)">
          <div className="max-w-7xl mx-auto px-5 py-5">
            <div className="h-10" /> {/* Placeholder for header */}
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-5 py-7">
          <LoadingSkeleton columns={5} categoriesPerColumn={3} appsPerCategory={4} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-40 bg-background border-b border-(--border-primary)">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Logo and Tagline */}
            <div className="header-animate flex items-center gap-3">
              <div className="p-2 rounded-lg bg-(--bg-secondary)">
                <Package size={24} className="text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Packmate</h1>
                <p className="text-xs text-(--text-muted)">The Cross-Platform Bulk App Installer</p>
              </div>
            </div>

            {/* Controls */}
            <div className="header-controls flex items-center gap-5 flex-wrap">
              <HowItWorks ref={howItWorksRef} />
              <ContributeLink />
              <GitHubLink />
              <div className="h-6 w-px bg-(--border-primary)" />
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
      {/* pb-28 provides space for the fixed CommandFooter when it appears */}
      <main className="max-w-7xl mx-auto px-5 py-7 pb-28">
        {/* Empty State - Smart Search Requirement 6.1, 6.3 */}
        {!hasSearchResults && searchQuery.trim() !== '' ? (
          <SearchEmptyState 
            query={searchQuery} 
            onClear={() => setSearchQuery('')} 
          />
        ) : (
          <>
            {/* Desktop Layout - 5 columns */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-5">
              {packedColumns.map((columnCategories, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-5">
                  {columnCategories.map((category, catIndex) => {
                    const categoryApps = getFilteredAppsByCategoryFn(category);
                    return (
                      <CategorySection
                        key={category}
                        category={category}
                        categoryApps={categoryApps}
                        selectedApps={selectedApps}
                        isAppAvailable={isAppAvailable}
                    selectedOS={selectedOS}
                    selectedPackageManager={selectedPackageManager}
                    toggleApp={toggleApp}
                    isExpanded={expandedCategories.has(category)}
                    onToggleExpanded={() => toggleCategory(category)}
                    categoryIndex={colIndex * 3 + catIndex}
                    onTooltipEnter={showTooltip}
                    onTooltipLeave={hideTooltip}
                    focusedItem={focusedItem}
                    isKeyboardNavigating={isKeyboardNavigating}
                    getVerificationStatus={getVerificationStatus}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet Layout - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
          {packedColumnsMobile.map((columnCategories, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-5">
              {columnCategories.map((category, catIndex) => {
                const categoryApps = getFilteredAppsByCategoryFn(category);
                return (
                  <CategorySection
                    key={category}
                    category={category}
                    categoryApps={categoryApps}
                    selectedApps={selectedApps}
                    isAppAvailable={isAppAvailable}
                    selectedOS={selectedOS}
                    selectedPackageManager={selectedPackageManager}
                    toggleApp={toggleApp}
                    isExpanded={expandedCategories.has(category)}
                    onToggleExpanded={() => toggleCategory(category)}
                    categoryIndex={colIndex * 8 + catIndex}
                    onTooltipEnter={showTooltip}
                    onTooltipLeave={hideTooltip}
                    focusedItem={focusedItem}
                    isKeyboardNavigating={isKeyboardNavigating}
                    getVerificationStatus={getVerificationStatus}
                  />
                );
              })}
            </div>
          ))}
        </div>
          </>
        )}
      </main>

      {/* Command Footer - Requirement 6.1: Appears when apps are selected */}
      <CommandFooter
        selectedApps={selectedApps}
        packageManagerId={selectedPackageManager}
        selectedCount={selectedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        clearAll={clearAll}
      />

      {/* Tooltip */}
      <Tooltip
        tooltip={tooltip}
        onMouseEnter={tooltipMouseEnter}
        onMouseLeave={tooltipMouseLeave}
        setRef={setTooltipRef}
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
