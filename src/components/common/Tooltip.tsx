'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { type TooltipState } from '@/hooks/useTooltip';

// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
// Rich tooltip with follow-cursor positioning, markdown formatting, and edge adjustment

interface TooltipProps {
  tooltip: TooltipState | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  setRef?: (el: HTMLDivElement | null) => void;
}

/**
 * Follow-cursor tooltip that appears on hover.
 * Desktop only (hidden on mobile) - mobile users don't have a cursor to follow.
 * Supports markdown-ish formatting: **bold**, `code`, and [links](url).
 * 
 * Features:
 * - Follow-cursor positioning (uses mouse X, element top Y)
 * - Markdown-ish formatting: **bold**, `code`, [links](url)
 * - Right-anchor adjustment when near viewport edge (x + 300 > viewport)
 * - Arrow indicator pointing to cursor
 * - 300px fixed width with word wrapping
 * - Fade in/out transitions
 * - Hidden on mobile (md:block)
 */
export function Tooltip({ tooltip, onMouseEnter, onMouseLeave, setRef }: TooltipProps): React.ReactElement | null {
  const [current, setCurrent] = useState<TooltipState | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle tooltip state changes with fade transitions (Requirement 5.6)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (tooltip) {
      // Show tooltip immediately, then fade in
      setCurrent(tooltip);
      requestAnimationFrame(() => setVisible(true));
    } else {
      // Fade out first, then remove from DOM
      setVisible(false);
      timeoutRef.current = setTimeout(() => setCurrent(null), 60);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tooltip]);

  // Don't render if no tooltip state or during SSR
  if (!current || typeof document === 'undefined') return null;

  /**
   * Render content with markdown-ish formatting (Requirement 5.2)
   * Supports: **bold**, `code`, [links](url)
   */
  const renderContent = (text: string): React.ReactNode[] => {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
      // Bold text: **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-medium text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Code: `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1 py-0.5 rounded bg-black/20 font-mono text-[var(--accent)] text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Links: [text](url)
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <a
              key={i}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline underline-offset-2 hover:brightness-125 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {match[1]}
            </a>
          );
        }
      }
      // Plain text
      return <span key={i}>{part}</span>;
    });
  };

  // Right-anchor adjustment when near viewport edge (Requirement 5.3)
  // If tooltip would overflow right edge, anchor it to the right instead
  const isRightAnchored = typeof window !== 'undefined' && (current.x + 300 > window.innerWidth);
  
  // Transform to position tooltip relative to cursor
  // Default: tooltip starts 22px left of cursor (arrow at ~16px from left edge)
  // Right-anchored: tooltip shifts left so it stays within viewport
  const contentTransform = isRightAnchored ? 'translateX(-278px)' : 'translateX(-22px)';

  return createPortal(
    <div
      ref={setRef}
      role="tooltip"
      // Hidden on mobile (Requirement 5.9), pointer-events-auto for hover persistence
      className="fixed hidden md:block pointer-events-auto z-[9999]"
      // Follow-cursor positioning (Requirement 5.1): mouse X, element top Y - 12px for clearance
      style={{ left: current.x, top: current.y - 12 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`
          absolute left-0 bottom-0
          transition-opacity duration-75
          ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Tooltip content box with left border accent (Requirement 5.5 - 300px fixed width) */}
        <div
          className="px-3.5 py-2.5 shadow-lg overflow-hidden border-l-4 relative"
          style={{
            minWidth: '300px',
            maxWidth: '300px',
            backgroundColor: 'var(--bg-secondary)',
            borderLeftColor: 'var(--accent)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transform: contentTransform,
          }}
        >
          {/* Content with word wrapping (Requirement 5.5) */}
          <p
            className="text-[13px] leading-[1.55] text-[var(--text-secondary)] break-words"
            style={{ wordBreak: 'break-word' }}
          >
            {renderContent(current.content)}
          </p>
        </div>

        {/* Arrow indicator pointing to cursor (Requirement 5.4) */}
        <div
          className="absolute left-0 -bottom-[6px]"
          style={{ transform: 'translateX(-6px)' }}
        >
          <div
            className="w-3 h-3 rotate-45"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// Export renderContent for testing (Property 12: Tooltip Markdown Parsing)
export function renderTooltipContent(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    // Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-medium text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Code: `code`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-black/20 font-mono text-[var(--accent)] text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Links: [text](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline underline-offset-2 hover:brightness-125 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {match[1]}
          </a>
        );
      }
    }
    // Plain text
    return <span key={i}>{part}</span>;
  });
}

// Export edge adjustment calculation for testing (Property 13: Tooltip Edge Adjustment)
export function calculateTooltipPosition(x: number, viewportWidth: number): {
  isRightAnchored: boolean;
  transform: string;
} {
  const isRightAnchored = x + 300 > viewportWidth;
  const transform = isRightAnchored ? 'translateX(-278px)' : 'translateX(-22px)';
  return { isRightAnchored, transform };
}
