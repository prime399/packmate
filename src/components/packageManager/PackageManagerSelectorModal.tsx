'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { PackageManagerIcon } from './PackageManagerIcon';
import { OSId, PackageManagerId, getPackageManagersByOS } from '@/lib/data';

/**
 * PackageManagerSelectorModal component props interface
 * 
 * **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.8**
 */
export interface PackageManagerSelectorModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Currently selected OS ID (used to filter package managers) */
  selectedOS: OSId;
  /** Currently selected package manager ID */
  selectedPackageManager: PackageManagerId;
  /** Callback function when a package manager is selected */
  onSelect: (id: PackageManagerId) => void;
}

/**
 * PackageManagerSelectorModal - Modal for selecting package manager
 * 
 * Features:
 * - List layout of package managers filtered by OS
 * - "Default" badge for primary package managers
 * - Checkmark indicator for current selection
 * - Colored border accent per package manager
 * - Full keyboard navigation (arrows, Home, End, Enter, Escape)
 * - Auto-focus on currently selected item when opened
 * 
 * **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.8**
 */
export function PackageManagerSelectorModal({
  isOpen,
  onClose,
  selectedOS,
  selectedPackageManager,
  onSelect,
}: PackageManagerSelectorModalProps): React.ReactElement {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusedIndexRef = useRef<number>(0);

  /**
   * Get package managers filtered by selected OS
   * **Validates: Requirements 4.2**
   */
  const availablePackageManagers = getPackageManagersByOS(selectedOS);

  /**
   * Get the index of the currently selected package manager
   */
  const getSelectedIndex = useCallback((): number => {
    const index = availablePackageManagers.findIndex(pm => pm.id === selectedPackageManager);
    return index >= 0 ? index : 0;
  }, [selectedPackageManager, availablePackageManagers]);

  /**
   * Handle package manager selection
   * **Validates: Requirements 4.5**
   */
  const handleSelect = useCallback((id: PackageManagerId) => {
    onSelect(id);
    onClose();
  }, [onSelect, onClose]);

  /**
   * Effect: Auto-focus on currently selected item when modal opens
   * **Validates: Requirements 4.6**
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
   * Handle keyboard navigation within the list
   * **Validates: Requirements 4.6**
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const totalOptions = availablePackageManagers.length;
    if (totalOptions === 0) return;

    const currentIndex = focusedIndexRef.current;
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Move down one item, wrap to top if at bottom
        newIndex = (currentIndex + 1) % totalOptions;
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Move up one item, wrap to bottom if at top
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
        const focusedPM = availablePackageManagers[currentIndex];
        if (focusedPM) {
          handleSelect(focusedPM.id);
        }
        return;
      }
      default:
        return;
    }

    // Update focus
    focusedIndexRef.current = newIndex;
    optionRefs.current[newIndex]?.focus();
  }, [availablePackageManagers, handleSelect]);

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
      title="Select Package Manager"
      maxWidth="max-w-sm"
    >
      <div 
        className="p-4"
        onKeyDown={handleKeyDown}
        role="listbox"
        aria-label="Package Managers"
      >
        {/* List layout of package managers */}
        {/* **Validates: Requirements 4.2** */}
        <div className="flex flex-col gap-2">
          {availablePackageManagers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No package managers available for this operating system.
            </p>
          ) : (
            availablePackageManagers.map((pm, index) => {
              const isSelected = pm.id === selectedPackageManager;
              
              return (
                <button
                  key={pm.id}
                  ref={setOptionRef(index)}
                  onClick={() => handleSelect(pm.id)}
                  onFocus={() => { focusedIndexRef.current = index; }}
                  className={`
                    relative group flex items-center gap-3 px-4 py-3 rounded-lg
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
                    borderLeftColor: pm.color,
                  }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  {/* Package Manager Icon */}
                  {/* **Validates: Requirements 4.8** */}
                  <span className="transition-transform duration-150 group-hover:scale-110 flex-shrink-0">
                    <PackageManagerIcon iconUrl={pm.iconUrl} name={pm.name} size={24} />
                  </span>
                  
                  {/* Package Manager Name */}
                  {/* **Validates: Requirements 4.8** */}
                  <span className={`
                    text-sm font-medium flex-1 text-left
                    transition-transform duration-150 group-hover:translate-x-0.5
                    ${isSelected 
                      ? 'text-[var(--text-primary)]' 
                      : 'text-[var(--text-secondary)]'
                    }
                  `}>
                    {pm.name}
                  </span>

                  {/* Default badge for primary package managers */}
                  {/* **Validates: Requirements 4.4** */}
                  {pm.isPrimary && (
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded flex-shrink-0">
                      Default
                    </span>
                  )}

                  {/* Checkmark indicator for current selection */}
                  {/* **Validates: Requirements 4.3** */}
                  {isSelected && (
                    <span className="text-[var(--accent-color)] flex-shrink-0">
                      <Check size={18} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
