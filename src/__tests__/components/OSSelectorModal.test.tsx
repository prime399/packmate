import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { OSSelectorModal } from '@/components/os/OSSelectorModal';
import { operatingSystems, type OSId } from '@/lib/data';

/**
 * Feature: modal-popup-selectors
 * Property 6: OS Selector Renders All Options
 *
 * **Validates: Requirements 3.2, 3.4, 3.7**
 *
 * Property Definition:
 * For any OS in the operatingSystems array, the OS Selector modal SHALL render
 * an option containing the OS icon, OS name, and a left border with the OS's brand color.
 */

// Get all valid OS IDs from the operatingSystems array
const validOSIds = operatingSystems.map((os) => os.id);

/**
 * Arbitrary for generating a valid OS ID
 */
const osIdArbitrary = fc.constantFrom(...validOSIds) as fc.Arbitrary<OSId>;

/**
 * Arbitrary for generating test configurations for OS Selector
 */
const osSelectorConfigArbitrary = fc.record({
  selectedOS: osIdArbitrary,
});

describe('OSSelectorModal - Property-Based Tests', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 6: OS Selector Renders All Options
   *
   * **Validates: Requirements 3.2, 3.4, 3.7**
   */

  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Property 6: OS Selector Renders All Options', () => {
    /**
     * Property: For any OS in the operatingSystems array, the OS Selector modal
     * SHALL render an option containing the OS icon, OS name, and a left border
     * with the OS's brand color.
     *
     * **Validates: Requirements 3.2, 3.4, 3.7**
     */

    it('should render all operating systems in the modal for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - All operating systems should be rendered
          // **Validates: Requirements 3.2**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(operatingSystems.length);

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each OS with its name visible for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Each OS name should be visible
          // **Validates: Requirements 3.4**
          for (const os of operatingSystems) {
            // Find the option button for this OS
            const optionButtons = document.querySelectorAll('button[role="option"]');
            const osButton = Array.from(optionButtons).find(
              (btn) => btn.textContent?.includes(os.name)
            );
            expect(osButton).not.toBeUndefined();
            expect(osButton?.textContent).toContain(os.name);
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each OS with its icon for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Each OS should have an icon (img element with alt text)
          // **Validates: Requirements 3.4**
          for (const os of operatingSystems) {
            // Find the image element with the OS name as alt text
            const imgElement = document.querySelector(`img[alt="${os.name}"]`);
            expect(imgElement).not.toBeNull();
            
            // Verify the image has the correct src (iconUrl)
            if (imgElement) {
              const src = imgElement.getAttribute('src');
              // Next.js Image component may transform the URL, so we check it contains the key parts
              // or is a data URL (for optimized images)
              expect(src).not.toBeNull();
            }
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each OS with a left border in its brand color for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Each OS option should have a left border with its brand color
          // **Validates: Requirements 3.7**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          
          for (let i = 0; i < operatingSystems.length; i++) {
            const os = operatingSystems[i];
            const button = optionButtons[i] as HTMLElement;
            
            expect(button).not.toBeUndefined();
            
            // Check that the button has the border-l-4 class (left border)
            expect(button.className).toContain('border-l-4');
            
            // Check that the inline style has the correct border color
            const borderLeftColor = button.style.borderLeftColor;
            
            // The color might be in different formats (hex, rgb), so we normalize
            // Convert the expected hex color to rgb for comparison
            const expectedColor = os.color.toLowerCase();
            
            // borderLeftColor could be in rgb format or hex format
            // We need to handle both cases
            if (borderLeftColor) {
              // If it's already in hex format
              if (borderLeftColor.startsWith('#')) {
                expect(borderLeftColor.toLowerCase()).toBe(expectedColor);
              } else if (borderLeftColor.startsWith('rgb')) {
                // Convert expected hex to rgb for comparison
                const expectedRgb = hexToRgb(expectedColor);
                expect(borderLeftColor).toBe(expectedRgb);
              } else {
                // Direct comparison
                expect(borderLeftColor.toLowerCase()).toBe(expectedColor);
              }
            }
          }

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render all OS options with correct structure (icon, name, border) for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Verify complete structure for each OS
          // **Validates: Requirements 3.2, 3.4, 3.7**
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(operatingSystems.length);

          operatingSystems.forEach((os, index) => {
            const button = optionButtons[index] as HTMLElement;
            
            // 1. Verify the button exists
            expect(button).not.toBeUndefined();
            
            // 2. Verify the OS name is present (Requirement 3.4)
            expect(button.textContent).toContain(os.name);
            
            // 3. Verify the icon is present (Requirement 3.4)
            const img = button.querySelector('img');
            expect(img).not.toBeNull();
            expect(img?.getAttribute('alt')).toBe(os.name);
            
            // 4. Verify the left border class is present (Requirement 3.7)
            expect(button.className).toContain('border-l-4');
            
            // 5. Verify the border color is set via inline style (Requirement 3.7)
            expect(button.style.borderLeftColor).not.toBe('');
          });

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render OS options in a grid layout for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Verify grid layout is applied
          // **Validates: Requirements 3.2**
          const gridContainer = document.querySelector('.grid');
          expect(gridContainer).not.toBeNull();
          
          // Verify grid has the correct column classes
          expect(gridContainer?.className).toContain('grid-cols-2');
          expect(gridContainer?.className).toContain('sm:grid-cols-3');

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should render each OS option with proper ARIA attributes for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Verify ARIA attributes
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(operatingSystems.length);

          optionButtons.forEach((button, index) => {
            const os = operatingSystems[index];
            const isSelected = os.id === selectedOS;
            
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

    it('should render the listbox container with proper ARIA label for any selected OS', () => {
      fc.assert(
        fc.property(osSelectorConfigArbitrary, (config) => {
          // Arrange
          const { selectedOS } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Act & Assert - Verify listbox container
          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();
          expect(listbox?.getAttribute('aria-label')).toBe('Operating Systems');

          // Cleanup
          unmount();
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });
});

/**
 * Feature: modal-popup-selectors
 * Property 7: OS Selector Highlights Current Selection
 *
 * **Validates: Requirements 3.3**
 *
 * Property Definition:
 * For any selectedOS value, the corresponding option in the OS Selector modal
 * SHALL have a visually distinct background style compared to non-selected options.
 */
describe('OSSelectorModal - Property 7: OS Selector Highlights Current Selection', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 7: OS Selector Highlights Current Selection
   *
   * **Validates: Requirements 3.3**
   */

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should highlight the selected OS with a distinct background style for any selected OS', () => {
    fc.assert(
      fc.property(osSelectorConfigArbitrary, (config) => {
        // Arrange
        const { selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Act & Assert - The selected OS should have a distinct background
        // **Validates: Requirements 3.3**
        const optionButtons = document.querySelectorAll('button[role="option"]');
        
        for (let i = 0; i < operatingSystems.length; i++) {
          const os = operatingSystems[i];
          const button = optionButtons[i] as HTMLElement;
          const isSelected = os.id === selectedOS;
          
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

  it('should show a selection indicator dot only for the selected OS for any selected OS', () => {
    fc.assert(
      fc.property(osSelectorConfigArbitrary, (config) => {
        // Arrange
        const { selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Act & Assert - Only the selected OS should have the selection indicator dot
        // **Validates: Requirements 3.3**
        const optionButtons = document.querySelectorAll('button[role="option"]');
        
        for (let i = 0; i < operatingSystems.length; i++) {
          const os = operatingSystems[i];
          const button = optionButtons[i] as HTMLElement;
          const isSelected = os.id === selectedOS;
          
          // Look for the selection indicator dot (span with rounded-full and bg-[var(--accent-color)])
          const indicatorDot = button.querySelector('span.rounded-full');
          
          if (isSelected) {
            // Selected option should have the indicator dot
            expect(indicatorDot).not.toBeNull();
            expect(indicatorDot?.className).toContain('bg-[var(--accent-color)]');
          } else {
            // Non-selected options should NOT have the indicator dot
            expect(indicatorDot).toBeNull();
          }
        }

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should set aria-selected=true only for the selected OS for any selected OS', () => {
    fc.assert(
      fc.property(osSelectorConfigArbitrary, (config) => {
        // Arrange
        const { selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Act & Assert - aria-selected should be correctly set
        // **Validates: Requirements 3.3**
        const optionButtons = document.querySelectorAll('button[role="option"]');
        
        let selectedCount = 0;
        for (let i = 0; i < operatingSystems.length; i++) {
          const os = operatingSystems[i];
          const button = optionButtons[i] as HTMLElement;
          const isSelected = os.id === selectedOS;
          
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

  it('should apply distinct text styling to the selected OS name for any selected OS', () => {
    fc.assert(
      fc.property(osSelectorConfigArbitrary, (config) => {
        // Arrange
        const { selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Act & Assert - Text styling should differ between selected and non-selected
        // **Validates: Requirements 3.3**
        const optionButtons = document.querySelectorAll('button[role="option"]');
        
        for (let i = 0; i < operatingSystems.length; i++) {
          const os = operatingSystems[i];
          const button = optionButtons[i] as HTMLElement;
          const isSelected = os.id === selectedOS;
          
          // Find the text span (contains the OS name)
          const textSpan = Array.from(button.querySelectorAll('span')).find(
            span => span.textContent === os.name
          );
          
          expect(textSpan).not.toBeUndefined();
          
          if (isSelected) {
            // Selected option text should have primary text color
            expect(textSpan?.className).toContain('text-[var(--text-primary)]');
          } else {
            // Non-selected option text should have secondary text color
            expect(textSpan?.className).toContain('text-[var(--text-secondary)]');
          }
        }

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should apply shadow to the selected OS option for any selected OS', () => {
    fc.assert(
      fc.property(osSelectorConfigArbitrary, (config) => {
        // Arrange
        const { selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Act & Assert - Selected option should have shadow-sm class
        // **Validates: Requirements 3.3**
        const optionButtons = document.querySelectorAll('button[role="option"]');
        
        for (let i = 0; i < operatingSystems.length; i++) {
          const os = operatingSystems[i];
          const button = optionButtons[i] as HTMLElement;
          const isSelected = os.id === selectedOS;
          
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

  it('should ensure selected and non-selected options have different background classes for any selected OS', () => {
    fc.assert(
      fc.property(osSelectorConfigArbitrary, (config) => {
        // Arrange
        const { selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Act & Assert - Selected and non-selected should have DIFFERENT background classes
        // **Validates: Requirements 3.3**
        const optionButtons = document.querySelectorAll('button[role="option"]');
        
        // Find the selected button
        const selectedIndex = operatingSystems.findIndex(os => os.id === selectedOS);
        const selectedButton = optionButtons[selectedIndex] as HTMLElement;
        
        // Find a non-selected button (any other button)
        const nonSelectedIndex = (selectedIndex + 1) % operatingSystems.length;
        const nonSelectedButton = optionButtons[nonSelectedIndex] as HTMLElement;
        
        // Check that selected has tertiary background and non-selected has secondary background
        // The className contains multiple bg-* classes, so we check for specific ones
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

describe('OSSelectorModal - Unit Tests', () => {
  /**
   * Feature: modal-popup-selectors
   *
   * **Validates: Requirements 3.2, 3.4, 3.7**
   */

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('OS Options Rendering (Requirements 3.2, 3.4, 3.7)', () => {
    it('should render all three operating systems', () => {
      render(
        <OSSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      expect(optionButtons.length).toBe(3);
    });

    it('should render macOS with correct name and color', () => {
      render(
        <OSSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="linux"
          onSelect={vi.fn()}
        />
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const macOS = operatingSystems.find(os => os.id === 'macos');
      const optionButtons = document.querySelectorAll('button[role="option"]');
      const macOSButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('MacOS')
      ) as HTMLElement;

      expect(macOSButton).not.toBeUndefined();
      expect(macOSButton.textContent).toContain('MacOS');
      expect(macOSButton.className).toContain('border-l-4');
      expect(macOSButton.style.borderLeftColor).not.toBe('');
    });

    it('should render Linux with correct name and color', () => {
      render(
        <OSSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const linuxButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Linux')
      ) as HTMLElement;

      expect(linuxButton).not.toBeUndefined();
      expect(linuxButton.textContent).toContain('Linux');
      expect(linuxButton.className).toContain('border-l-4');
    });

    it('should render Windows with correct name and color', () => {
      render(
        <OSSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      const windowsButton = Array.from(optionButtons).find(
        btn => btn.textContent?.includes('Windows')
      ) as HTMLElement;

      expect(windowsButton).not.toBeUndefined();
      expect(windowsButton.textContent).toContain('Windows');
      expect(windowsButton.className).toContain('border-l-4');
    });

    it('should render icons for all operating systems', () => {
      render(
        <OSSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          onSelect={vi.fn()}
        />
      );

      // Check that each OS has an icon
      for (const os of operatingSystems) {
        const img = document.querySelector(`img[alt="${os.name}"]`);
        expect(img).not.toBeNull();
      }
    });

    it('should not render any options when modal is closed', () => {
      render(
        <OSSelectorModal
          isOpen={false}
          onClose={vi.fn()}
          selectedOS="macos"
          onSelect={vi.fn()}
        />
      );

      const optionButtons = document.querySelectorAll('button[role="option"]');
      expect(optionButtons.length).toBe(0);
    });
  });

  describe('Modal Title', () => {
    it('should display "Select Operating System" as the modal title', () => {
      render(
        <OSSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          selectedOS="macos"
          onSelect={vi.fn()}
        />
      );

      // The title is rendered by the Modal component
      const title = document.querySelector('h2');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('Select Operating System');
    });
  });
});

/**
 * Feature: modal-popup-selectors
 * Property 8: OS Selector Keyboard Navigation
 *
 * **Validates: Requirements 3.6**
 *
 * Property Definition:
 * For any open OS Selector modal with focused option at index I, pressing ArrowDown
 * SHALL move focus to index (I+columns) mod N (where columns=3 for grid layout),
 * pressing ArrowUp SHALL move focus to index (I-columns+N) mod N, and pressing
 * Enter SHALL select the focused option.
 * 
 * Note: The OSSelectorModal uses a grid layout with 3 columns, so ArrowDown/ArrowUp
 * move by 3 positions (one row), while ArrowLeft/ArrowRight move by 1 position.
 */
describe('OSSelectorModal - Property 8: OS Selector Keyboard Navigation', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 8: OS Selector Keyboard Navigation
   *
   * **Validates: Requirements 3.6**
   */

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Grid has 3 columns
  const COLUMNS = 3;
  const TOTAL_OPTIONS = operatingSystems.length;

  /**
   * Arbitrary for generating a valid starting index
   */
  const startingIndexArbitrary = fc.integer({ min: 0, max: TOTAL_OPTIONS - 1 });

  /**
   * Arbitrary for generating test configurations
   */
  const keyboardNavConfigArbitrary = fc.record({
    startingIndex: startingIndexArbitrary,
    selectedOS: osIdArbitrary,
  });

  it('should move focus down by one row (3 positions) when ArrowDown is pressed, wrapping at the end', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press ArrowDown
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const arrowDownEvent = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(arrowDownEvent);

        // Assert - Focus should move down by COLUMNS positions, wrapping if necessary
        // **Validates: Requirements 3.6**
        const expectedIndex = (startingIndex + COLUMNS) % TOTAL_OPTIONS;
        const expectedButton = optionButtons[expectedIndex] as HTMLElement;
        expect(document.activeElement).toBe(expectedButton);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should move focus up by one row (3 positions) when ArrowUp is pressed, wrapping at the beginning', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press ArrowUp
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const arrowUpEvent = new KeyboardEvent('keydown', {
          key: 'ArrowUp',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(arrowUpEvent);

        // Assert - Focus should move up by COLUMNS positions, wrapping if necessary
        // **Validates: Requirements 3.6**
        const expectedIndex = (startingIndex - COLUMNS + TOTAL_OPTIONS) % TOTAL_OPTIONS;
        const expectedButton = optionButtons[expectedIndex] as HTMLElement;
        expect(document.activeElement).toBe(expectedButton);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should move focus right by one position when ArrowRight is pressed, wrapping at the end', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press ArrowRight
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const arrowRightEvent = new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(arrowRightEvent);

        // Assert - Focus should move right by 1 position, wrapping if necessary
        // **Validates: Requirements 3.6**
        const expectedIndex = (startingIndex + 1) % TOTAL_OPTIONS;
        const expectedButton = optionButtons[expectedIndex] as HTMLElement;
        expect(document.activeElement).toBe(expectedButton);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should move focus left by one position when ArrowLeft is pressed, wrapping at the beginning', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press ArrowLeft
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const arrowLeftEvent = new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(arrowLeftEvent);

        // Assert - Focus should move left by 1 position, wrapping if necessary
        // **Validates: Requirements 3.6**
        const expectedIndex = (startingIndex - 1 + TOTAL_OPTIONS) % TOTAL_OPTIONS;
        const expectedButton = optionButtons[expectedIndex] as HTMLElement;
        expect(document.activeElement).toBe(expectedButton);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should select the focused option when Enter is pressed', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press Enter
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(enterEvent);

        // Assert - The focused option should be selected
        // **Validates: Requirements 3.6**
        const expectedOS = operatingSystems[startingIndex];
        expect(onSelect).toHaveBeenCalledWith(expectedOS.id);
        expect(onClose).toHaveBeenCalled();

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should select the focused option when Space is pressed', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press Space
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const spaceEvent = new KeyboardEvent('keydown', {
          key: ' ',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(spaceEvent);

        // Assert - The focused option should be selected
        // **Validates: Requirements 3.6**
        const expectedOS = operatingSystems[startingIndex];
        expect(onSelect).toHaveBeenCalledWith(expectedOS.id);
        expect(onClose).toHaveBeenCalled();

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should move focus to first option when Home is pressed', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press Home
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const homeEvent = new KeyboardEvent('keydown', {
          key: 'Home',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(homeEvent);

        // Assert - Focus should move to the first option (index 0)
        // **Validates: Requirements 3.6**
        const expectedButton = optionButtons[0] as HTMLElement;
        expect(document.activeElement).toBe(expectedButton);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should move focus to last option when End is pressed', () => {
    fc.assert(
      fc.property(keyboardNavConfigArbitrary, (config) => {
        // Arrange
        const { startingIndex, selectedOS } = config;
        const onClose = vi.fn();
        const onSelect = vi.fn();

        const { unmount } = render(
          <OSSelectorModal
            isOpen={true}
            onClose={onClose}
            selectedOS={selectedOS}
            onSelect={onSelect}
          />
        );

        // Get all option buttons
        const optionButtons = document.querySelectorAll('button[role="option"]');
        expect(optionButtons.length).toBe(TOTAL_OPTIONS);

        // Focus the starting option
        const startingButton = optionButtons[startingIndex] as HTMLElement;
        startingButton.focus();
        expect(document.activeElement).toBe(startingButton);

        // Act - Press End
        const listbox = document.querySelector('[role="listbox"]');
        expect(listbox).not.toBeNull();
        
        const endEvent = new KeyboardEvent('keydown', {
          key: 'End',
          bubbles: true,
          cancelable: true,
        });
        listbox!.dispatchEvent(endEvent);

        // Assert - Focus should move to the last option (index N-1)
        // **Validates: Requirements 3.6**
        const expectedButton = optionButtons[TOTAL_OPTIONS - 1] as HTMLElement;
        expect(document.activeElement).toBe(expectedButton);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  it('should maintain correct focus tracking through multiple arrow key presses', () => {
    fc.assert(
      fc.property(
        fc.record({
          selectedOS: osIdArbitrary,
          keySequence: fc.array(
            fc.constantFrom('ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (config) => {
          // Arrange
          const { selectedOS, keySequence } = config;
          const onClose = vi.fn();
          const onSelect = vi.fn();

          const { unmount } = render(
            <OSSelectorModal
              isOpen={true}
              onClose={onClose}
              selectedOS={selectedOS}
              onSelect={onSelect}
            />
          );

          // Get all option buttons
          const optionButtons = document.querySelectorAll('button[role="option"]');
          expect(optionButtons.length).toBe(TOTAL_OPTIONS);

          // Start from the selected OS index
          const startingIndex = operatingSystems.findIndex(os => os.id === selectedOS);
          let currentIndex = startingIndex >= 0 ? startingIndex : 0;

          // Focus the starting option
          const startingButton = optionButtons[currentIndex] as HTMLElement;
          startingButton.focus();

          const listbox = document.querySelector('[role="listbox"]');
          expect(listbox).not.toBeNull();

          // Act - Press each key in the sequence and track expected focus
          for (const key of keySequence) {
            const keyEvent = new KeyboardEvent('keydown', {
              key,
              bubbles: true,
              cancelable: true,
            });
            listbox!.dispatchEvent(keyEvent);

            // Calculate expected index based on key
            switch (key) {
              case 'ArrowDown':
                currentIndex = (currentIndex + COLUMNS) % TOTAL_OPTIONS;
                break;
              case 'ArrowUp':
                currentIndex = (currentIndex - COLUMNS + TOTAL_OPTIONS) % TOTAL_OPTIONS;
                break;
              case 'ArrowRight':
                currentIndex = (currentIndex + 1) % TOTAL_OPTIONS;
                break;
              case 'ArrowLeft':
                currentIndex = (currentIndex - 1 + TOTAL_OPTIONS) % TOTAL_OPTIONS;
                break;
            }
          }

          // Assert - Focus should be at the expected position after all key presses
          // **Validates: Requirements 3.6**
          const expectedButton = optionButtons[currentIndex] as HTMLElement;
          expect(document.activeElement).toBe(expectedButton);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

/**
 * Helper function to convert hex color to rgb format
 */
function hexToRgb(hex: string): string {
  // Remove the # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgb(${r}, ${g}, ${b})`;
}
