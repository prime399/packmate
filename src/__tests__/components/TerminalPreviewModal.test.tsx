import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { TerminalPreviewModal } from '@/components/command/TerminalPreviewModal';
import { generateInstallScript } from '@/lib/generateInstallScript';
import {
  apps,
  packageManagers,
  getPackageManagerById,
  type PackageManagerId,
} from '@/lib/data';

/**
 * Feature: modal-popup-selectors
 * Property 4: Terminal Preview Content Correctness
 *
 * **Validates: Requirements 2.3, 2.6**
 *
 * Property Definition:
 * For any set of selected apps and package manager ID, the Terminal Preview modal
 * SHALL display the complete generated script (matching generateInstallScript output)
 * and the header SHALL show the correct package manager name and app count.
 */

// Get all valid app IDs from the apps catalog
const validAppIds = apps.map((app) => app.id);

// Get all valid package manager IDs
const validPackageManagerIds = packageManagers.map((pm) => pm.id);

/**
 * Arbitrary for generating a random subset of app IDs
 * Generates between 0 and 10 apps for reasonable test performance
 */
const selectedAppsArbitrary = fc
  .subarray(validAppIds, { minLength: 0, maxLength: 10 })
  .map((ids) => new Set(ids));

/**
 * Arbitrary for generating a valid package manager ID
 */
const packageManagerIdArbitrary = fc.constantFrom(
  ...validPackageManagerIds
) as fc.Arbitrary<PackageManagerId>;

/**
 * Arbitrary for generating test configurations combining apps and package manager
 */
const terminalPreviewConfigArbitrary = fc.record({
  selectedApps: selectedAppsArbitrary,
  packageManagerId: packageManagerIdArbitrary,
});

describe('TerminalPreviewModal - Property-Based Tests', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 4: Terminal Preview Content Correctness
   *
   * **Validates: Requirements 2.3, 2.6**
   */

  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = '';

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Property 4: Terminal Preview Content Correctness', () => {
    /**
     * Property: For any set of selected apps and package manager ID, the Terminal Preview
     * modal SHALL display the complete generated script (matching generateInstallScript output)
     * and the header SHALL show the correct package manager name and app count.
     *
     * **Validates: Requirements 2.3, 2.6**
     */

    it('should display the complete generated script matching generateInstallScript output for any app selection and package manager', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          // Generate the expected script using the same function the component uses
          const expectedScript = generateInstallScript(
            selectedApps,
            packageManagerId
          );

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act & Assert - Find the script content in the modal
          // The script is rendered inside a <code> element within a <pre>
          const codeElement = document.querySelector('pre code');
          expect(codeElement).not.toBeNull();

          if (codeElement) {
            // Get the text content of the code element (strips HTML tags from syntax highlighting)
            const displayedScript = codeElement.textContent || '';

            // The displayed script should match the expected script exactly
            // (accounting for the fact that syntax highlighting adds spans but text content remains the same)
            expect(displayedScript).toBe(expectedScript);
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should display the correct package manager name in the header for any package manager', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          // Get the expected package manager name
          const packageManager = getPackageManagerById(packageManagerId);
          const expectedPmName = packageManager?.name || packageManagerId;

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act & Assert - The package manager name should appear in the header
          // The header shows: "{count} apps selected • {pmName}"
          const headerParagraph = document.querySelector('p.text-sm');
          expect(headerParagraph).not.toBeNull();
          expect(headerParagraph?.textContent).toContain(expectedPmName);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should display the correct app count in the header for any selection size', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          // Expected text format: "{count} app(s) selected"
          const expectedCountText =
            selectedCount === 1
              ? '1 app selected'
              : `${selectedCount} apps selected`;

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act & Assert - The app count should appear in the header
          const headerParagraph = document.querySelector('p.text-sm');
          expect(headerParagraph).not.toBeNull();
          expect(headerParagraph?.textContent).toContain(expectedCountText);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should display both package manager name and app count together in the header', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          // Get expected values
          const packageManager = getPackageManagerById(packageManagerId);
          const expectedPmName = packageManager?.name || packageManagerId;
          const appWord = selectedCount === 1 ? 'app' : 'apps';
          const expectedHeaderContent = `${selectedCount} ${appWord} selected • ${expectedPmName}`;

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act & Assert - Find the header paragraph with both count and PM name
          const headerParagraph = document.querySelector('p.text-sm');
          expect(headerParagraph).not.toBeNull();
          expect(headerParagraph?.textContent).toBe(expectedHeaderContent);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should handle empty app selection correctly', () => {
      fc.assert(
        fc.property(packageManagerIdArbitrary, (packageManagerId) => {
          // Arrange
          const selectedApps = new Set<string>();
          const selectedCount = 0;
          const onClose = vi.fn();

          // Expected script for empty selection
          const expectedScript = generateInstallScript(
            selectedApps,
            packageManagerId
          );

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act & Assert - Script should show "# No packages selected"
          const codeElement = document.querySelector('pre code');
          expect(codeElement).not.toBeNull();

          if (codeElement) {
            const displayedScript = codeElement.textContent || '';
            expect(displayedScript).toBe(expectedScript);
            expect(displayedScript).toBe('# No packages selected');
          }

          // Header should show "0 apps selected"
          const headerParagraph = document.querySelector('p.text-sm');
          expect(headerParagraph).not.toBeNull();
          expect(headerParagraph?.textContent).toContain('0 apps selected');

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should display script content that is consistent with generateInstallScript for all package managers', () => {
      // Test each package manager explicitly to ensure coverage
      fc.assert(
        fc.property(
          selectedAppsArbitrary,
          fc.constantFrom(...validPackageManagerIds) as fc.Arbitrary<PackageManagerId>,
          (selectedApps, packageManagerId) => {
            // Arrange
            const selectedCount = selectedApps.size;
            const onClose = vi.fn();

            // Generate expected script
            const expectedScript = generateInstallScript(
              selectedApps,
              packageManagerId
            );

            const { unmount } = render(
              <TerminalPreviewModal
                isOpen={true}
                onClose={onClose}
                selectedApps={selectedApps}
                packageManagerId={packageManagerId}
                selectedCount={selectedCount}
              />
            );

            // Act & Assert
            const codeElement = document.querySelector('pre code');
            expect(codeElement).not.toBeNull();

            if (codeElement) {
              const displayedScript = codeElement.textContent || '';

              // Verify the script matches exactly
              expect(displayedScript).toBe(expectedScript);

              // Additional verification: if apps are selected, script should not be empty comment
              if (selectedApps.size > 0) {
                // Script might still be "# No packages selected" if none of the apps
                // have targets for this package manager, which is valid behavior
                expect(displayedScript.length).toBeGreaterThan(0);
              }
            }

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });
});

/**
 * Feature: modal-popup-selectors
 * Property 5: Terminal Preview Keyboard Shortcuts
 *
 * **Validates: Requirements 2.7**
 *
 * Property Definition:
 * For any open Terminal Preview modal, pressing 'y' SHALL trigger the copy action,
 * pressing 'd' SHALL trigger the download action, and pressing 'Escape' SHALL close the modal.
 */
describe('TerminalPreviewModal - Property 5: Keyboard Shortcuts', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 5: Terminal Preview Keyboard Shortcuts
   *
   * **Validates: Requirements 2.7**
   */

  // Mock clipboard API
  let clipboardWriteTextMock: ReturnType<typeof vi.fn>;
  
  // Mock URL.createObjectURL and URL.revokeObjectURL for download
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  
  // Mock document.createElement for download anchor
  let originalCreateElement: typeof document.createElement;
  let mockAnchorClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = '';

    // Mock clipboard API
    clipboardWriteTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardWriteTextMock,
      },
    });

    // Mock URL methods for download functionality
    createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock as unknown as typeof URL.createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURLMock as unknown as typeof URL.revokeObjectURL;

    // Mock anchor element creation for download
    mockAnchorClick = vi.fn();
    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = mockAnchorClick as unknown as typeof anchor.click;
        return anchor;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  /**
   * Helper function to dispatch a keyboard event on document
   * (Modal component listens on document for Escape key)
   */
  const dispatchKeyboardEvent = (key: string, options: Partial<KeyboardEventInit> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    // Dispatch on document since Modal listens on document for Escape
    // and TerminalPreviewModal listens on window for 'y' and 'd'
    if (key === 'Escape') {
      document.dispatchEvent(event);
    } else {
      window.dispatchEvent(event);
    }
    return event;
  };

  describe('Property: Pressing "y" SHALL trigger the copy action', () => {
    /**
     * Property: For any open Terminal Preview modal with any valid configuration,
     * pressing the 'y' key SHALL trigger the copy action (clipboard.writeText).
     *
     * **Validates: Requirements 2.7**
     */
    it('should trigger copy action when "y" is pressed for any app selection and package manager', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          // Reset mock for each iteration
          clipboardWriteTextMock.mockClear();

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act - Press 'y' key
          dispatchKeyboardEvent('y');

          // Assert - Copy action should be triggered
          expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1);

          // Verify the correct script was copied
          const expectedScript = generateInstallScript(selectedApps, packageManagerId);
          expect(clipboardWriteTextMock).toHaveBeenCalledWith(expectedScript);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should NOT trigger copy when "y" is pressed with modifier keys', () => {
      fc.assert(
        fc.property(
          terminalPreviewConfigArbitrary,
          fc.constantFrom('ctrlKey', 'altKey', 'metaKey') as fc.Arbitrary<'ctrlKey' | 'altKey' | 'metaKey'>,
          (config, modifierKey) => {
            // Arrange
            const { selectedApps, packageManagerId } = config;
            const selectedCount = selectedApps.size;
            const onClose = vi.fn();

            clipboardWriteTextMock.mockClear();

            const { unmount } = render(
              <TerminalPreviewModal
                isOpen={true}
                onClose={onClose}
                selectedApps={selectedApps}
                packageManagerId={packageManagerId}
                selectedCount={selectedCount}
              />
            );

            // Act - Press 'y' with modifier key
            dispatchKeyboardEvent('y', { [modifierKey]: true });

            // Assert - Copy action should NOT be triggered
            expect(clipboardWriteTextMock).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });

  describe('Property: Pressing "d" SHALL trigger the download action', () => {
    /**
     * Property: For any open Terminal Preview modal with any valid configuration,
     * pressing the 'd' key SHALL trigger the download action.
     *
     * **Validates: Requirements 2.7**
     */
    it('should trigger download action when "d" is pressed for any app selection and package manager', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          // Reset mocks for each iteration
          mockAnchorClick.mockClear();
          createObjectURLMock.mockClear();

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act - Press 'd' key
          dispatchKeyboardEvent('d');

          // Assert - Download action should be triggered
          // The download creates a Blob and triggers anchor click
          expect(createObjectURLMock).toHaveBeenCalledTimes(1);
          expect(mockAnchorClick).toHaveBeenCalledTimes(1);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should NOT trigger download when "d" is pressed with modifier keys', () => {
      fc.assert(
        fc.property(
          terminalPreviewConfigArbitrary,
          fc.constantFrom('ctrlKey', 'altKey', 'metaKey') as fc.Arbitrary<'ctrlKey' | 'altKey' | 'metaKey'>,
          (config, modifierKey) => {
            // Arrange
            const { selectedApps, packageManagerId } = config;
            const selectedCount = selectedApps.size;
            const onClose = vi.fn();

            mockAnchorClick.mockClear();
            createObjectURLMock.mockClear();

            const { unmount } = render(
              <TerminalPreviewModal
                isOpen={true}
                onClose={onClose}
                selectedApps={selectedApps}
                packageManagerId={packageManagerId}
                selectedCount={selectedCount}
              />
            );

            // Act - Press 'd' with modifier key
            dispatchKeyboardEvent('d', { [modifierKey]: true });

            // Assert - Download action should NOT be triggered
            expect(createObjectURLMock).not.toHaveBeenCalled();
            expect(mockAnchorClick).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });

  describe('Property: Pressing "Escape" SHALL close the modal', () => {
    /**
     * Property: For any open Terminal Preview modal with any valid configuration,
     * pressing the 'Escape' key SHALL trigger the onClose callback.
     *
     * **Validates: Requirements 2.7**
     */
    it('should trigger onClose when "Escape" is pressed for any app selection and package manager', () => {
      fc.assert(
        fc.property(terminalPreviewConfigArbitrary, (config) => {
          // Arrange
          const { selectedApps, packageManagerId } = config;
          const selectedCount = selectedApps.size;
          const onClose = vi.fn();

          const { unmount } = render(
            <TerminalPreviewModal
              isOpen={true}
              onClose={onClose}
              selectedApps={selectedApps}
              packageManagerId={packageManagerId}
              selectedCount={selectedCount}
            />
          );

          // Act - Press 'Escape' key
          dispatchKeyboardEvent('Escape');

          // Assert - onClose should be called
          expect(onClose).toHaveBeenCalledTimes(1);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  describe('Property: Keyboard shortcuts should NOT work when modal is closed', () => {
    /**
     * Property: When the modal is closed (isOpen=false), keyboard shortcuts
     * SHALL NOT trigger any actions.
     *
     * **Validates: Requirements 2.7**
     */
    it('should NOT trigger any action when modal is closed', () => {
      fc.assert(
        fc.property(
          terminalPreviewConfigArbitrary,
          fc.constantFrom('y', 'd', 'Escape'),
          (config, key) => {
            // Arrange
            const { selectedApps, packageManagerId } = config;
            const selectedCount = selectedApps.size;
            const onClose = vi.fn();

            clipboardWriteTextMock.mockClear();
            mockAnchorClick.mockClear();
            createObjectURLMock.mockClear();

            const { unmount } = render(
              <TerminalPreviewModal
                isOpen={false}
                onClose={onClose}
                selectedApps={selectedApps}
                packageManagerId={packageManagerId}
                selectedCount={selectedCount}
              />
            );

            // Act - Press key when modal is closed
            dispatchKeyboardEvent(key);

            // Assert - No actions should be triggered
            expect(clipboardWriteTextMock).not.toHaveBeenCalled();
            expect(createObjectURLMock).not.toHaveBeenCalled();
            expect(mockAnchorClick).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });

  describe('Property: Other keys should NOT trigger actions', () => {
    /**
     * Property: For any open Terminal Preview modal, pressing keys other than
     * 'y', 'd', or 'Escape' SHALL NOT trigger copy, download, or close actions.
     *
     * **Validates: Requirements 2.7**
     */
    it('should NOT trigger any action for random non-shortcut keys', () => {
      // Generate arbitrary keys that are NOT 'y', 'd', or 'Escape'
      const nonShortcutKeyArbitrary = fc.string({ minLength: 1, maxLength: 1 })
        .filter(key => !['y', 'd'].includes(key));

      fc.assert(
        fc.property(
          terminalPreviewConfigArbitrary,
          nonShortcutKeyArbitrary,
          (config, key) => {
            // Arrange
            const { selectedApps, packageManagerId } = config;
            const selectedCount = selectedApps.size;
            const onClose = vi.fn();

            clipboardWriteTextMock.mockClear();
            mockAnchorClick.mockClear();
            createObjectURLMock.mockClear();

            const { unmount } = render(
              <TerminalPreviewModal
                isOpen={true}
                onClose={onClose}
                selectedApps={selectedApps}
                packageManagerId={packageManagerId}
                selectedCount={selectedCount}
              />
            );

            // Act - Press a non-shortcut key
            dispatchKeyboardEvent(key);

            // Assert - Copy and download should NOT be triggered
            // (Escape is handled by Modal component, so we don't check onClose here)
            expect(clipboardWriteTextMock).not.toHaveBeenCalled();
            expect(createObjectURLMock).not.toHaveBeenCalled();
            expect(mockAnchorClick).not.toHaveBeenCalled();

            // Cleanup
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });
});

describe('TerminalPreviewModal - Unit Tests', () => {
  /**
   * Feature: modal-popup-selectors
   *
   * **Validates: Requirements 2.3, 2.6**
   */

  beforeEach(() => {
    document.body.innerHTML = '';

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Script Display (Requirement 2.3)', () => {
    it('should display the generated script for a single app selection', () => {
      const selectedApps = new Set(['firefox']);
      const packageManagerId: PackageManagerId = 'apt';
      const expectedScript = generateInstallScript(selectedApps, packageManagerId);

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId={packageManagerId}
          selectedCount={1}
        />
      );

      const codeElement = document.querySelector('pre code');
      expect(codeElement).not.toBeNull();
      expect(codeElement?.textContent).toBe(expectedScript);
    });

    it('should display the generated script for multiple app selections', () => {
      const selectedApps = new Set(['firefox', 'vlc', 'gimp']);
      const packageManagerId: PackageManagerId = 'homebrew';
      const expectedScript = generateInstallScript(selectedApps, packageManagerId);

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId={packageManagerId}
          selectedCount={3}
        />
      );

      const codeElement = document.querySelector('pre code');
      expect(codeElement).not.toBeNull();
      expect(codeElement?.textContent).toBe(expectedScript);
    });

    it('should display "# No packages selected" for empty selection', () => {
      const selectedApps = new Set<string>();
      const packageManagerId: PackageManagerId = 'winget';

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId={packageManagerId}
          selectedCount={0}
        />
      );

      const codeElement = document.querySelector('pre code');
      expect(codeElement).not.toBeNull();
      expect(codeElement?.textContent).toBe('# No packages selected');
    });
  });

  describe('Header Display (Requirement 2.6)', () => {
    it('should display package manager name in header', () => {
      const selectedApps = new Set(['firefox']);
      const packageManagerId: PackageManagerId = 'chocolatey';
      const pm = getPackageManagerById(packageManagerId);

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId={packageManagerId}
          selectedCount={1}
        />
      );

      // Find the header paragraph specifically (contains "selected •" pattern)
      const headerText = screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          content.includes('selected') &&
          content.includes('Chocolatey')
        );
      });
      expect(headerText).toBeInTheDocument();
      expect(pm?.name).toBe('Chocolatey');
    });

    it('should display singular "app" for single selection', () => {
      const selectedApps = new Set(['firefox']);

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId="apt"
          selectedCount={1}
        />
      );

      expect(screen.getByText(/1 app selected/)).toBeInTheDocument();
    });

    it('should display plural "apps" for multiple selections', () => {
      const selectedApps = new Set(['firefox', 'vlc']);

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId="apt"
          selectedCount={2}
        />
      );

      expect(screen.getByText(/2 apps selected/)).toBeInTheDocument();
    });

    it('should display "0 apps selected" for empty selection', () => {
      const selectedApps = new Set<string>();

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId="apt"
          selectedCount={0}
        />
      );

      expect(screen.getByText(/0 apps selected/)).toBeInTheDocument();
    });

    it('should display correct header format with count and package manager', () => {
      const selectedApps = new Set(['firefox', 'vlc', 'gimp']);
      const packageManagerId: PackageManagerId = 'dnf';
      const pm = getPackageManagerById(packageManagerId);

      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={selectedApps}
          packageManagerId={packageManagerId}
          selectedCount={3}
        />
      );

      // Should show "3 apps selected • DNF (Fedora)"
      const headerText = screen.getByText(
        `3 apps selected • ${pm?.name}`
      );
      expect(headerText).toBeInTheDocument();
    });
  });

  describe('Modal Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <TerminalPreviewModal
          isOpen={false}
          onClose={vi.fn()}
          selectedApps={new Set(['firefox'])}
          packageManagerId="apt"
          selectedCount={1}
        />
      );

      expect(screen.queryByText('Script Preview')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={new Set(['firefox'])}
          packageManagerId="apt"
          selectedCount={1}
        />
      );

      expect(screen.getByText('Script Preview')).toBeInTheDocument();
    });

    it('should display Copy and Download buttons', () => {
      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={new Set(['firefox'])}
          packageManagerId="apt"
          selectedCount={1}
        />
      );

      // Buttons have title attributes with keyboard shortcuts
      expect(screen.getByTitle('Copy Script (y)')).toBeInTheDocument();
      expect(screen.getByTitle('Download Script (d)')).toBeInTheDocument();
    });

    it('should display keyboard shortcut hints', () => {
      render(
        <TerminalPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          selectedApps={new Set(['firefox'])}
          packageManagerId="apt"
          selectedCount={1}
        />
      );

      // Keyboard hints are shown in the code block header
      expect(screen.getByText('copy')).toBeInTheDocument();
      expect(screen.getByText('download')).toBeInTheDocument();
      expect(screen.getByText('close')).toBeInTheDocument();
    });
  });
});
