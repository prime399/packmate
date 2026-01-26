'use client';

import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/**
 * Modal component props interface
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 5.1, 5.3, 5.5**
 */
export interface ModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Content to render inside the modal */
  children: React.ReactNode;
  /** Optional title for the modal header */
  title?: string;
  /** Optional custom ID for the title element (for aria-labelledby) */
  titleId?: string;
  /** Optional max width class (e.g., 'max-w-md', 'max-w-lg', 'max-w-2xl') */
  maxWidth?: string;
  /** Optional additional CSS classes for the content panel */
  className?: string;
}

/**
 * Framer Motion animation variants for the backdrop
 * **Validates: Requirements 5.1**
 */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Framer Motion animation variants for the modal content panel
 * **Validates: Requirements 1.5, 5.3**
 */
const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const
    }
  }
};

/**
 * Reusable Modal component that handles all common modal behavior.
 * 
 * Features:
 * - React Portal rendering to document.body
 * - Backdrop with blur effect (backdrop-blur-sm) and semi-transparent background (bg-black/30)
 * - Centered content panel with Framer Motion animations
 * - Backdrop click and Escape key to close
 * - Body scroll lock when open
 * - Focus trap via useFocusTrap hook
 * - ARIA attributes for accessibility (role="dialog", aria-modal="true", aria-labelledby)
 * - Configurable max width via props
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 5.1, 5.3, 5.5**
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  titleId: customTitleId,
  maxWidth = 'max-w-lg',
  className = '',
}: ModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();
  const titleId = customTitleId || generatedTitleId;

  // Focus trap for keyboard navigation within modal
  // **Validates: Requirements 1.6**
  useFocusTrap(modalRef, isOpen);

  /**
   * Effect: Handle Escape key to close modal
   * **Validates: Requirements 1.3**
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /**
   * Effect: Body scroll lock when modal is open
   * **Validates: Requirements 1.9**
   */
  useEffect(() => {
    if (!isOpen) return;

    // Store original overflow style
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  /**
   * Handle backdrop click to close modal
   * **Validates: Requirements 1.2**
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render during SSR
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          // Backdrop with blur effect and semi-transparent background
          // **Validates: Requirements 1.1, 5.1**
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          // ARIA attributes for accessibility
          // **Validates: Requirements 1.7**
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            // Modal content panel with consistent styling
            // **Validates: Requirements 1.4, 1.8, 5.3**
            className={`
              relative w-full ${maxWidth}
              bg-[var(--bg-primary)] 
              rounded-lg shadow-2xl
              mx-4
              ${className}
            `.trim()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // ARIA attributes for accessibility
            // **Validates: Requirements 1.7**
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Optional title header */}
            {title && (
              <div className="px-6 py-4 border-b border-[var(--border-color)]">
                <h2 
                  id={titleId}
                  className="text-lg font-semibold text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              </div>
            )}
            
            {/* Modal content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
