'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type Category } from '@/lib/data';

// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
// Vim-style keyboard navigation hook for navigating app grid

/**
 * Represents a navigable item in the grid
 */
export interface NavItem {
  type: 'category' | 'app';
  id: string;
  category: Category;
}

/**
 * Represents the current focus position in the navigation grid
 */
export interface FocusPosition {
  col: number;
  row: number;
}

/**
 * Return type for the useKeyboardNavigation hook
 */
interface UseKeyboardNavigationReturn {
  focusPos: FocusPosition | null;
  focusedItem: NavItem | null;
  clearFocus: () => void;
  setFocusByItem: (type: 'category' | 'app', id: string) => void;
  isKeyboardNavigating: boolean;
}

/**
 * Vim-style keyboard navigation hook for navigating the app grid.
 * 
 * Behavior:
 * - Tracks focus position as (col, row) in the navigation grid
 * - Handles arrow keys (↑↓←→) and vim keys (hjkl) for navigation
 * - Space toggles the focused item's selection state
 * - Escape clears focus
 * - Distinguishes keyboard navigation (triggers scroll) from mouse selection (no scroll)
 * - Provides `isKeyboardNavigating` flag for focus ring visibility
 * 
 * @param navItems - 2D array of navigable items organized by columns
 * @param onToggleCategory - Callback when a category is toggled via Space key
 * @param onToggleApp - Callback when an app is toggled via Space key
 * @returns Navigation state and control functions
 */
export function useKeyboardNavigation(
  navItems: NavItem[][],
  onToggleCategory: (id: string) => void,
  onToggleApp: (id: string) => void
): UseKeyboardNavigationReturn {
  // Focus position state - (col, row) in the navigation grid
  const [focusPos, setFocusPos] = useState<FocusPosition | null>(null);

  // Track if focus was set via keyboard (to enable scroll) vs mouse (no scroll)
  // Requirement 1.4: scrollIntoView behavior for keyboard navigation
  // Requirement 1.6: mouse selection should not scroll
  const fromKeyboard = useRef(false);

  // Track if focus mode is keyboard (for UI highlighting)
  // Requirement 1.5: isKeyboardNavigating state for focus ring visibility
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  /**
   * Clear focus (e.g., when pressing Escape or clicking outside)
   * Requirement 1.3: Escape key to clear focus
   */
  const clearFocus = useCallback(() => setFocusPos(null), []);

  /**
   * Get the currently focused item based on focus position
   */
  const focusedItem = useMemo(() => {
    if (!focusPos) return null;
    return navItems[focusPos.col]?.[focusPos.row] || null;
  }, [navItems, focusPos]);

  /**
   * Set focus position by item type and id (from mouse - no scroll)
   * Requirement 1.6: setFocusByItem for mouse selection (no scroll)
   */
  const setFocusByItem = useCallback((type: 'category' | 'app', id: string) => {
    for (let col = 0; col < navItems.length; col++) {
      const colItems = navItems[col];
      for (let row = 0; row < colItems.length; row++) {
        if (colItems[row].type === type && colItems[row].id === id) {
          fromKeyboard.current = false; // Mouse selection - don't scroll
          setIsKeyboardNavigating(false); // Disable focus ring for mouse
          setFocusPos({ col, row });
          return;
        }
      }
    }
  }, [navItems]);

  /**
   * Keyboard event handler
   * Requirements 1.1, 1.2, 1.3: Handle arrow keys, vim keys, Space, and Escape
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Skip if modifier keys are pressed (prevents conflicts with browser shortcuts)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;

      // Requirement 1.2: Space to toggle focused item selection
      if (key === ' ') {
        e.preventDefault();
        if (focusPos) {
          const item = navItems[focusPos.col]?.[focusPos.row];
          if (item?.type === 'category') onToggleCategory(item.id);
          else if (item?.type === 'app') onToggleApp(item.id);
        }
        return;
      }

      // Navigation keys (arrow keys + vim keys) and Escape
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'j', 'k', 'h', 'l', 'Escape'].includes(key)) return;
      e.preventDefault();

      // Requirement 1.3: Escape clears focus
      if (key === 'Escape') {
        setFocusPos(null);
        return;
      }

      // Mark as keyboard navigation - will trigger scroll and focus ring
      // Requirement 1.5: Track keyboard vs mouse navigation
      fromKeyboard.current = true;
      setIsKeyboardNavigating(true);

      // Requirement 1.1: Navigate with arrow keys and vim keys
      setFocusPos(prev => {
        // If no previous focus, start at (0, 0)
        if (!prev) return { col: 0, row: 0 };

        let { col, row } = prev;
        const currentCol = navItems[col] || [];

        // Down / j - move down in current column
        if (key === 'ArrowDown' || key === 'j') {
          row = Math.min(row + 1, currentCol.length - 1);
        }
        // Up / k - move up in current column
        else if (key === 'ArrowUp' || key === 'k') {
          row = Math.max(row - 1, 0);
        }
        // Right / l - move to next column
        else if (key === 'ArrowRight' || key === 'l') {
          if (col < navItems.length - 1) {
            col++;
            // Clamp row to new column's length
            row = Math.min(row, (navItems[col]?.length || 1) - 1);
          }
        }
        // Left / h - move to previous column
        else if (key === 'ArrowLeft' || key === 'h') {
          if (col > 0) {
            col--;
            // Clamp row to new column's length
            row = Math.min(row, (navItems[col]?.length || 1) - 1);
          }
        }

        return { col, row };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navItems, focusPos, onToggleCategory, onToggleApp]);

  /**
   * Scroll focused item into view - only when navigating via keyboard
   * Requirement 1.4: Add scrollIntoView behavior for keyboard navigation
   */
  useEffect(() => {
    if (!focusPos || !fromKeyboard.current) return;

    const item = navItems[focusPos.col]?.[focusPos.row];
    if (!item) return;

    // Find visible element among duplicates (mobile/desktop layouts both render same data-nav-id)
    const elements = document.querySelectorAll<HTMLElement>(
      `[data-nav-id="${item.type}:${item.id}"]`
    );
    const el = Array.from(elements).find(e => e.offsetWidth > 0 && e.offsetHeight > 0);

    if (!el) return;

    el.scrollIntoView({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    });
  }, [focusPos, navItems]);

  return {
    focusPos,
    focusedItem,
    clearFocus,
    setFocusByItem,
    isKeyboardNavigating,
  };
}
