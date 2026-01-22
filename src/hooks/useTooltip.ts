'use client';

import { useState, useCallback, useRef } from 'react';

// Requirement 6.4 - Tooltip positioning logic

interface TooltipState {
  isVisible: boolean;
  text: string;
  x: number;
  y: number;
}

interface UseTooltipReturn {
  tooltip: TooltipState;
  showTooltip: (text: string, event: React.MouseEvent) => void;
  hideTooltip: () => void;
}

export function useTooltip(delay: number = 300): UseTooltipReturn {
  const [tooltip, setTooltip] = useState<TooltipState>({
    isVisible: false,
    text: '',
    x: 0,
    y: 0,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback((text: string, event: React.MouseEvent) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Position tooltip below the element, centered
    const x = rect.left + rect.width / 2;
    const y = rect.bottom + 8;

    timeoutRef.current = setTimeout(() => {
      setTooltip({
        isVisible: true,
        text,
        x,
        y,
      });
    }, delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTooltip(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { tooltip, showTooltip, hideTooltip };
}
