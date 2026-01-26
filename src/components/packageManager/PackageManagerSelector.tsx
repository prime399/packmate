'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PackageManagerIcon } from './PackageManagerIcon';
import { PackageManagerSelectorModal } from './PackageManagerSelectorModal';
import { 
  OSId, 
  PackageManagerId, 
  packageManagers 
} from '@/lib/data';

/**
 * PackageManagerSelector component - Button trigger for package manager selection modal
 * 
 * **Validates: Requirements 4.1, 4.5**
 * - Opens modal on click instead of dropdown
 * - Keeps button styling with colored left border
 */
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current package manager details
  const currentPackageManager = packageManagers.find(pm => pm.id === selectedPackageManager);

  /**
   * Handle opening the modal
   * **Validates: Requirements 4.1**
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
   * Handle package manager selection from modal
   * **Validates: Requirements 4.5**
   */
  const handleSelect = (id: PackageManagerId) => {
    onSelect(id);
    // Modal closes itself after selection
  };

  return (
    <>
      {/* Trigger button with colored left border */}
      {/* **Validates: Requirements 4.1, 4.5** */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] transition-all duration-200 hover:shadow-sm"
        style={{ borderLeftColor: currentPackageManager?.color, borderLeftWidth: 3 }}
        aria-haspopup="dialog"
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
          className="text-[var(--text-muted)] transition-transform duration-200"
        />
      </button>

      {/* Package Manager Selector Modal */}
      <PackageManagerSelectorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedOS={selectedOS}
        selectedPackageManager={selectedPackageManager}
        onSelect={handleSelect}
      />
    </>
  );
}
