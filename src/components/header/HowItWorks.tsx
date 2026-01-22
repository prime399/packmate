'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

// Requirement 1.3 - Help link/popup component

export function HowItWorks() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Calculate popup position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left - 150),
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        aria-expanded={isOpen}
      >
        <HelpCircle size={16} />
        <span>How It Works</span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          className="fixed z-50 how-it-works-popup"
          style={{
            top: position.top,
            left: position.left,
            animation: 'popupSlideIn 0.2s ease-out',
          }}
        >
          <div className="w-80 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-primary)]">How It Works</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              >
                <X size={16} />
              </button>
            </div>
            <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-2">
                <span className="font-medium text-[var(--text-primary)]">1.</span>
                Select your operating system
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--text-primary)]">2.</span>
                Browse and select the apps you want
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--text-primary)]">3.</span>
                Copy the install command or download the script
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-[var(--text-primary)]">4.</span>
                Run it on your machine to install everything at once
              </li>
            </ol>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
