'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Requirement 5.1, 5.7, 5.8 - Enhanced tooltip with follow-cursor positioning

export interface TooltipState {
  content: string;
  x: number;  // Mouse X position
  y: number;  // Element top Y position
}

interface UseTooltipReturn {
  tooltip: TooltipState | null;
  show: (content: string, e: React.MouseEvent) => void;
  hide: () => void;
  tooltipMouseEnter: () => void;
  tooltipMouseLeave: () => void;
  setTooltipRef: (el: HTMLDivElement | null) => void;
}

const TOOLTIP_DELAY = 450; // 450ms delay before showing

export function useTooltip(): UseTooltipReturn {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  
  // Refs for tracking hover state and timeouts
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOverTriggerRef = useRef<boolean>(false);
  const isOverTooltipRef = useRef<boolean>(false);
  const tooltipElementRef = useRef<HTMLDivElement | null>(null);

  // Clear all timeouts helper
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Dismiss tooltip immediately
  const dismiss = useCallback(() => {
    clearTimeouts();
    isOverTriggerRef.current = false;
    isOverTooltipRef.current = false;
    setTooltip(null);
  }, [clearTimeouts]);

  // Show tooltip with delay (Requirement 5.1 - follow cursor positioning)
  const show = useCallback((content: string, e: React.MouseEvent) => {
    clearTimeouts();
    isOverTriggerRef.current = true;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Use mouse X position and element top Y position
    const x = e.clientX;
    const y = rect.top;

    // 450ms delay before showing (Requirement 5.1)
    showTimeoutRef.current = setTimeout(() => {
      setTooltip({
        content,
        x,
        y,
      });
    }, TOOLTIP_DELAY);
  }, [clearTimeouts]);

  // Hide tooltip (with check for hover persistence - Requirement 5.7)
  const hide = useCallback(() => {
    clearTimeouts();
    isOverTriggerRef.current = false;

    // Small delay to allow mouse to move to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      // Only hide if not hovering over trigger or tooltip
      if (!isOverTriggerRef.current && !isOverTooltipRef.current) {
        setTooltip(null);
      }
    }, 50);
  }, [clearTimeouts]);

  // Tooltip mouse enter - keeps tooltip visible (Requirement 5.7)
  const tooltipMouseEnter = useCallback(() => {
    clearTimeouts();
    isOverTooltipRef.current = true;
  }, [clearTimeouts]);

  // Tooltip mouse leave - hides tooltip
  const tooltipMouseLeave = useCallback(() => {
    isOverTooltipRef.current = false;
    
    // Small delay to allow mouse to move back to trigger
    hideTimeoutRef.current = setTimeout(() => {
      if (!isOverTriggerRef.current && !isOverTooltipRef.current) {
        setTooltip(null);
      }
    }, 50);
  }, []);

  // Set tooltip element reference
  const setTooltipRef = useCallback((el: HTMLDivElement | null) => {
    tooltipElementRef.current = el;
  }, []);

  // Dismiss on click, scroll, and Escape key (Requirement 5.8)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseDown = () => {
      dismiss();
    };

    const handleScroll = () => {
      dismiss();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismiss]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    tooltip,
    show,
    hide,
    tooltipMouseEnter,
    tooltipMouseLeave,
    setTooltipRef,
  };
}
