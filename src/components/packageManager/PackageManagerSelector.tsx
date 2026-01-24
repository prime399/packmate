'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { PackageManagerIcon } from './PackageManagerIcon';
import { 
  OSId, 
  PackageManagerId, 
  getPackageManagersByOS,
  packageManagers 
} from '@/lib/data';

// Requirements: 2.2, 2.5 - Package manager selector dropdown with portal rendering

interface PackageManagerSelectorProps {
  selectedOS: OSId;
  selectedPackageManager: PackageManagerId;
  onSelect: (id: PackageManagerId) => void;
}

export function PackageManagerSelector({ 
  selectedOS, 
  selectedPackageManager, 
  onSelect 
}: PackageManagerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Get package managers filtered by selected OS
  const availablePackageManagers = getPackageManagersByOS(selectedOS);
  
  // Get current package manager details
  const currentPackageManager = packageManagers.find(pm => pm.id === selectedPackageManager);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200), // Minimum width for longer PM names
      });
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < availablePackageManagers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : availablePackageManagers.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < availablePackageManagers.length) {
            handleSelect(availablePackageManagers[focusedIndex].id);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(availablePackageManagers.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, availablePackageManagers]);

  // Reset focused index when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Find the index of the currently selected package manager
      const selectedIndex = availablePackageManagers.findIndex(
        pm => pm.id === selectedPackageManager
      );
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedPackageManager, availablePackageManagers]);

  const handleSelect = (id: PackageManagerId) => {
    onSelect(id);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleButtonKeyDown}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] transition-all duration-200 hover:shadow-sm"
        style={{ borderLeftColor: currentPackageManager?.color, borderLeftWidth: 3 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Package manager: ${currentPackageManager?.name || 'Select package manager'}`}
      >
        {currentPackageManager && (
          <PackageManagerIcon 
            iconUrl={currentPackageManager.iconUrl} 
            name={currentPackageManager.name} 
            size={18} 
          />
        )}
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {currentPackageManager?.name || 'Select Package Manager'}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-50 dropdown-animate"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
          }}
          role="listbox"
          aria-label="Package managers"
        >
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg overflow-hidden">
            {availablePackageManagers.map((pm, index) => (
              <button
                key={pm.id}
                onClick={() => handleSelect(pm.id)}
                className={`pm-option-item group w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-all duration-150 ${
                  pm.id === selectedPackageManager ? 'bg-[var(--bg-tertiary)]' : ''
                } ${focusedIndex === index ? 'ring-2 ring-inset ring-[var(--accent-primary)]' : ''}`}
                style={{ 
                  borderLeftColor: pm.color, 
                  borderLeftWidth: 3,
                  animationDelay: `${index * 30}ms`
                }}
                role="option"
                aria-selected={pm.id === selectedPackageManager}
                tabIndex={-1}
              >
                <span className="transition-transform duration-150 group-hover:scale-110">
                  <PackageManagerIcon iconUrl={pm.iconUrl} name={pm.name} size={18} />
                </span>
                <span className="text-sm text-[var(--text-primary)] transition-transform duration-150 group-hover:translate-x-0.5 flex-1">
                  {pm.name}
                </span>
                {pm.isPrimary && (
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                    Default
                  </span>
                )}
                {pm.id === selectedPackageManager && (
                  <span className="text-[var(--accent-primary)]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
