'use client';

import { useState, useRef, useCallback } from 'react';
import { Check, Copy, X, Download } from 'lucide-react';
import { generateInstallScript } from '@/lib/generateInstallScript';
import { getPackageManagerById, type PackageManagerId } from '@/lib/data';

/**
 * CommandDrawer Component
 * 
 * Expandable panel showing full script preview with syntax highlighting.
 * Supports swipe-to-dismiss on mobile and keyboard navigation.
 * 
 * Requirements:
 * - 6.6: Command footer is expandable to show preview of full script
 */

interface CommandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApps: Set<string>;
  packageManagerId: PackageManagerId;
  selectedCount: number;
}

export function CommandDrawer({
  isOpen,
  onClose,
  selectedApps,
  packageManagerId,
  selectedCount,
}: CommandDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Swipe-to-dismiss state for mobile
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const DISMISS_THRESHOLD = 100;

  // Get package manager details for styling
  const packageManager = getPackageManagerById(packageManagerId);
  const pmColor = packageManager?.color || 'var(--accent)';
  const pmName = packageManager?.name || packageManagerId;

  // Generate the full script
  const script = generateInstallScript(selectedApps, packageManagerId);

  // Determine if this is a Windows package manager (PowerShell)
  const isWindows = ['winget', 'chocolatey', 'scoop'].includes(packageManagerId);
  const scriptLanguage = isWindows ? 'powershell' : 'bash';

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Handle touch start for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    // Only allow dragging down (positive delta)
    setDragOffset(Math.max(0, delta));
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > DISMISS_THRESHOLD) {
      handleClose();
    }
    setDragOffset(0);
  };

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [script]);

  // Handle copy and close
  const handleCopyAndClose = useCallback(() => {
    handleCopy();
    setTimeout(handleClose, 3000);
  }, [handleCopy, handleClose]);

  // Handle download script
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

  // Handle escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={handleClose}
        aria-hidden="true"
        style={{ 
          animation: isClosing 
            ? 'fadeOut 0.3s ease-out forwards' 
            : 'fadeIn 0.3s ease-out' 
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className="fixed z-50 bg-[var(--bg-secondary)] rounded-t-xl md:rounded-lg shadow-2xl
          bottom-0 left-0 right-0
          md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:w-[90vw]"
        style={{
          boxShadow: '0 0 0 1px var(--border-primary), 0 20px 60px -10px rgba(0, 0, 0, 0.5)',
          animation: isClosing
            ? 'slideDown 0.3s cubic-bezier(0.32, 0, 0.67, 0) forwards'
            : dragOffset > 0 ? 'none' : 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '80vh',
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid var(--border-primary)',
        }}
      >
        {/* Drawer Handle - mobile only, draggable */}
        <div
          className="flex justify-center pt-3 pb-2 md:hidden cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="w-12 h-1.5 bg-[var(--text-muted)]/40 rounded-full"
            onClick={handleClose}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-1 h-5 rounded-full" 
                style={{ backgroundColor: pmColor }}
              />
              <div>
                <h3 
                  id="drawer-title" 
                  className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Script Preview
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {selectedCount} {selectedCount === 1 ? 'app' : 'apps'} selected • {pmName}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Script Preview Content */}
        <div 
          className="p-4 overflow-y-auto bg-[var(--bg-primary)]/50" 
          style={{ maxHeight: 'calc(80vh - 140px)' }}
        >
          {/* Script code block with syntax highlighting */}
          <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] overflow-hidden shadow-sm">
            {/* Code block header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {scriptLanguage}
              </span>

              {/* Desktop action buttons */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="h-8 px-4 flex items-center gap-2 rounded-md hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all text-xs font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleCopyAndClose}
                  className={`h-8 px-4 flex items-center gap-2 rounded-md text-xs font-medium transition-all ${
                    copied
                      ? 'shadow-sm'
                      : 'hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  style={{
                    backgroundColor: copied ? pmColor : 'transparent',
                    color: copied ? '#000' : undefined,
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Script content with line numbers */}
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

        {/* Mobile Actions */}
        <div className="md:hidden flex items-stretch gap-3 px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <button
            onClick={handleDownload}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleCopyAndClose}
            className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-md font-medium text-sm active:scale-[0.98] transition-all shadow-sm ${
              copied
                ? 'text-black'
                : 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
            }`}
            style={{
              backgroundColor: copied ? pmColor : undefined,
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Simple syntax highlighting for shell/PowerShell scripts
 * Returns JSX elements with colored spans for different token types
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
  let remaining = line;
  let keyIndex = 0;

  // Shell keywords to highlight
  const shellKeywords = isWindows
    ? ['if', 'else', 'elseif', 'foreach', 'for', 'while', 'function', 'param', 'return', 'try', 'catch', 'finally', 'Write-Host', 'Write-Error', 'Write-Warning', 'exit']
    : ['if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'printf'];

  // Simple tokenization - highlight strings, keywords, and variables
  const stringRegex = isWindows ? /"[^"]*"|'[^']*'/g : /"[^"]*"|'[^']*'/g;
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
