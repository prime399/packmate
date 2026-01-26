import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { CommandDrawer } from '@/components/command/CommandDrawer';
import { packageManagers, type PackageManagerId } from '@/lib/data';

// Feature: command-footer-ux
// Property 9: Drawer Shows Script When Open
// Property 10: Drawer Shows Count and Package Manager
// **Validates: Requirements 4.1, 4.4**

// Arbitrary generators for property tests

// Generate a valid package manager ID
const packageManagerIdArb = fc.constantFrom(
  ...packageManagers.map(pm => pm.id)
) as fc.Arbitrary<PackageManagerId>;

// Generate a positive integer for selected count
const positiveCountArb = fc.integer({ min: 1, max: 100 });

// Generate a set of app IDs
const appSetArb = fc.array(
  fc.string({ minLength: 1, maxLength: 20 }),
  { minLength: 1, maxLength: 10 }
).map(ids => new Set(ids));

// Default props for rendering
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  selectedApps: new Set(['firefox', 'chrome']),
  packageManagerId: 'homebrew' as PackageManagerId,
  selectedCount: 2,
};

describe('CommandDrawer - Property 9: Drawer Shows Script When Open', () => {
  describe('Property 9: Drawer Shows Script When Open', () => {
    it('renders script content when isOpen is true', () => {
      fc.assert(
        fc.property(
          packageManagerIdArb,
          appSetArb,
          (pmId, apps) => {
            const { unmount } = render(
              <CommandDrawer
                {...defaultProps}
                isOpen={true}
                packageManagerId={pmId}
                selectedApps={apps}
                selectedCount={apps.size}
              />
            );
            // Property: Drawer should be visible when isOpen is true
            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeDefined();
            // Property: Script preview title should be visible
            const title = screen.getByText('Script Preview');
            expect(title).toBeDefined();
            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('does not render when isOpen is false', () => {
      const { container, unmount } = render(
        <CommandDrawer
          {...defaultProps}
          isOpen={false}
        />
      );
      // Property: Drawer should not be visible when isOpen is false
      const dialog = screen.queryByRole('dialog');
      expect(dialog).toBeNull();
      expect(container.innerHTML).toBe('');
      unmount();
    });

    it('shows code block with script language indicator', () => {
      fc.assert(
        fc.property(
          packageManagerIdArb,
          (pmId) => {
            const { unmount } = render(
              <CommandDrawer
                {...defaultProps}
                isOpen={true}
                packageManagerId={pmId}
              />
            );
            // Property: Should show script language (bash or powershell)
            const isWindows = ['winget', 'chocolatey', 'scoop'].includes(pmId);
            const expectedLang = isWindows ? 'powershell' : 'bash';
            const langIndicator = screen.getByText(expectedLang);
            expect(langIndicator).toBeDefined();
            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

describe('CommandDrawer - Property 10: Drawer Shows Count and Package Manager', () => {
  describe('Property 10: Drawer Shows Count and Package Manager', () => {
    it('displays selected count in drawer header', () => {
      fc.assert(
        fc.property(
          positiveCountArb,
          (count) => {
            const apps = new Set(Array.from({ length: count }, (_, i) => `app-${i}`));
            const { unmount } = render(
              <CommandDrawer
                {...defaultProps}
                isOpen={true}
                selectedApps={apps}
                selectedCount={count}
              />
            );
            // Property: Count should be displayed in the drawer
            const countElement = screen.getByText(new RegExp(`${count} apps? selected`));
            expect(countElement).toBeDefined();
            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('displays package manager name in drawer header', () => {
      fc.assert(
        fc.property(
          packageManagerIdArb,
          (pmId) => {
            const pm = packageManagers.find(p => p.id === pmId);
            const { unmount } = render(
              <CommandDrawer
                {...defaultProps}
                isOpen={true}
                packageManagerId={pmId}
              />
            );
            // Property: Package manager name should be displayed in the header
            if (pm) {
              // Escape special regex characters in package manager name (e.g., parentheses)
              const escapedName = pm.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              // Use getAllByText since the name appears in multiple places (header and script)
              const pmElements = screen.getAllByText(new RegExp(escapedName, 'i'));
              expect(pmElements.length).toBeGreaterThan(0);
            }
            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('shows singular "app" for count of 1', () => {
      const { unmount } = render(
        <CommandDrawer
          {...defaultProps}
          isOpen={true}
          selectedApps={new Set(['firefox'])}
          selectedCount={1}
        />
      );
      // Property: Should show "1 app" (singular)
      const countElement = screen.getByText(/1 app selected/);
      expect(countElement).toBeDefined();
      expect(countElement.textContent).not.toContain('apps');
      unmount();
    });

    it('shows plural "apps" for count > 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          (count) => {
            const apps = new Set(Array.from({ length: count }, (_, i) => `app-${i}`));
            const { unmount } = render(
              <CommandDrawer
                {...defaultProps}
                isOpen={true}
                selectedApps={apps}
                selectedCount={count}
              />
            );
            // Property: Should show "N apps" (plural) for count > 1
            const countElement = screen.getByText(new RegExp(`${count} apps selected`));
            expect(countElement).toBeDefined();
            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('has copy and download buttons', () => {
      const { unmount } = render(
        <CommandDrawer
          {...defaultProps}
          isOpen={true}
        />
      );
      // Property: Copy and Download buttons should be present
      const copyButton = screen.getAllByText('Copy');
      const downloadButton = screen.getAllByText('Download');
      expect(copyButton.length).toBeGreaterThan(0);
      expect(downloadButton.length).toBeGreaterThan(0);
      unmount();
    });

    it('has close button', () => {
      const { unmount } = render(
        <CommandDrawer
          {...defaultProps}
          isOpen={true}
        />
      );
      // Property: Close button should be present
      const closeButton = screen.getByLabelText('Close drawer');
      expect(closeButton).toBeDefined();
      unmount();
    });
  });
});
