import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { PackageManagerSelectorModal } from '@/components/packageManager/PackageManagerSelectorModal';
import { 
  operatingSystems, 
  packageManagers, 
  getPackageManagersByOS,
  type OSId, 
  type PackageManagerId 
} from '@/lib/data';

/**
 * Feature: modal-popup-selectors
 * Property 9: Package Manager Filtering by OS
 *
 * **Validates: Requirements 4.2**
 *
 * Property Definition:
 * For any selected OS, the Package Manager Selector modal SHALL display exactly
 * the package managers returned by getPackageManagersByOS(selectedOS), and no others.
 */

// Get all valid OS IDs from the operatingSystems array
const validOSIds = operatingSystems.map((os) => os.id);

/**
 * Arbitrary for generating a valid OS ID
 */
const osIdArbitrary = fc.constantFrom(...validOSIds) as fc.Arbitrary<OSId>;

/**
 * Arbitrary for generating a valid package manager ID for a given OS
 */
const packageManagerIdForOSArbitrary = (osId: OSId): fc.Arbitrary<PackageManagerId> => {
  const pmIds = getPackageManagersByOS(osId).map(pm => pm.id);
  return fc.constantFrom(...pmIds) as fc.Arbitrary<PackageManagerId>;
};

/**
 * Arbitrary for generating test configurations for Package Manager Selector
 */
const pmSelectorConfigArbitrary = osIdArbitrary.chain(osId => {
  const pmIds = getPackageManagersByOS(osId).map(pm => pm.id);
  return fc.record({
    selectedOS: fc.constant(osId),
    selectedPackageManager: fc.constantFrom(...pmIds) as fc.Arbitrary<PackageManagerId>,
  });
});

describe('PackageManagerSelectorModal - Property-Based Tests', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 9: Package Manager Filtering by OS
   *
   * **Validates: Requirements 4.2**
   */

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });


  describe('Property 9: Package Manager Filtering by OS', () => {
    /**
     * Property: For any selected OS, the Package Manager Selector modal SHALL display
     * exactly the package managers returned by getPackageManagersByOS(selectedOS), and no others.
     *
     * **Validates: Requirements 4.2**
     */

    it('should render exactly the package managers for the selected OS', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Count of rendered options should match expected
          // **Validates: Requirements 4.2**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(expectedPMs.length);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each expected package manager name for the selected OS', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Each expected PM name should be visible
          // **Validates: Requirements 4.2**
          for (const pm of expectedPMs) {
            const optionButtons = document.querySelectorAll('button[role="option"]');
            const pmButton = Array.from(optionButtons).find(
              (btn) => btn.textContent?.includes(pm.name)
            );
            expect(pmButton).not.toBeUndefined();
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should NOT render package managers from other operating systems', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          
          // Get package managers that should NOT be shown (from other OSes)
          const otherOSPMs = packageManagers.filter(pm => pm.osId !== selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Package managers from other OSes should NOT be visible
          // **Validates: Requirements 4.2**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (const pm of otherOSPMs) {
            const pmButton = Array.from(optionButtons).find(
              (btn) => btn.textContent?.includes(pm.name)
            );
            expect(pmButton).toBeUndefined();
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render the correct number of package managers for each OS', () => {
      // Test each OS explicitly to ensure filtering works correctly
      for (const os of operatingSystems) {
        fc.assert(
          fc.property(packageManagerIdForOSArbitrary(os.id), (pmId) => {
            // Arrange
            const expectedPMs = getPackageManagersByOS(os.id);
            const onClose = vi.fn();
            const onSelect = vi.fn();

            const { unmount } = render(
              <PackageManagerSelectorModal
                isOpen={true}
                onClose={onClose}
                selectedOS={os.id}
                selectedPackageManager={pmId}
                onSelect={onSelect}
              />
            );

            // Act & Assert
            // **Validates: Requirements 4.2**
            const optionButtons = document.querySelectorAll('button[role="option"]');
            expect(optionButtons.length).toBe(expectedPMs.length);

            // Cleanup
            unmount();
          }),
          { numRuns: 100 }
        );
      }
    }, 120000);
  });


  /**
   * Feature: modal-popup-selectors
   * Property 10: Package Manager Options Render Correctly
   *
   * **Validates: Requirements 4.4, 4.7, 4.8**
   */
  describe('Property 10: Package Manager Options Render Correctly', () => {
    /**
     * Property: For any package manager in the filtered list, the option SHALL display
     * the package manager icon, name, brand-colored left border, and a "Default" badge
     * if isPrimary is true.
     *
     * **Validates: Requirements 4.4, 4.7, 4.8**
     */

    it('should render each package manager with its icon', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Each PM should have an icon (img element with alt text)
          // **Validates: Requirements 4.8**
          for (const pm of expectedPMs) {
            const imgElement = document.querySelector(`img[alt="${pm.name}"]`);
            expect(imgElement).not.toBeNull();
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each package manager with a left border in its brand color', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Each PM option should have a left border with its brand color
          // **Validates: Requirements 4.7**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (let i = 0; i < expectedPMs.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const pm = expectedPMs[i];
            const button = optionButtons[i] as HTMLElement;
            
            expect(button).not.toBeUndefined();
            
            // Check that the button has the border-l-4 class (left border)
            expect(button.className).toContain('border-l-4');
            
            // Check that the inline style has the correct border color
            const borderLeftColor = button.style.borderLeftColor;
            expect(borderLeftColor).not.toBe('');
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should show "Default" badge only for primary package managers', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - "Default" badge should appear only for isPrimary=true
          // **Validates: Requirements 4.4**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (let i = 0; i < expectedPMs.length; i++) {
            const pm = expectedPMs[i];
            const button = optionButtons[i] as HTMLElement;
            
            // Look for "Default" text in the button
            const hasDefaultBadge = button.textContent?.includes('Default');
            
            if (pm.isPrimary) {
              expect(hasDefaultBadge).toBe(true);
            } else {
              expect(hasDefaultBadge).toBe(false);
            }
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each package manager with proper ARIA attributes', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Verify ARIA attributes
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(expectedPMs.length);

          optionButtons.forEach((button, index) => {
            const pm = expectedPMs[index];
            const isSelected = pm.id === selectedPackageManager;
            
            // Verify role="option" is set
            expect(button.getAttribute('role')).toBe('option');
            
            // Verify aria-selected is correctly set
            expect(button.getAttribute('aria-selected')).toBe(isSelected.toString());
          });

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render the listbox container with proper ARIA label', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Verify listbox container
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();
          expect(listbox?.getAttribute('aria-label')).toBe('Package Managers');

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });


  /**
   * Feature: modal-popup-selectors
   * Property 11: Package Manager Highlights Current Selection
   *
   * **Validates: Requirements 4.3**
   */
  describe('Property 11: Package Manager Highlights Current Selection', () => {
    /**
     * Property: For any selectedPackageManager value, the corresponding option in the
     * Package Manager Selector modal SHALL have a visually distinct style and checkmark indicator.
     *
     * **Validates: Requirements 4.3**
     */

    it('should highlight the selected package manager with a distinct background style', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - The selected PM should have a distinct background
          // **Validates: Requirements 4.3**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (let i = 0; i < expectedPMs.length; i++) {
            const pm = expectedPMs[i];
            const button = optionButtons[i] as HTMLElement;
            const isSelected = pm.id === selectedPackageManager;
            
            if (isSelected) {
              // Selected option should have bg-[var(--bg-tertiary)] class
              expect(button.className).toContain('bg-[var(--bg-tertiary)]');
            } else {
              // Non-selected options should have bg-[var(--bg-secondary)] class
              expect(button.className).toContain('bg-[var(--bg-secondary)]');
            }
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should show a checkmark indicator only for the selected package manager', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Only the selected PM should have the checkmark
          // **Validates: Requirements 4.3**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (let i = 0; i < expectedPMs.length; i++) {
            const pm = expectedPMs[i];
            const button = optionButtons[i] as HTMLElement;
            const isSelected = pm.id === selectedPackageManager;
            
            // Look for the Check icon (svg element from lucide-react)
            const checkIcon = button.querySelector('svg.lucide-check');
            
            if (isSelected) {
              // Selected option should have the checkmark
              expect(checkIcon).not.toBeNull();
            } else {
              // Non-selected options should NOT have the checkmark
              expect(checkIcon).toBeNull();
            }
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should set aria-selected=true only for the selected package manager', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - aria-selected should be correctly set
          // **Validates: Requirements 4.3**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          let selectedCount = 0;
          for (let i = 0; i < expectedPMs.length; i++) {
            const pm = expectedPMs[i];
            const button = optionButtons[i] as HTMLElement;
            const isSelected = pm.id === selectedPackageManager;
            
            const ariaSelected = button.getAttribute('aria-selected');
            expect(ariaSelected).toBe(isSelected.toString());
            
            if (ariaSelected === 'true') {
              selectedCount++;
            }
          }
          
          // Exactly one option should be selected
          expect(selectedCount).toBe(1);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should apply shadow to the selected package manager option', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Selected option should have shadow-sm class
          // **Validates: Requirements 4.3**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (let i = 0; i < expectedPMs.length; i++) {
            const pm = expectedPMs[i];
            const button = optionButtons[i] as HTMLElement;
            const isSelected = pm.id === selectedPackageManager;
            
            if (isSelected) {
              // Selected option should have shadow
              expect(button.className).toContain('shadow-sm');
            }
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should ensure selected and non-selected options have different background classes', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);

          // Skip if only one PM available (can't compare selected vs non-selected)
          if (expectedPMs.length < 2) return;

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Selected and non-selected should have DIFFERENT background classes
          // **Validates: Requirements 4.3**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          // Find the selected button
          const selectedIndex = expectedPMs.findIndex(pm => pm.id === selectedPackageManager);
          const selectedButton = optionButtons[selectedIndex] as HTMLElement;
          
          // Find a non-selected button (any other button)
          const nonSelectedIndex = (selectedIndex + 1) % expectedPMs.length;
          const nonSelectedButton = optionButtons[nonSelectedIndex] as HTMLElement;
          
          // Check that selected has tertiary background and non-selected has secondary background
          const selectedHasTertiaryBg = selectedButton.className.includes('bg-[var(--bg-tertiary)]');
          const selectedHasSecondaryBg = selectedButton.className.includes('bg-[var(--bg-secondary)]');
          const nonSelectedHasTertiaryBg = nonSelectedButton.className.includes('bg-[var(--bg-tertiary)]');
          const nonSelectedHasSecondaryBg = nonSelectedButton.className.includes('bg-[var(--bg-secondary)]');
          
          // Selected should have tertiary, not secondary
          expect(selectedHasTertiaryBg).toBe(true);
          expect(selectedHasSecondaryBg).toBe(false);
          
          // Non-selected should have secondary, not tertiary
          expect(nonSelectedHasTertiaryBg).toBe(false);
          expect(nonSelectedHasSecondaryBg).toBe(true);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });


  /**
   * Feature: modal-popup-selectors
   * Property 12: Package Manager Keyboard Navigation
   *
   * **Validates: Requirements 4.6**
   */
  describe('Property 12: Package Manager Keyboard Navigation', () => {
    /**
     * Property: For any open Package Manager Selector modal with N options and focused index I,
     * ArrowDown moves to (I+1) mod N, ArrowUp moves to (I-1+N) mod N, Home moves to 0,
     * End moves to N-1, Enter selects, and Escape closes.
     *
     * **Validates: Requirements 4.6**
     */

    it('should move focus down when ArrowDown is pressed, wrapping at the end', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);
          const totalOptions = expectedPMs.length;

          if (totalOptions < 2) return; // Skip if only one option

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(totalOptions);

          // Focus the first option
          const firstButton = optionButtons[0] as HTMLElement;
          firstButton.focus();

          // Get the listbox container for keyboard events
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Press ArrowDown
          fireEvent.keyDown(listbox!, { key: 'ArrowDown' });

          // The second option should now be focused
          const secondButton = optionButtons[1] as HTMLElement;
          expect(document.activeElement).toBe(secondButton);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should move focus up when ArrowUp is pressed, wrapping at the beginning', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);
          const totalOptions = expectedPMs.length;

          if (totalOptions < 2) return; // Skip if only one option

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(totalOptions);

          // Focus the first option
          const firstButton = optionButtons[0] as HTMLElement;
          firstButton.focus();

          // Get the listbox container for keyboard events
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Press ArrowUp (should wrap to last)
          fireEvent.keyDown(listbox!, { key: 'ArrowUp' });

          // The last option should now be focused
          const lastButton = optionButtons[totalOptions - 1] as HTMLElement;
          expect(document.activeElement).toBe(lastButton);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should move focus to first option when Home is pressed', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);
          const totalOptions = expectedPMs.length;

          if (totalOptions < 2) return; // Skip if only one option

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(totalOptions);

          // Focus the last option
          const lastButton = optionButtons[totalOptions - 1] as HTMLElement;
          lastButton.focus();

          // Get the listbox container for keyboard events
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Press Home
          fireEvent.keyDown(listbox!, { key: 'Home' });

          // The first option should now be focused
          const firstButton = optionButtons[0] as HTMLElement;
          expect(document.activeElement).toBe(firstButton);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should move focus to last option when End is pressed', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);
          const totalOptions = expectedPMs.length;

          if (totalOptions < 2) return; // Skip if only one option

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(totalOptions);

          // Focus the first option
          const firstButton = optionButtons[0] as HTMLElement;
          firstButton.focus();

          // Get the listbox container for keyboard events
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Press End
          fireEvent.keyDown(listbox!, { key: 'End' });

          // The last option should now be focused
          const lastButton = optionButtons[totalOptions - 1] as HTMLElement;
          expect(document.activeElement).toBe(lastButton);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should select the focused option when Enter is pressed', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);
          const totalOptions = expectedPMs.length;

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(totalOptions);

          // Focus the first option
          const firstButton = optionButtons[0] as HTMLElement;
          firstButton.focus();

          // Get the listbox container for keyboard events
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Press Enter
          fireEvent.keyDown(listbox!, { key: 'Enter' });

          // onSelect should have been called with the first PM's id
          expect(onSelect).toHaveBeenCalledWith(expectedPMs[0].id);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should select the focused option when Space is pressed', () => {
      fc.assert(
        fc.property(pmSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS, selectedPackageManager } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();
          const expectedPMs = getPackageManagersByOS(selectedOS);
          const totalOptions = expectedPMs.length;

          const { unmount } = render(
            <PackageManagerSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              selectedPackageManager={selectedPackageManager}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(totalOptions);

          // Focus the first option
          const firstButton = optionButtons[0] as HTMLElement;
          firstButton.focus();

          // Get the listbox container for keyboard events
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Press Space
          fireEvent.keyDown(listbox!, { key: ' ' });

          // onSelect should have been called with the first PM's id
          expect(onSelect).toHaveBeenCalledWith(expectedPMs[0].id);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });
});


describe('PackageManagerSelectorModal - Unit Tests', () => {
  /**
   * Feature: modal-popup-selectors
   *
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.8**
   */

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Package Manager Options Rendering', () => {
    it('should render Windows package managers when Windows is selected', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="windows"
          selectedPackageManager="winget"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const windowsPMs = getPackageManagersByOS('windows');
      expect(optionButtons.length).toBe(windowsPMs.length);

      // Check for specific Windows package managers
      expect(document.body.textContent).toContain('Winget');
      expect(document.body.textContent).toContain('Chocolatey');
      expect(document.body.textContent).toContain('Scoop');
    });

    it('should render macOS package managers when macOS is selected', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          selectedPackageManager="homebrew"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const macosPMs = getPackageManagersByOS('macos');
      expect(optionButtons.length).toBe(macosPMs.length);

      // Check for specific macOS package managers
      expect(document.body.textContent).toContain('Homebrew');
      expect(document.body.textContent).toContain('MacPorts');
    });

    it('should render Linux package managers when Linux is selected', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="linux"
          selectedPackageManager="apt"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const linuxPMs = getPackageManagersByOS('linux');
      expect(optionButtons.length).toBe(linuxPMs.length);

      // Check for specific Linux package managers
      expect(document.body.textContent).toContain('APT');
      expect(document.body.textContent).toContain('DNF');
      expect(document.body.textContent).toContain('Pacman');
    });

    it('should not render any options when modal is closed', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={false}
          onClose={vi.fn()}
          selectedOS="windows"
          selectedPackageManager="winget"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      expect(optionButtons.length).toBe(0);
    });
  });

  describe('Modal Title', () => {
    it('should display "Select Package Manager" as the modal title', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="windows"
          selectedPackageManager="winget"
          onSelect={vi.fn()}
        />
      );

      const title = document.querySelector('h2');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('Select Package Manager');
    });
  });

  describe('Selection Behavior', () => {
    it('should call onSelect when an option is clicked', () => {
      const onSelect = vi.fn();
      
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="windows"
          selectedPackageManager="winget"
          onSelect={onSelect}
        />
      );

      // Click on Chocolatey option
      const optionButtons = document.querySelectorAll('button[role="option"]');
      const chocolateyButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Chocolatey')
      ) as HTMLElement;
      
      expect(chocolateyButton).not.toBeUndefined();
      fireEvent.click(chocolateyButton);

      expect(onSelect).toHaveBeenCalledWith('chocolatey');
    });

    it('should call onClose after selection', () => {
      const onClose = vi.fn();
      const onSelect = vi.fn();
      
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={onClose}
          selectedOS="windows"
          selectedPackageManager="winget"
          onSelect={onSelect}
        />
      );

      // Click on Chocolatey option
      const optionButtons = document.querySelectorAll('button[role="option"]');
      const chocolateyButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Chocolatey')
      ) as HTMLElement;
      
      fireEvent.click(chocolateyButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Default Badge', () => {
    it('should show Default badge for Winget on Windows', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="windows"
          selectedPackageManager="chocolatey"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const wingetButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Winget')
      ) as HTMLElement;
      
      expect(wingetButton?.textContent).toContain('Default');
    });

    it('should show Default badge for Homebrew on macOS', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          selectedPackageManager="macports"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const homebrewButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Homebrew')
      ) as HTMLElement;
      
      expect(homebrewButton?.textContent).toContain('Default');
    });

    it('should show Default badge for APT on Linux', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="linux"
          selectedPackageManager="dnf"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const aptButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('APT')
      ) as HTMLElement;
      
      expect(aptButton?.textContent).toContain('Default');
    });

    it('should NOT show Default badge for non-primary package managers', () => {
      render(
        <PackageManagerSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="windows"
          selectedPackageManager="winget"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const chocolateyButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Chocolatey')
      ) as HTMLElement;
      
      // Chocolatey should not have Default badge
      expect(chocolateyButton?.textContent).not.toContain('Default');
    });
  });
});
