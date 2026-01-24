'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, Copy, Download, ChevronUp } from 'lucide-react';
import { generateSimpleCommand, generateInstallScript } from '@/lib/generateInstallScript';
import { getPackageManagerById, type PackageManagerId } from '@/lib/data';

/**
 * CommandFooter Component
 * 
 * Requirements:
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
}

export function CommandFooter({
  selectedApps,
  packageManagerId,
  selectedCount,
}: CommandFooterProps) {
  const [copied, setCopied] = useState(false);
  const [hasEverHadSelection, setHasEverHadSelection] = useState(false);
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

  // Requirement 6.7: Hide footer when no apps selected (and never had selection)
  if (!hasEverHadSelection) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-3"
      style={{
        zIndex: 10,
        animation: 'footerSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
      }}
    >
      <div className="relative w-[90%] max-w-4xl mx-auto">
        {/* Soft glow behind bar */}
        <div
          className="absolute -inset-12 pointer-events-none"
          style={{
            background: 'var(--bg-primary)',
            filter: 'blur(40px)',
            opacity: 1,
            zIndex: -1
          }}
        />

        {/* Command Bar */}
        <div 
          className="bg-(--bg-tertiary) font-mono text-xs overflow-hidden border-l-4 shadow-2xl rounded-r-lg"
          style={{ borderLeftColor: pmColor }}
        >
          <div className="flex items-stretch">
            {/* Package Manager Badge (hidden on mobile) */}
            <div
              className="hidden md:flex items-center gap-2 px-4 py-3 border-r border-(--border-primary)/20 shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, ${pmColor}, transparent 90%)`,
                color: pmColor,
              }}
            >
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap text-xs uppercase tracking-wider font-medium">
                {pmName}
              </span>
              {selectedCount > 0 && (
                <span className="text-[10px] opacity-60 ml-0.5 whitespace-nowrap">
                  [{selectedCount}]
                </span>
              )}
            </div>

            {/* Command text - Requirement 6.2 */}
            <div className="flex-1 min-w-0 flex items-center justify-center px-4 py-4 overflow-hidden bg-(--bg-secondary)">
              <code 
                className={`whitespace-nowrap overflow-x-auto leading-none text-sm font-semibold ${
                  selectedCount > 0 
                    ? 'text-foreground' 
                    : 'text-(--text-muted)'
                }`}
                style={{ scrollbarWidth: 'thin' }}
              >
                {selectedCount > 0 ? command : '# No packages selected'}
              </code>
            </div>

            {/* Download button - Requirement 6.4 */}
            <button
              onClick={handleDownload}
              disabled={selectedCount === 0}
              className={`flex items-center gap-2 px-4 py-3 border-l border-(--border-primary)/20 transition-all duration-150 font-sans text-sm ${
                selectedCount > 0
                  ? 'text-(--text-secondary) hover:text-foreground active:scale-[0.97]'
                  : 'text-(--text-muted) opacity-50 cursor-not-allowed'
              }`}
              title="Download Script"
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
              title="Copy Command"
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
  );
}
