'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { OSIcon } from './OSIcon';
import { OSSelectorModal } from './OSSelectorModal';
import { OSId, getOSById } from '@/lib/data';

/**
 * OSSelector component - Button trigger for OS selection modal
 * 
 * **Validates: Requirements 3.1, 3.5**
 * - Opens modal on click instead of dropdown
 * - Keeps button styling with colored left border
 */
interface OSSelectorProps {
  selectedOS: OSId;
  onSelect: (id: OSId) => void;
}

export function OSSelector({ selectedOS, onSelect }: OSSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentOS = getOSById(selectedOS);

  /**
   * Handle opening the modal
   * **Validates: Requirements 3.1**
   */
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  /**
   * Handle closing the modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Handle OS selection from modal
   * **Validates: Requirements 3.5**
   */
  const handleSelect = (id: OSId) => {
    onSelect(id);
    // Modal closes itself after selection
  };

  return (
    <>
      {/* Trigger button with colored left border */}
      {/* **Validates: Requirements 3.1, 3.5** */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] transition-all duration-200 hover:shadow-sm"
        style={{ borderLeftColor: currentOS?.color, borderLeftWidth: 3 }}
        aria-haspopup="dialog"
      >
        {currentOS && (
          <OSIcon iconUrl={currentOS.iconUrl} name={currentOS.name} size={18} />
        )}
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {currentOS?.name || 'Select OS'}
        </span>
        <ChevronDown 
          size={16} 
          className="text-[var(--text-muted)] transition-transform duration-200"
        />
      </button>

      {/* OS Selector Modal */}
      <OSSelectorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedOS={selectedOS}
        onSelect={handleSelect}
      />
    </>
  );
}
