'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { OSIcon } from './OSIcon';
import { operatingSystems, OSId, getOSById } from '@/lib/data';

// Requirements: 2.1, 2.2, 2.3 - OS selector dropdown with portal rendering

interface OSSelectorProps {
  selectedOS: OSId;
  onSelect: (id: OSId) => void;
}

export function OSSelector({ selectedOS, onSelect }: OSSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOS = getOSById(selectedOS);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (id: OSId) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] transition-colors"
        style={{ borderLeftColor: currentOS?.color, borderLeftWidth: 3 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {currentOS && (
          <OSIcon iconUrl={currentOS.iconUrl} name={currentOS.name} size={18} />
        )}
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {currentOS?.name || 'Select OS'}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        >
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg overflow-hidden">
            {operatingSystems.map((os) => (
              <button
                key={os.id}
                onClick={() => handleSelect(os.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-hover)] transition-colors ${
                  os.id === selectedOS ? 'bg-[var(--bg-tertiary)]' : ''
                }`}
                style={{ borderLeftColor: os.color, borderLeftWidth: 3 }}
                role="option"
                aria-selected={os.id === selectedOS}
              >
                <OSIcon iconUrl={os.iconUrl} name={os.name} size={18} />
                <span className="text-sm text-[var(--text-primary)]">{os.name}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
