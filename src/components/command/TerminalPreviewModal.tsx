'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { generateInstallScript } from '@/lib/generateInstallScript';
import { getPackageManagerById, type PackageManagerId } from '@/lib/data';

/**
 * TerminalPreviewModal Component
 * 
 * Displays the full installation script in a modal with syntax highlighting.
 * Supports keyboard shortcuts for copy (y), download (d), and close (Escape).
 * 
 * **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7**
 */

export interface TerminalPreviewModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Set of selected app IDs */
  selectedApps: Set<string>;
  /** The selected package manager ID */
  packageManagerId: PackageManagerId;
  /** Number of selected apps */
  selectedCount: number;
}

export function TerminalPreviewModal({
  isOpen,
  onClose,
  selectedApps,
  packageManagerId,
  selectedCount,
}: TerminalPreviewModalProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  // Get package manager details for styling
  const packageManager = getPackageManagerById(packageManagerId);
  const pmColor = packageManager?.color || 'var(--accent)';
  const pmName = packageManager?.name || packageManagerId;

  // Generate the full script
  const script = generateInstallScript(selectedApps, packageManagerId);

  // Determine if this is a Windows package manager (PowerShell)
  const isWindows = ['winget', 'chocolatey', 'scoop'].includes(packageManagerId);
  const scriptLanguage = isWindows ? 'powershell' : 'bash';

  /**
   * Handle copy to clipboard
   * **Validates: Requirements 2.4, 2.5**
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [script]);

  /**
   * Handle download script
   * **Validates: Requirements 2.4**
   */
  const handleDownload = useCallback(() => {
    const ext = isWindows ? 'ps1' : 'sh';
    const mimeType = isWindows ? 'text/plain' : 'text/x-shellscript';
    
    const blob = new Blob([script], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packmate-${packageManagerId}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [script, packageManagerId, isWindows]);

  /**
   * Handle keyboard shortcuts
   * **Validates: Requirements 2.7**
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Skip shortcuts when modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      switch (e.key) {
        // 'y' key for copy
        case 'y':
          e.preventDefault();
          handleCopy();
          break;
        
        // 'd' key for download
        case 'd':
          e.preventDefault();
          handleDownload();
          break;
        
        // Escape is handled by Modal component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCopy, handleDownload]);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      className="overflow-hidden"
    >
      {/* Header with package manager branding */}
      {/* **Validates: Requirements 2.6** */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]"
        style={{ borderLeftColor: pmColor, borderLeftWidth: '4px' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-1 h-5 rounded-full" 
            style={{ backgroundColor: pmColor }}
          />
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Script Preview
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {selectedCount} {selectedCount === 1 ? 'app' : 'apps'} selected • {pmName}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {/* **Validates: Requirements 2.4, 2.5** */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="h-9 px-4 flex items-center gap-2 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all text-sm font-medium"
            title="Download Script (d)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handleCopy}
            className={`h-9 px-4 flex items-center gap-2 rounded-md text-sm font-medium transition-all ${
              copied
                ? 'shadow-sm'
                : 'hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            style={{
              backgroundColor: copied ? pmColor : 'transparent',
              color: copied ? '#000' : undefined,
            }}
            title="Copy Script (y)"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Script Preview Content */}
      {/* **Validates: Requirements 2.3** */}
      <div 
        className="p-4 overflow-y-auto bg-[var(--bg-primary)]/50" 
        style={{ maxHeight: 'calc(80vh - 120px)' }}
      >
        {/* Script code block with syntax highlighting */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-sm">
          {/* Code block header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {scriptLanguage}
            </span>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] font-mono">y</kbd>
              <span>copy</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] font-mono">d</kbd>
              <span>download</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] font-mono">Esc</kbd>
              <span>close</span>
            </div>
          </div>

          {/* Script content with syntax highlighting */}
          <div className="p-4 font-mono text-sm overflow-x-auto bg-[var(--bg-secondary)]">
            <pre className="text-[var(--text-primary)] whitespace-pre-wrap break-words select-text">
              <code
                style={{
                  lineHeight: '1.6',
                  fontFamily: 'var(--font-mono), ui-monospace, monospace',
                }}
              >
                {highlightScript(script, isWindows)}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Simple syntax highlighting for shell/PowerShell scripts
 * Returns JSX elements with colored spans for different token types
 * 
 * Reused from CommandDrawer implementation
 */
function highlightScript(script: string, isWindows: boolean): React.ReactNode {
  const lines = script.split('\n');
  
  return lines.map((line, lineIndex) => {
    const highlightedLine = highlightLine(line, isWindows);
    return (
      <span key={lineIndex}>
        {highlightedLine}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    );
  });
}

/**
 * Highlight a single line of script
 */
function highlightLine(line: string, isWindows: boolean): React.ReactNode {
  // Comment lines
  if (line.trim().startsWith('#') || (isWindows && line.trim().startsWith('<#'))) {
    return <span style={{ color: 'var(--text-muted)' }}>{line}</span>;
  }

  // Empty lines
  if (line.trim() === '') {
    return line;
  }

  // Highlight keywords and special patterns
  const parts: React.ReactNode[] = [];
  let keyIndex = 0;

  // Shell keywords to highlight
  const shellKeywords = isWindows
    ? ['if', 'else', 'elseif', 'foreach', 'for', 'while', 'function', 'param', 'return', 'try', 'catch', 'finally', 'Write-Host', 'Write-Error', 'Write-Warning', 'exit']
    : ['if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'printf'];

  // Simple tokenization - highlight strings, keywords, and variables
  const stringRegex = /"[^"]*"|'[^']*'/g;
  const variableRegex = isWindows ? /\$\w+|\$\{[^}]+\}|\$env:\w+/g : /\$\w+|\$\{[^}]+\}/g;
  
  // Find all matches
  const matches: Array<{ start: number; end: number; type: 'string' | 'variable' | 'keyword'; text: string }> = [];
  
  // Find strings
  let match;
  while ((match = stringRegex.exec(line)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
  }
  
  // Find variables
  while ((match = variableRegex.exec(line)) !== null) {
    // Don't highlight if inside a string
    const isInsideString = matches.some(m => m.type === 'string' && match!.index >= m.start && match!.index < m.end);
    if (!isInsideString) {
      matches.push({ start: match.index, end: match.index + match[0].length, type: 'variable', text: match[0] });
    }
  }
  
  // Find keywords (word boundaries)
  for (const keyword of shellKeywords) {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'g');
    while ((match = keywordRegex.exec(line)) !== null) {
      // Don't highlight if inside a string or variable
      const isInsideOther = matches.some(m => match!.index >= m.start && match!.index < m.end);
      if (!isInsideOther) {
        matches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] });
      }
    }
  }
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Build highlighted line
  let lastEnd = 0;
  for (const m of matches) {
    // Add text before this match
    if (m.start > lastEnd) {
      parts.push(<span key={keyIndex++}>{line.slice(lastEnd, m.start)}</span>);
    }
    
    // Add highlighted match
    const color = m.type === 'string' 
      ? '#a8c97f' // green for strings
      : m.type === 'variable'
        ? '#7eb8da' // blue for variables
        : '#d4a656'; // orange for keywords
    
    parts.push(
      <span key={keyIndex++} style={{ color }}>
        {m.text}
      </span>
    );
    
    lastEnd = m.end;
  }
  
  // Add remaining text
  if (lastEnd < line.length) {
    parts.push(<span key={keyIndex++}>{line.slice(lastEnd)}</span>);
  }
  
  return parts.length > 0 ? parts : line;
}
