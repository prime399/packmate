import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ShortcutsBar } from '@/components/command/ShortcutsBar';

// Feature: command-footer-ux
// Property 5: Package Manager Badge Rendering
// Property 6: App Count Display
// Property 7: Search Input Callback
// **Validates: Requirements 2.1, 2.3, 2.6**

// Arbitrary generators for property tests

// Generate a valid package manager name
const packageManagerNameArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => s.trim().length > 0);

// Generate a valid hex color
const hexColorArb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

// Generate a positive integer for selected count (> 0)
const positiveCountArb = fc.integer({ min: 1, max: 1000 });

// Generate search query text (non-empty for change events)
const searchQueryArb = fc.string({ minLength: 1, maxLength: 100 });

// Default props for rendering
const defaultProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  searchInputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
  selectedCount: 0,
  packageManagerName: 'Homebrew',
  packageManagerColor: '#FBB040',
};

describe('ShortcutsBar - Property 5: Package Manager Badge Rendering', () => {
  describe('Property 5: Package Manager Badge Rendering', () => {
    it('renders badge with package manager name for any valid name', () => {
      fc.assert(
        fc.property(
          packageManagerNameArb,
          hexColorArb,
          (name, color) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                packageManagerName={name}
                packageManagerColor={color}
              />
            );
            const badge = screen.getByTestId('package-manager-badge');
            expect(badge).toBeDefined();
            expect(badge.textContent).toBe(name.toUpperCase());
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });


    it('badge has correct background color for any valid color', () => {
      fc.assert(
        fc.property(
          packageManagerNameArb,
          hexColorArb,
          (name, color) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                packageManagerName={name}
                packageManagerColor={color}
              />
            );
            const badge = screen.getByTestId('package-manager-badge');
            expect(badge.style.backgroundColor).toBeTruthy();
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('PACK badge also uses package manager color', () => {
      fc.assert(
        fc.property(
          hexColorArb,
          (color) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                packageManagerColor={color}
              />
            );
            const packBadge = screen.getByTestId('pack-badge');
            expect(packBadge).toBeDefined();
            expect(packBadge.textContent).toBe('PACK');
            expect(packBadge.style.backgroundColor).toBeTruthy();
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('ShortcutsBar - Property 6: App Count Display', () => {
  describe('Property 6: App Count Display', () => {
    it('displays count when selectedCount > 0', () => {
      fc.assert(
        fc.property(
          positiveCountArb,
          (count) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                selectedCount={count}
              />
            );
            const countDisplay = screen.getByTestId('selected-count');
            expect(countDisplay).toBeDefined();
            expect(countDisplay.textContent).toContain(String(count));
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hides count when selectedCount === 0', () => {
      const { unmount } = render(
        <ShortcutsBar
          {...defaultProps}
          selectedCount={0}
        />
      );
      const countDisplay = screen.queryByTestId('selected-count');
      expect(countDisplay).toBeNull();
      unmount();
    });

    it('displays singular "app" for count of 1', () => {
      const { unmount } = render(
        <ShortcutsBar
          {...defaultProps}
          selectedCount={1}
        />
      );
      const countDisplay = screen.getByTestId('selected-count');
      expect(countDisplay.textContent).toContain('1 app');
      expect(countDisplay.textContent).not.toContain('apps');
      unmount();
    });

    it('displays plural "apps" for count > 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 1000 }),
          (count) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                selectedCount={count}
              />
            );
            const countDisplay = screen.getByTestId('selected-count');
            expect(countDisplay.textContent).toContain('apps');
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('count display format is consistent', () => {
      fc.assert(
        fc.property(
          positiveCountArb,
          (count) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                selectedCount={count}
              />
            );
            const countDisplay = screen.getByTestId('selected-count');
            const text = countDisplay.textContent || '';
            expect(text).toMatch(/\[\d+ apps?\]/);
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('ShortcutsBar - Property 7: Search Input Callback', () => {
  describe('Property 7: Search Input Callback', () => {
    it('calls onSearchChange with input value for any text', () => {
      fc.assert(
        fc.property(
          searchQueryArb,
          (query) => {
            const onSearchChange = vi.fn();
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                onSearchChange={onSearchChange}
              />
            );
            const searchInput = screen.getByTestId('search-input');
            fireEvent.change(searchInput, { target: { value: query } });
            expect(onSearchChange).toHaveBeenCalledWith(query);
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('search input displays current searchQuery value', () => {
      fc.assert(
        fc.property(
          searchQueryArb,
          (query) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                searchQuery={query}
              />
            );
            const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
            expect(searchInput.value).toBe(query);
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('clear button calls onSearchChange with empty string', () => {
      const onSearchChange = vi.fn();
      const { unmount } = render(
        <ShortcutsBar
          {...defaultProps}
          searchQuery="test query"
          onSearchChange={onSearchChange}
        />
      );
      const clearButton = screen.getByTestId('clear-search-button');
      fireEvent.click(clearButton);
      expect(onSearchChange).toHaveBeenCalledWith('');
      unmount();
    });

    it('clear button is hidden when searchQuery is empty', () => {
      const { unmount } = render(
        <ShortcutsBar
          {...defaultProps}
          searchQuery=""
        />
      );
      const clearButton = screen.queryByTestId('clear-search-button');
      expect(clearButton).toBeNull();
      unmount();
    });

    it('clear button is visible when searchQuery is not empty', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (query) => {
            const { unmount } = render(
              <ShortcutsBar
                {...defaultProps}
                searchQuery={query}
              />
            );
            const clearButton = screen.getByTestId('clear-search-button');
            expect(clearButton).toBeDefined();
            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
