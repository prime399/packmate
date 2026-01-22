'use client';

import { createPortal } from 'react-dom';

// Requirement 6.4 - Tooltip component with portal rendering

interface TooltipProps {
  isVisible: boolean;
  text: string;
  x: number;
  y: number;
}

export function Tooltip({ isVisible, text, x, y }: TooltipProps) {
  if (!isVisible || typeof document === 'undefined') {
    return null;
  }

  // Adjust position to keep tooltip within viewport
  const adjustedX = Math.min(Math.max(x, 100), window.innerWidth - 100);

  return createPortal(
    <div
      className="fixed z-50 pointer-events-none tooltip-animate"
      style={{
        left: adjustedX,
        top: y,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-w-xs">
        {text}
      </div>
    </div>,
    document.body
  );
}
