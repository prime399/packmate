'use client';

import { X } from 'lucide-react';

/**
 * ShortcutsBar Component
 * 
 * A neovim-style statusline showing search, app count, and keyboard shortcuts.
 * 
 * Requirements:
 * - 2.1: Display the current package manager name as a colored badge
 * - 2.2: Provide a search input with "/" prefix (vim-style)
 * - 2.3: Display the selected app count when apps are selected
 * - 2.4: Display keyboard shortcut hints (hjkl navigation, / search, Space toggle, Tab preview, ? help)
 * - 2.5: Display a branded "PACK" end badge
 * - 2.6: Allow typing to filter apps when search input receives focus
 * - 2.7: Blur the search input when Escape or Enter is pressed
 */

interface ShortcutsBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  selectedCount: number;
  packageManagerName: string;
  packageManagerColor: string;
}

export function ShortcutsBar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  selectedCount,
  packageManagerName,
  packageManagerColor,
}: ShortcutsBarProps) {
  /**
   * Handle keyboard events in search input
   * Requirement 2.7: Blur search input on Escape or Enter
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div
      className="bg-(--bg-tertiary) border-l-4 font-mono text-xs overflow-hidden"
      style={{ borderLeftColor: packageManagerColor }}
    >
      <div className="flex items-stretch justify-between">
        {/* LEFT SECTION */}
        <div className="flex items-stretch">
          {/* Package Manager Badge - Requirement 2.1 (hidden on mobile) */}
          <div
            className="hidden md:flex text-white px-3 py-1 font-bold items-center whitespace-nowrap"
            style={{ backgroundColor: packageManagerColor }}
            data-testid="package-manager-badge"
          >
            {packageManagerName.toUpperCase()}
          </div>

          {/* Search Section - Requirements 2.2, 2.6 */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-(--bg-secondary) border-r border-(--border-primary)/30">
            <span className="text-(--text-muted)">/</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="search..."
              className="
                w-28 sm:w-40
                bg-transparent
                text-(--text-primary)
                placeholder:text-(--text-muted)/50
                outline-none
              "
              data-testid="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-(--text-muted) hover:text-(--text-primary) transition-colors"
                aria-label="Clear search"
                data-testid="clear-search-button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* App count - Requirement 2.3 */}
          {selectedCount > 0 && (
            <div
              className="flex items-center px-3 py-1 text-(--text-muted) border-r border-(--border-primary)/30 whitespace-nowrap"
              data-testid="selected-count"
            >
              [{selectedCount} app{selectedCount !== 1 ? 's' : ''}]
            </div>
          )}
        </div>

        {/* RIGHT SECTION - Shortcuts and End Badge (hidden on mobile) */}
        <div className="hidden md:flex items-stretch">
          {/* Keyboard Shortcuts - Requirement 2.4 */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1 text-(--text-muted) text-[10px] border-l border-(--border-primary)/30">
            {/* Navigation */}
            <span className="hidden lg:inline">
              <b className="text-(--text-secondary)">←↓↑→ </b>/
              <b className="text-(--text-secondary)"> hjkl</b> Navigation
            </span>
            <span className="hidden lg:inline opacity-30">·</span>
            {/* Actions */}
            <span>
              <b className="text-(--text-secondary)">/</b> search
            </span>
            <span className="opacity-30">·</span>
            <span>
              <b className="text-(--text-secondary)">Space</b> toggle
            </span>
            <span className="opacity-30">·</span>
            <span>
              <b className="text-(--text-secondary)">Tab</b> preview
            </span>
            <span className="opacity-30">·</span>
            <span>
              <b className="text-(--text-secondary)">?</b> help
            </span>
          </div>

          {/* End Badge - Requirement 2.5 */}
          <div
            className="text-white px-3 py-1 flex items-center font-bold text-xs tracking-wider"
            style={{ backgroundColor: packageManagerColor }}
            data-testid="pack-badge"
          >
            PACK
          </div>
        </div>
      </div>
    </div>
  );
}
