// Unit tests for Homebrew script generator
// Validates: Requirements 4.3, 5.1

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateHomebrewScript,
  generateHomebrewCommand,
} from '@/lib/scripts/homebrew';
import { apps } from '@/lib/data';

describe('Homebrew Script Generator', () => {
  describe('generateHomebrewCommand', () => {
    it('returns placeholder for empty selection', () => {
      const result = generateHomebrewCommand(new Set());
      expect(result).toBe('# No packages selected');
    });

    it('generates simple command for formula-only packages', () => {
      // neovim is a formula (no --cask prefix)
      const result = generateHomebrewCommand(new Set(['neovim']));
      expect(result).toBe('brew install neovim');
      expect(result).not.toContain('--cask');
    });

    it('generates cask command for cask-only packages', () => {
      // firefox has --cask prefix in targets
      const result = generateHomebrewCommand(new Set(['firefox']));
      expect(result).toBe('brew install --cask firefox');
    });

    it('groups cask and formula packages separately (Requirement 4.3)', () => {
      // Mix of cask (firefox, vscode) and formula (neovim, nodejs)
      const result = generateHomebrewCommand(
        new Set(['firefox', 'neovim', 'vscode', 'nodejs'])
      );

      // Should have both brew install and brew install --cask
      expect(result).toContain('brew install');
      expect(result).toContain('brew install --cask');

      // Commands should be joined with &&
      expect(result).toContain(' && ');

      // Formula packages should be in brew install (not --cask)
      const parts = result.split(' && ');
      const formulaCmd = parts.find(
        (p) => p.startsWith('brew install') && !p.includes('--cask')
      );
      const caskCmd = parts.find((p) => p.includes('--cask'));

      expect(formulaCmd).toBeDefined();
      expect(caskCmd).toBeDefined();

      // neovim and node are formulae
      expect(formulaCmd).toContain('neovim');
      expect(formulaCmd).toContain('node');

      // firefox and visual-studio-code are casks
      expect(caskCmd).toContain('firefox');
      expect(caskCmd).toContain('visual-studio-code');
    });

    it('excludes apps without homebrew targets', () => {
      // lutris is Linux-only, no homebrew target
      const result = generateHomebrewCommand(new Set(['lutris', 'firefox']));
      expect(result).not.toContain('lutris');
      expect(result).toContain('firefox');
    });
  });

  describe('generateHomebrewScript', () => {
    it('returns minimal script for empty selection', () => {
      const result = generateHomebrewScript(new Set());
      expect(result).toContain('No packages selected');
      expect(result).toContain('exit 0');
    });

    it('includes ASCII header with metadata (Requirement 5.2)', () => {
      const result = generateHomebrewScript(new Set(['firefox']));

      // Check for header elements
      expect(result).toContain('#!/bin/bash');
      // ASCII art header contains "PACKMATE" in stylized form
      expect(result).toContain('Cross-Platform App Installer');
      expect(result).toContain('Package Manager: Homebrew');
      expect(result).toContain('Packages: 1');
      // Date in ISO format (YYYY-MM-DD)
      expect(result).toMatch(/Generated: \d{4}-\d{2}-\d{2}/);
    });

    it('includes package manager check (Requirement 5.8)', () => {
      const result = generateHomebrewScript(new Set(['firefox']));
      expect(result).toContain('command -v brew');
      expect(result).toContain('Homebrew not found');
      expect(result).toContain('https://brew.sh');
    });

    it('generates install calls with correct cask flag', () => {
      const result = generateHomebrewScript(new Set(['firefox', 'neovim']));

      // Firefox should have --cask flag
      expect(result).toContain('install_package "Firefox" "firefox" "--cask"');

      // Neovim should have empty flag (formula)
      expect(result).toContain('install_package "Neovim" "neovim" ""');
    });

    it('includes retry logic (Requirement 5.5)', () => {
      const result = generateHomebrewScript(new Set(['firefox']));
      expect(result).toContain('with_retry');
      expect(result).toContain('max_attempts');
    });

    it('includes progress display (Requirement 5.6)', () => {
      const result = generateHomebrewScript(new Set(['firefox']));
      expect(result).toContain('show_progress');
    });

    it('includes summary function (Requirement 5.7)', () => {
      const result = generateHomebrewScript(new Set(['firefox']));
      expect(result).toContain('print_summary');
    });
  });
});


// Property-Based Tests
// Feature: package-manager-integration, Property 7: Homebrew cask grouping
// **Validates: Requirements 4.3**

describe('Feature: package-manager-integration, Property 7: Homebrew cask grouping', () => {
  // Get all apps that have Homebrew targets
  const appsWithHomebrewTargets = apps.filter(app => app.targets.homebrew);
  const homebrewAppIds = appsWithHomebrewTargets.map(app => app.id);

  // Categorize apps by their Homebrew target type
  const caskAppIds = appsWithHomebrewTargets
    .filter(app => app.targets.homebrew?.startsWith('--cask '))
    .map(app => app.id);
  
  const formulaAppIds = appsWithHomebrewTargets
    .filter(app => !app.targets.homebrew?.startsWith('--cask '))
    .map(app => app.id);

  /**
   * Property 7: Homebrew cask grouping
   * 
   * For any set of selected apps with Homebrew targets, the generated command SHALL:
   * 1. Group --cask prefixed packages into a separate `brew install --cask` command
   * 2. Group non-cask packages into a `brew install` command (without --cask)
   * 3. Ensure no cask packages appear in the formula command and vice versa
   */
  it('groups cask packages into brew install --cask command', () => {
    fc.assert(
      fc.property(
        // Generate random selections of apps with Homebrew targets
        fc.uniqueArray(fc.constantFrom(...homebrewAppIds), { minLength: 1, maxLength: homebrewAppIds.length }),
        (selectedIds) => {
          const result = generateHomebrewCommand(new Set(selectedIds));
          
          // Get the selected apps that are casks
          const selectedCaskApps = selectedIds.filter(id => caskAppIds.includes(id));
          
          if (selectedCaskApps.length > 0) {
            // If there are cask apps selected, the result should contain --cask
            expect(result).toContain('--cask');
            
            // Verify each cask package appears in the --cask command
            for (const appId of selectedCaskApps) {
              const app = apps.find(a => a.id === appId);
              const caskName = app?.targets.homebrew?.replace('--cask ', '');
              if (caskName) {
                // The cask name should appear after --cask in the command
                expect(result).toContain(caskName);
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('groups formula packages into brew install command without --cask', () => {
    fc.assert(
      fc.property(
        // Generate random selections of apps with Homebrew targets
        fc.uniqueArray(fc.constantFrom(...homebrewAppIds), { minLength: 1, maxLength: homebrewAppIds.length }),
        (selectedIds) => {
          const result = generateHomebrewCommand(new Set(selectedIds));
          
          // Get the selected apps that are formulae (not casks)
          const selectedFormulaApps = selectedIds.filter(id => formulaAppIds.includes(id));
          
          if (selectedFormulaApps.length > 0) {
            // If there are formula apps selected, the result should contain brew install
            expect(result).toContain('brew install');
            
            // Verify each formula package appears in the command
            for (const appId of selectedFormulaApps) {
              const app = apps.find(a => a.id === appId);
              const formulaName = app?.targets.homebrew;
              if (formulaName) {
                expect(result).toContain(formulaName);
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ensures cask packages do not appear in formula command and vice versa', () => {
    fc.assert(
      fc.property(
        // Generate random selections that include both cask and formula apps
        fc.uniqueArray(fc.constantFrom(...homebrewAppIds), { minLength: 1, maxLength: homebrewAppIds.length }),
        (selectedIds) => {
          const result = generateHomebrewCommand(new Set(selectedIds));
          
          // Skip if no packages selected or placeholder returned
          if (result === '# No packages selected') {
            return true;
          }
          
          // Get the selected apps categorized
          const selectedCaskApps = selectedIds.filter(id => caskAppIds.includes(id));
          const selectedFormulaApps = selectedIds.filter(id => formulaAppIds.includes(id));
          
          // Split the result into separate commands
          const commands = result.split(' && ');
          
          // Find the formula command (brew install without --cask)
          const formulaCmd = commands.find(
            cmd => cmd.startsWith('brew install') && !cmd.includes('--cask')
          );
          
          // Find the cask command (brew install --cask)
          const caskCmd = commands.find(cmd => cmd.includes('brew install --cask'));
          
          // Verify cask packages are NOT in the formula command
          if (formulaCmd && selectedCaskApps.length > 0) {
            for (const appId of selectedCaskApps) {
              const app = apps.find(a => a.id === appId);
              const caskName = app?.targets.homebrew?.replace('--cask ', '');
              if (caskName) {
                // The cask name should NOT appear in the formula command
                // (unless it happens to be a substring of a formula name, which we handle by checking exact word boundaries)
                const formulaPackages = formulaCmd.replace('brew install ', '').split(' ');
                expect(formulaPackages).not.toContain(caskName);
              }
            }
          }
          
          // Verify formula packages are NOT in the cask command
          if (caskCmd && selectedFormulaApps.length > 0) {
            for (const appId of selectedFormulaApps) {
              const app = apps.find(a => a.id === appId);
              const formulaName = app?.targets.homebrew;
              if (formulaName) {
                // The formula name should NOT appear in the cask command
                const caskPackages = caskCmd.replace('brew install --cask ', '').split(' ');
                expect(caskPackages).not.toContain(formulaName);
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('produces correct command structure for mixed cask and formula selections', () => {
    fc.assert(
      fc.property(
        // Generate selections that include at least one cask and one formula when possible
        fc.tuple(
          caskAppIds.length > 0 
            ? fc.uniqueArray(fc.constantFrom(...caskAppIds), { minLength: 0, maxLength: Math.min(5, caskAppIds.length) })
            : fc.constant([]),
          formulaAppIds.length > 0
            ? fc.uniqueArray(fc.constantFrom(...formulaAppIds), { minLength: 0, maxLength: Math.min(5, formulaAppIds.length) })
            : fc.constant([])
        ),
        ([selectedCasks, selectedFormulae]) => {
          const allSelected = [...selectedCasks, ...selectedFormulae];
          
          // Skip empty selections
          if (allSelected.length === 0) {
            return true;
          }
          
          const result = generateHomebrewCommand(new Set(allSelected));
          
          // Count expected commands
          const hasCasks = selectedCasks.length > 0;
          const hasFormulae = selectedFormulae.length > 0;
          
          if (hasCasks && hasFormulae) {
            // Should have both commands joined with &&
            expect(result).toContain(' && ');
            expect(result).toContain('brew install --cask');
            // Should have a brew install without --cask
            const parts = result.split(' && ');
            const hasFormulaCmd = parts.some(p => p.startsWith('brew install') && !p.includes('--cask'));
            expect(hasFormulaCmd).toBe(true);
          } else if (hasCasks) {
            // Should only have cask command
            expect(result).toContain('brew install --cask');
            expect(result).not.toContain(' && ');
          } else if (hasFormulae) {
            // Should only have formula command
            expect(result).toContain('brew install');
            expect(result).not.toContain('--cask');
            expect(result).not.toContain(' && ');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
