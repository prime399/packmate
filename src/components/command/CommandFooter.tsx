'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, Copy, Download, Eye, Trash2 } from 'lucide-react';
import { generateSimpleCommand, generateInstallScript } from '@/lib/generateInstallScript';
import { getPackageManagerById, type PackageManagerId } from '@/lib/data';
import { useTheme } from '@/hooks/useTheme';
import { ShortcutsBar } from './ShortcutsBar';
import { TerminalPreviewModal } from './TerminalPreviewModal';

/**
 * CommandFooter Component
 * 
 * Requirements:
 * - 3.1: Command footer uses 85% width (increased from 90% max-w-4xl)
 * - 3.2: Display a preview button that opens the Command_Drawer
 * - 3.3: Display a clear all button
 * - 3.9: Display a colored left border accent matching the package manager color
 * - 3.10: Display a soft glow effect behind the bars
 * - 6.1: Command footer appears when apps are selected
 * - 6.2: Display generated one-liner command in code block
 * - 6.3: Provide "Copy" button that copies to clipboard
 * - 6.4: Provide "Download" button that downloads full script
 * - 6.5: Show visual feedback when copy succeeds
 * - 6.7: Hide footer or show placeholder when no apps selected
 */

interface CommandFooterProps {
  selectedApps: Set<string>;
  packageManagerId: PackageManagerId;
  selectedCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  clearAll: () => void;
}

export function CommandFooter({
  selectedApps,
  packageManagerId,
  selectedCount,
  searchQuery,
  onSearchChange,
  searchInputRef,
  clearAll,
}: CommandFooterProps) {
  const [copied, setCopied] = useState(false);
  const [hasEverHadSelection, setHasEverHadSelection] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const initialCountRef = useRef(selectedCount);

  // Get package manager details for styling
  const packageManager = getPackageManagerById(packageManagerId);
  const pmColor = packageManager?.color || 'var(--accent)';
  const pmName = packageManager?.name || packageManagerId;

  // Generate the command
  const command = generateSimpleCommand(selectedApps, packageManagerId);

  // Track if user has actually interacted - hide the bar until then
  // Otherwise it just sits there looking sad with "No apps selected"
  useEffect(() => {
    if (selectedCount !== initialCountRef.current && !hasEverHadSelection) {
      setHasEverHadSelection(true);
    }
  }, [selectedCount, hasEverHadSelection]);

  // Get theme toggle function for 't' keyboard shortcut
  const { toggleTheme } = useTheme();

  // Handle copy to clipboard - Requirement 6.3, 6.5
  const handleCopy = useCallback(async () => {
    if (selectedCount === 0) return;
    
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      // Clipboard API failed (e.g., insecure context)
      console.error('Failed to copy to clipboard:', error);
      // Could show error toast here
    }
  }, [command, selectedCount]);

  // Handle download script - Requirement 6.4
  const handleDownload = useCallback(() => {
    if (selectedCount === 0) return;

    const script = generateInstallScript(selectedApps, packageManagerId);
    
    // Determine file extension and MIME type based on package manager
    const isWindows = ['winget', 'chocolatey', 'scoop'].includes(packageManagerId);
    const ext = isWindows ? 'ps1' : 'sh';
    const mimeType = isWindows ? 'text/plain' : 'text/x-shellscript';
    
    const blob = new Blob([script], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packmate-${packageManagerId}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [selectedCount, selectedApps, packageManagerId]);

  // Handle clear all - Requirement 3.3
  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  // Handle preview modal toggle - Requirement 3.2
  const handleTogglePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(prev => !prev);
  }, []);

  // Handle modal close
  const handleClosePreviewModal = useCallback(() => {
    setIsPreviewModalOpen(false);
  }, []);

  // Global keyboard shortcuts (vim-like)
  // Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 6.3, 6.4, 6.5
  useEffect(() => {
    // Only enable shortcuts after user has interacted with the footer
    if (!hasEverHadSelection) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Requirement 6.3: Skip shortcuts when in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Requirement 6.4: Skip shortcuts when modifier keys are pressed
      // (prevents conflicts with browser shortcuts like Ctrl+C, Cmd+D, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Shortcuts that always work (even with no selection)
      const alwaysEnabled = ['t', 'c'];
      
      // Requirement 6.5: Disable copy/download when selectedCount === 0
      if (selectedCount === 0 && !alwaysEnabled.includes(e.key)) return;

      switch (e.key) {
        // Requirement 3.4: 'y' key for copy
        case 'y':
          handleCopy();
          break;
        
        // Requirement 3.5: 'd' key for download
        case 'd':
          handleDownload();
          break;
        
        // Requirement 3.6: 't' key for theme toggle with flash effect
        case 't':
          document.body.classList.add('theme-flash');
          setTimeout(() => document.body.classList.remove('theme-flash'), 150);
          toggleTheme();
          break;
        
        // Requirement 3.7: 'c' key for clear all
        case 'c':
          handleClearAll();
          break;
        
        // Requirement 3.8: Tab key for modal toggle
        case 'Tab':
          e.preventDefault(); // Prevent default tab behavior
          if (selectedCount > 0) {
            handleTogglePreviewModal();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasEverHadSelection, selectedCount, toggleTheme, handleCopy, handleDownload, handleClearAll, handleTogglePreviewModal]);

  // Requirement 6.7: Hide footer when no apps selected (and never had selection)
  if (!hasEverHadSelection) {
    return null;
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 p-3"
        style={{
          zIndex: 10,
          animation: 'footerSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
        }}
      >
        {/* Requirement 3.1: 85% width */}
        <div className="relative w-[85%] mx-auto">
          {/* Requirement 3.10: Soft glow behind bars */}
          <div
            className="absolute -inset-12 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, color-mix(in srgb, ${pmColor}, transparent 85%), transparent 70%)`,
              filter: 'blur(40px)',
              opacity: 0.8,
              zIndex: -1
            }}
          />
          <div
            className="absolute -inset-8 pointer-events-none"
            style={{
              background: 'var(--bg-primary)',
              filter: 'blur(30px)',
              opacity: 1,
              zIndex: -1
            }}
          />

          {/* Requirement 3.9: Colored left border accent */}
          <div 
            className="overflow-hidden rounded-r-lg shadow-2xl"
            style={{ 
              borderLeft: `4px solid ${pmColor}`,
              boxShadow: `0 0 30px -5px color-mix(in srgb, ${pmColor}, transparent 70%)`
            }}
          >
            {/* ShortcutsBar - above command bar */}
            <ShortcutsBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              searchInputRef={searchInputRef}
              selectedCount={selectedCount}
              packageManagerName={pmName}
              packageManagerColor={pmColor}
            />

            {/* Command Bar */}
            <div className="bg-(--bg-tertiary) font-mono text-xs overflow-hidden">
              <div className="flex items-stretch">
                {/* Requirement 3.2: Preview button */}
                <button
                  onClick={handleTogglePreviewModal}
                  disabled={selectedCount === 0}
                  className={`flex items-center gap-2 px-4 py-3 border-r border-(--border-primary)/20 transition-all duration-150 font-sans text-sm ${
                    selectedCount > 0
                      ? 'text-(--text-secondary) hover:text-foreground active:scale-[0.97]'
                      : 'text-(--text-muted) opacity-50 cursor-not-allowed'
                  }`}
                  title="Preview Script (Tab)"
                  onMouseEnter={(e) => {
                    if (selectedCount > 0) {
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${pmColor}, transparent 95%)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCount > 0) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  <Eye className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="hidden sm:inline whitespace-nowrap">Preview</span>
                </button>

                {/* Command summary - Requirement 2.1, 2.2: Clickable summary showing minified command without horizontal scrollbar */}
                <button
                  onClick={handleTogglePreviewModal}
                  disabled={selectedCount === 0}
                  className={`flex-1 min-w-0 flex items-center px-4 py-4 bg-(--bg-secondary) transition-all duration-150 overflow-hidden ${
                    selectedCount > 0
                      ? 'cursor-pointer hover:bg-(--bg-secondary)/80'
                      : 'cursor-default'
                  }`}
                  title={selectedCount > 0 ? 'Click to preview script (Tab)' : undefined}
                >
                  <span 
                    className={`font-mono text-sm truncate ${
                      selectedCount > 0 
                        ? 'text-foreground' 
                        : 'text-(--text-muted)'
                    }`}
                  >
                    {selectedCount > 0 
                      ? command
                      : '# No packages selected'}
                  </span>
                </button>

                {/* Requirement 3.3: Clear all button */}
                <button
                  onClick={handleClearAll}
                  disabled={selectedCount === 0}
                  className={`flex items-center gap-2 px-4 py-3 border-l border-(--border-primary)/20 transition-all duration-150 font-sans text-sm ${
                    selectedCount > 0
                      ? 'text-(--text-secondary) hover:text-red-400 active:scale-[0.97]'
                      : 'text-(--text-muted) opacity-50 cursor-not-allowed'
                  }`}
                  title="Clear All (c)"
                >
                  <Trash2 className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="hidden sm:inline whitespace-nowrap">Clear</span>
                </button>

                {/* Download button - Requirement 6.4 */}
                <button
                  onClick={handleDownload}
                  disabled={selectedCount === 0}
                  className={`flex items-center gap-2 px-4 py-3 border-l border-(--border-primary)/20 transition-all duration-150 font-sans text-sm ${
                    selectedCount > 0
                      ? 'text-(--text-secondary) hover:text-foreground active:scale-[0.97]'
                      : 'text-(--text-muted) opacity-50 cursor-not-allowed'
                  }`}
                  title="Download Script (d)"
                  onMouseEnter={(e) => {
                    if (selectedCount > 0) {
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${pmColor}, transparent 95%)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCount > 0) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  <Download className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="hidden sm:inline whitespace-nowrap">Download</span>
                </button>

                {/* Copy button - Requirements 6.3, 6.5 */}
                <button
                  onClick={handleCopy}
                  disabled={selectedCount === 0}
                  className={`flex items-center gap-2 px-4 py-3 border-l border-(--border-primary)/20 transition-all duration-150 font-sans text-sm ${
                    selectedCount > 0
                      ? (copied
                        ? 'text-emerald-400 font-medium'
                        : 'text-(--text-secondary) hover:text-foreground active:scale-[0.97]')
                      : 'text-(--text-muted) opacity-50 cursor-not-allowed'
                  }`}
                  title="Copy Command (y)"
                  onMouseEnter={(e) => {
                    if (selectedCount > 0 && !copied) {
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${pmColor}, transparent 95%)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCount > 0 && !copied) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  {copied ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 shrink-0 opacity-70" />
                  )}
                  <span className="hidden sm:inline whitespace-nowrap">
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TerminalPreviewModal - Requirement 2.2 */}
      <TerminalPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreviewModal}
        selectedApps={selectedApps}
        packageManagerId={packageManagerId}
        selectedCount={selectedCount}
      />
    </>
  );
}
