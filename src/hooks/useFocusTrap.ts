'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Selector for all focusable elements within a container.
 * Includes common interactive elements that can receive focus.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Custom hook for managing focus trap within modals.
 * 
 * Behavior:
 * - Captures focus when modal opens (isActive becomes true)
 * - Cycles focus through focusable elements on Tab
 * - Shift+Tab cycles focus in reverse order
 * - Returns focus to trigger element on close (isActive becomes false)
 * 
 * **Validates: Requirements 1.6**
 * 
 * @param containerRef - Ref to the container element that should trap focus
 * @param isActive - Whether the focus trap is currently active
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  // Store the element that had focus before the trap was activated
  const previousActiveElement = useRef<HTMLElement | null>(null);
  // Track if we've already stored the previous element for this activation
  const hasStoredPreviousElement = useRef(false);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(el => {
      // In test environment (jsdom), offsetWidth/Height may be 0
      // Check if element is in the DOM and not hidden
      const style = window.getComputedStyle(el);
      const isHidden = style.display === 'none' || style.visibility === 'hidden';
      return !isHidden;
    });
  }, [containerRef]);

  /**
   * Effect: Capture focus when trap becomes active
   * Store the previously focused element and focus the first focusable element
   */
  useEffect(() => {
    if (!isActive) {
      // Reset the flag when deactivated
      hasStoredPreviousElement.current = false;
      return;
    }

    // Only store the previous element once per activation
    if (!hasStoredPreviousElement.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      hasStoredPreviousElement.current = true;
    }

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Use setTimeout(0) for better test compatibility than requestAnimationFrame
      const timeoutId = setTimeout(() => {
        focusableElements[0].focus();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, getFocusableElements]);

  /**
   * Effect: Return focus to trigger element when trap is deactivated
   */
  useEffect(() => {
    return () => {
      // On unmount, restore focus to the previously focused element
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, []);

  /**
   * Effect: Handle Tab and Shift+Tab key events for focus cycling
   */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      
      // If no focusable elements, don't trap
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift+Tab: cycle backwards
      if (e.shiftKey) {
        // If focus is on first element or outside container, wrap to last
        if (activeElement === firstElement || !containerRef.current?.contains(activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab: cycle forwards
      else {
        // If focus is on last element or outside container, wrap to first
        if (activeElement === lastElement || !containerRef.current?.contains(activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef, getFocusableElements]);
}
