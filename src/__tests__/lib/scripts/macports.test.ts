// Unit tests for MacPorts script generator
// Validates: Requirement 5.1

import { describe, it, expect } from 'vitest';
import {
  generateMacPortsScript,
  generateMacPortsCommand,
} from '@/lib/scripts/macports';

describe('MacPorts Script Generator', () => {
  describe('generateMacPortsCommand', () => {
    it('returns placeholder for empty selection', () => {
      const result = generateMacPortsCommand(new Set());
      expect(result).toBe('# No packages selected');
    });

    it('generates sudo port install command', () => {
      // firefox has macports target
      const result = generateMacPortsCommand(new Set(['firefox']));
      expect(result).toBe('sudo port install firefox');
    });

    it('includes multiple packages in single command', () => {
      // firefox and vlc both have macports targets
      const result = generateMacPortsCommand(new Set(['firefox', 'vlc']));
      expect(result).toContain('sudo port install');
      expect(result).toContain('firefox');
      expect(result).toContain('VLC'); // MacPorts uses VLC (uppercase)
    });

    it('excludes apps without macports targets', () => {
      // chrome doesn't have macports target
      const result = generateMacPortsCommand(new Set(['chrome', 'firefox']));
      expect(result).not.toContain('chrome');
      expect(result).toContain('firefox');
    });
  });

  describe('generateMacPortsScript', () => {
    it('returns minimal script for empty selection', () => {
      const result = generateMacPortsScript(new Set());
      expect(result).toContain('No packages selected');
      expect(result).toContain('exit 0');
    });

    it('includes ASCII header with metadata (Requirement 5.2)', () => {
      const result = generateMacPortsScript(new Set(['firefox']));

      // Check for header elements
      expect(result).toContain('#!/bin/bash');
      // ASCII art header contains "PACKMATE" in stylized form
      expect(result).toContain('Cross-Platform App Installer');
      expect(result).toContain('Package Manager: MacPorts');
      expect(result).toContain('Packages: 1');
      // Date in ISO format (YYYY-MM-DD)
      expect(result).toMatch(/Generated: \d{4}-\d{2}-\d{2}/);
    });

    it('includes package manager check (Requirement 5.8)', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('command -v port');
      expect(result).toContain('MacPorts not found');
      expect(result).toContain('macports.org');
    });

    it('requires root privileges', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('EUID');
      expect(result).toContain('requires root privileges');
    });

    it('generates install calls for packages', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('install_package "Firefox" "firefox"');
    });

    it('includes retry logic (Requirement 5.5)', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('with_retry');
      expect(result).toContain('max_attempts');
    });

    it('includes progress display (Requirement 5.6)', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('show_progress');
    });

    it('includes summary function (Requirement 5.7)', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('print_summary');
    });

    it('includes selfupdate command', () => {
      const result = generateMacPortsScript(new Set(['firefox']));
      expect(result).toContain('port selfupdate');
    });
  });
});
