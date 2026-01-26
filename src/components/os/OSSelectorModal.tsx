'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { OSIcon } from './OSIcon';
import { operatingSystems, OSId } from '@/lib/data';

/**
 * OSSelectorModal component props interface
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.6, 3.7**
 */
export interface OSSelectorModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Currently selected OS ID */
  selectedOS: OSId;
  /** Callback function when an OS is selected */
  onSelect: (id: OSId) => void;
}

/**
 * OSSelectorModal - Modal for selecting operating system
 * 
 * Features:
 * - Grid layout of OS options (2-3 columns depending on viewport)
 * - Each option shows icon, name, and colored border accent
 * - Current selection highlighted with background color
 * - Keyboard navigation with arrow keys
 * - Auto-focus on currently selected item when opened
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.6, 3.7**
 */
export function OSSelectorModal({
  isOpen,
  onClose,
  selectedOS,
  onSelect,
}: OSSelectorModalProps): React.ReactElement {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusedIndexRef = useRef<number>(0);

  /**
   * Get the index of the currently selected OS
   */
  const getSelectedIndex = useCallback((): number => {
    const index = operatingSystems.findIndex(os => os.id === selectedOS);
    return index >= 0 ? index : 0;
  }, [selectedOS]);

  /**
   * Handle OS selection
   * **Validates: Requirements 3.5**
   */
  const handleSelect = useCallback((id: OSId) => {
    onSelect(id);
    onClose();
  }, [onSelect, onClose]);

  /**
   * Effect: Auto-focus on currently selected item when modal opens
   * **Validates: Requirements 3.6**
   */
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = getSelectedIndex();
      focusedIndexRef.current = selectedIndex;
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        optionRefs.current[selectedIndex]?.focus();
      });
    }
  }, [isOpen, getSelectedIndex]);

  /**
   * Handle keyboard navigation within the grid
   * **Validates: Requirements 3.6**
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const totalOptions = operatingSystems.length;
    const currentIndex = focusedIndexRef.current;
    let newIndex = currentIndex;

    // Calculate columns based on grid layout (responsive: 2 on mobile, 3 on larger screens)
    // For simplicity, we'll use 3 columns as the default for keyboard navigation
    const columns = 3;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Move down one row, wrap to top if at bottom
        newIndex = (currentIndex + columns) % totalOptions;
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Move up one row, wrap to bottom if at top
        newIndex = (currentIndex - columns + totalOptions) % totalOptions;
        break;
      case 'ArrowRight':
        e.preventDefault();
        // Move right one column, wrap to next row
        newIndex = (currentIndex + 1) % totalOptions;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        // Move left one column, wrap to previous row
        newIndex = (currentIndex - 1 + totalOptions) % totalOptions;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = totalOptions - 1;
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        // Select the currently focused option
        const focusedOS = operatingSystems[currentIndex];
        if (focusedOS) {
          handleSelect(focusedOS.id);
        }
        return;
      }
      default:
        return;
    }

    // Update focus
    focusedIndexRef.current = newIndex;
    optionRefs.current[newIndex]?.focus();
  }, [handleSelect]);

  /**
   * Set ref for option button
   */
  const setOptionRef = useCallback((index: number) => (el: HTMLButtonElement | null) => {
    optionRefs.current[index] = el;
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Operating System"
      maxWidth="max-w-md"
    >
      <div 
        className="p-4"
        onKeyDown={handleKeyDown}
        role="listbox"
        aria-label="Operating Systems"
      >
        {/* Grid layout: 2 columns on mobile, 3 on larger screens */}
        {/* **Validates: Requirements 3.2** */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {operatingSystems.map((os, index) => {
            const isSelected = os.id === selectedOS;
            
            return (
              <button
                key={os.id}
                ref={setOptionRef(index)}
                onClick={() => handleSelect(os.id)}
                onFocus={() => { focusedIndexRef.current = index; }}
                className={`
                  relative group flex flex-col items-center gap-2 p-4 rounded-lg
                  border-l-4 border border-[var(--border-primary)]
                  transition-all duration-150
                  hover:bg-[var(--bg-hover)] hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]
                  ${isSelected 
                    ? 'bg-[var(--bg-tertiary)] shadow-sm' 
                    : 'bg-[var(--bg-secondary)]'
                  }
                `}
                style={{ 
                  borderLeftColor: os.color,
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
              >
                {/* OS Icon */}
                {/* **Validates: Requirements 3.4** */}
                <span className="transition-transform duration-150 group-hover:scale-110">
                  <OSIcon iconUrl={os.iconUrl} name={os.name} size={32} />
                </span>
                
                {/* OS Name */}
                {/* **Validates: Requirements 3.4** */}
                <span className={`
                  text-sm font-medium text-center
                  transition-transform duration-150 group-hover:translate-y-0.5
                  ${isSelected 
                    ? 'text-[var(--text-primary)]' 
                    : 'text-[var(--text-secondary)]'
                  }
                `}>
                  {os.name}
                </span>

                {/* Selection indicator */}
                {/* **Validates: Requirements 3.3** */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent-color)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
