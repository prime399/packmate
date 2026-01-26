import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Feature: modal-popup-selectors
// **Validates: Requirements 1.6**

/**
 * Helper to create a mock container with focusable elements
 */
function createMockContainer(focusableCount: number): HTMLDivElement {
  const container = document.createElement('div');
  
  for (let i = 0; i < focusableCount; i++) {
    const button = document.createElement('button');
    button.textContent = `Button ${i + 1}`;
    button.setAttribute('data-testid', `button-${i}`);
    container.appendChild(button);
  }
  
  document.body.appendChild(container);
  return container;
}

/**
 * Helper to clean up container
 */
function cleanupContainer(container: HTMLDivElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Helper to simulate Tab key press
 */
function pressTab(shiftKey = false): void {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

describe('useFocusTrap - Unit Tests', () => {
  // Feature: modal-popup-selectors
  // **Validates: Requirements 1.6**

  let container: HTMLDivElement;
  let triggerElement: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers();
    
    // Create a trigger element that will have focus before the trap activates
    triggerElement = document.createElement('button');
    triggerElement.textContent = 'Trigger';
    triggerElement.setAttribute('data-testid', 'trigger');
    document.body.appendChild(triggerElement);
    triggerElement.focus();
  });

  afterEach(() => {
    vi.useRealTimers();
    
    if (container) {
      cleanupContainer(container);
    }
    if (triggerElement.parentNode) {
      triggerElement.parentNode.removeChild(triggerElement);
    }
    vi.clearAllMocks();
  });

  describe('Focus Capture on Activation', () => {
    it('should focus the first focusable element when activated', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      // Initially trigger has focus
      expect(document.activeElement).toBe(triggerElement);

      renderHook(() => useFocusTrap(containerRef, true));

      // Advance timers to trigger the setTimeout(0) focus
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // First button in container should now have focus
      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);
    });

    it('should not capture focus when inactive', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      // Initially trigger has focus
      expect(document.activeElement).toBe(triggerElement);

      renderHook(() => useFocusTrap(containerRef, false));

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Trigger should still have focus
      expect(document.activeElement).toBe(triggerElement);
    });

    it('should handle empty container gracefully', () => {
      container = createMockContainer(0);
      const containerRef = { current: container };

      // Should not throw
      expect(() => {
        renderHook(() => useFocusTrap(containerRef, true));
        act(() => {
          vi.advanceTimersByTime(1);
        });
      }).not.toThrow();

      // Trigger should still have focus (no focusable elements to move to)
      expect(document.activeElement).toBe(triggerElement);
    });

    it('should handle null container ref gracefully', () => {
      const containerRef = { current: null };

      // Should not throw
      expect(() => {
        renderHook(() => useFocusTrap(containerRef, true));
        act(() => {
          vi.advanceTimersByTime(1);
        });
      }).not.toThrow();
    });
  });

  describe('Tab Key Focus Cycling', () => {
    it('should cycle focus from last to first element on Tab', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      // Advance timers for initial focus
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Focus the last button
      const lastButton = container.querySelector('[data-testid="button-2"]') as HTMLButtonElement;
      act(() => {
        lastButton.focus();
      });
      expect(document.activeElement).toBe(lastButton);

      // Press Tab - should wrap to first
      act(() => {
        pressTab();
      });

      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);
    });

    it('should cycle focus from first to last element on Shift+Tab', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      // Advance timers for initial focus
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // First button should have focus
      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);

      // Press Shift+Tab - should wrap to last
      act(() => {
        pressTab(true);
      });

      const lastButton = container.querySelector('[data-testid="button-2"]');
      expect(document.activeElement).toBe(lastButton);
    });

    it('should handle single focusable element', () => {
      container = createMockContainer(1);
      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      // Advance timers for initial focus
      act(() => {
        vi.advanceTimersByTime(1);
      });

      const onlyButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(onlyButton);

      // Tab should keep focus on the same element (wraps to itself)
      act(() => {
        pressTab();
      });

      expect(document.activeElement).toBe(onlyButton);

      // Shift+Tab should also keep focus on the same element
      act(() => {
        pressTab(true);
      });

      expect(document.activeElement).toBe(onlyButton);
    });

    it('should not trap focus when inactive', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, false));

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Focus the last button manually
      const lastButton = container.querySelector('[data-testid="button-2"]') as HTMLButtonElement;
      act(() => {
        lastButton.focus();
      });

      // Press Tab - should NOT wrap (trap is inactive)
      // In jsdom, Tab doesn't actually move focus, so we just verify no error
      act(() => {
        pressTab();
      });

      // Focus should still be on last button (jsdom doesn't move focus on Tab)
      expect(document.activeElement).toBe(lastButton);
    });
  });

  describe('Focus Restoration on Deactivation', () => {
    it('should return focus to trigger element on unmount', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

      // Advance timers for initial focus
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Focus should be in container
      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);

      // Unmount
      unmount();

      // Focus should return to trigger
      expect(document.activeElement).toBe(triggerElement);
    });

    it('should store previous element only once per activation', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      const { rerender, unmount } = renderHook(
        ({ isActive }) => useFocusTrap(containerRef, isActive),
        { initialProps: { isActive: true } }
      );

      // Advance timers for initial focus
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Focus should be in container
      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);

      // Rerender with same isActive - should not change stored element
      rerender({ isActive: true });
      
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Unmount
      unmount();

      // Focus should return to original trigger (not the button)
      expect(document.activeElement).toBe(triggerElement);
    });
  });

  describe('Focusable Element Detection', () => {
    it('should detect buttons as focusable', () => {
      container = document.createElement('div');
      const button = document.createElement('button');
      button.textContent = 'Click me';
      container.appendChild(button);
      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(document.activeElement).toBe(button);
    });

    it('should detect links with href as focusable', () => {
      container = document.createElement('div');
      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.textContent = 'Link';
      container.appendChild(link);
      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(document.activeElement).toBe(link);
    });

    it('should detect inputs as focusable', () => {
      container = document.createElement('div');
      const input = document.createElement('input');
      input.type = 'text';
      container.appendChild(input);
      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(document.activeElement).toBe(input);
    });

    it('should detect elements with tabindex as focusable', () => {
      container = document.createElement('div');
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      div.textContent = 'Focusable div';
      container.appendChild(div);
      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(document.activeElement).toBe(div);
    });

    it('should skip disabled buttons', () => {
      container = document.createElement('div');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      disabledButton.textContent = 'Disabled';
      container.appendChild(disabledButton);

      const enabledButton = document.createElement('button');
      enabledButton.textContent = 'Enabled';
      container.appendChild(enabledButton);

      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Should focus the enabled button, not the disabled one
      expect(document.activeElement).toBe(enabledButton);
    });

    it('should skip elements with tabindex="-1"', () => {
      container = document.createElement('div');
      const hiddenDiv = document.createElement('div');
      hiddenDiv.setAttribute('tabindex', '-1');
      hiddenDiv.textContent = 'Not focusable';
      container.appendChild(hiddenDiv);

      const button = document.createElement('button');
      button.textContent = 'Focusable';
      container.appendChild(button);

      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Should focus the button, not the div with tabindex=-1
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Non-Tab Key Events', () => {
    it('should not interfere with non-Tab key events', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);

      // Press Enter - should not affect focus
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(document.activeElement).toBe(firstButton);

      // Press Escape - should not affect focus (focus trap doesn't handle Escape)
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle activation toggle correctly', () => {
      container = createMockContainer(3);
      const containerRef = { current: container };

      const { rerender, unmount } = renderHook(
        ({ isActive }) => useFocusTrap(containerRef, isActive),
        { initialProps: { isActive: false } }
      );

      // Initially inactive - trigger should have focus
      expect(document.activeElement).toBe(triggerElement);

      // Activate
      rerender({ isActive: true });
      act(() => {
        vi.advanceTimersByTime(1);
      });

      // Focus should move to container
      const firstButton = container.querySelector('[data-testid="button-0"]');
      expect(document.activeElement).toBe(firstButton);

      // Deactivate
      rerender({ isActive: false });
      
      // Unmount to trigger cleanup
      unmount();

      // Focus should return to trigger
      expect(document.activeElement).toBe(triggerElement);
    });

    it('should handle multiple focusable element types', () => {
      container = document.createElement('div');
      
      const button = document.createElement('button');
      button.textContent = 'Button';
      container.appendChild(button);
      
      const input = document.createElement('input');
      input.type = 'text';
      container.appendChild(input);
      
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Link';
      container.appendChild(link);
      
      document.body.appendChild(container);

      const containerRef = { current: container };

      renderHook(() => useFocusTrap(containerRef, true));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      // First element (button) should have focus
      expect(document.activeElement).toBe(button);

      // Focus the link (last element)
      act(() => {
        link.focus();
      });

      // Tab should wrap to button
      act(() => {
        pressTab();
      });

      expect(document.activeElement).toBe(button);
    });
  });
});


/**
 * Feature: modal-popup-selectors
 * Property 2: Focus Trap Cycling
 * 
 * **Validates: Requirements 1.6**
 * 
 * Property Definition:
 * For any Modal with N focusable elements (where N > 0), pressing Tab N times from the first
 * focusable element SHALL return focus to the first focusable element, and pressing Shift+Tab
 * from the first element SHALL move focus to the last element.
 * 
 * Note: The focus trap hook only handles boundary wrapping (Tab from last → first, Shift+Tab
 * from first → last). In jsdom, the browser's Tab behavior doesn't actually move focus between
 * elements - it only fires the keydown event. The hook intercepts Tab at boundaries and
 * programmatically moves focus.
 */

describe('useFocusTrap - Property-Based Tests', () => {
  /**
   * Feature: modal-popup-selectors
   * Property 2: Focus Trap Cycling
   * 
   * **Validates: Requirements 1.6**
   */

  let container: HTMLDivElement;
  let triggerElement: HTMLButtonElement;

  /**
   * Helper to create a container with N focusable elements
   */
  function createContainerWithFocusableElements(count: number): HTMLDivElement {
    const div = document.createElement('div');
    
    for (let i = 0; i < count; i++) {
      const button = document.createElement('button');
      button.textContent = `Button ${i + 1}`;
      button.setAttribute('data-testid', `pbt-button-${i}`);
      div.appendChild(button);
    }
    
    document.body.appendChild(div);
    return div;
  }

  /**
   * Helper to clean up container
   */
  function cleanupContainer(containerEl: HTMLDivElement): void {
    if (containerEl.parentNode) {
      containerEl.parentNode.removeChild(containerEl);
    }
  }

  /**
   * Helper to simulate Tab key press
   */
  function pressTabKey(shiftKey = false): void {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    
    // Create a trigger element that will have focus before the trap activates
    triggerElement = document.createElement('button');
    triggerElement.textContent = 'Trigger';
    triggerElement.setAttribute('data-testid', 'pbt-trigger');
    document.body.appendChild(triggerElement);
    triggerElement.focus();
  });

  afterEach(() => {
    vi.useRealTimers();
    
    if (container) {
      cleanupContainer(container);
    }
    if (triggerElement.parentNode) {
      triggerElement.parentNode.removeChild(triggerElement);
    }
    vi.clearAllMocks();
  });

  // Arbitrary for generating number of focusable elements (1 to 10)
  const focusableCountArbitrary = fc.integer({ min: 1, max: 10 });

  describe('Property 2: Focus Trap Cycling', () => {
    /**
     * Property: For any Modal with N focusable elements (where N > 0), pressing Tab N times
     * from the first focusable element SHALL return focus to the first focusable element.
     * 
     * **Validates: Requirements 1.6**
     * 
     * Implementation Note: The focus trap only handles boundary wrapping. When focus is on
     * the first element and Tab is pressed, the browser would normally move to the next element.
     * When focus is on the last element and Tab is pressed, the hook wraps to the first.
     * In jsdom, Tab doesn't move focus between elements, so we simulate the full cycle by
     * manually moving focus to the last element and then pressing Tab.
     */

    it('pressing Tab from last element wraps focus to first element for any N', () => {
      fc.assert(
        fc.property(
          focusableCountArbitrary,
          (n: number) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(n);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Focus the last element (simulating user tabbing to the end)
            const firstElement = container.querySelector('[data-testid="pbt-button-0"]');
            const lastElement = container.querySelector(`[data-testid="pbt-button-${n - 1}"]`) as HTMLButtonElement;
            act(() => {
              lastElement.focus();
            });
            expect(document.activeElement).toBe(lastElement);

            // Act - Press Tab from last element
            act(() => {
              pressTabKey();
            });

            // Assert - Focus should wrap to the first element
            expect(document.activeElement).toBe(firstElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pressing Shift+Tab from first element wraps focus to last element for any N', () => {
      fc.assert(
        fc.property(
          focusableCountArbitrary,
          (n: number) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(n);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Verify first element has focus (initial state)
            const firstElement = container.querySelector('[data-testid="pbt-button-0"]');
            const lastElement = container.querySelector(`[data-testid="pbt-button-${n - 1}"]`);
            expect(document.activeElement).toBe(firstElement);

            // Act - Press Shift+Tab from first element
            act(() => {
              pressTabKey(true);
            });

            // Assert - Focus should wrap to the last element
            expect(document.activeElement).toBe(lastElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Tab from last followed by Shift+Tab returns to last element for any N', () => {
      fc.assert(
        fc.property(
          focusableCountArbitrary,
          (n: number) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(n);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Focus the last element
            const lastElement = container.querySelector(`[data-testid="pbt-button-${n - 1}"]`) as HTMLButtonElement;
            act(() => {
              lastElement.focus();
            });
            expect(document.activeElement).toBe(lastElement);

            // Act - Press Tab (wraps to first), then Shift+Tab (wraps back to last)
            act(() => {
              pressTabKey(); // Wraps from last to first
            });
            act(() => {
              pressTabKey(true); // Wraps from first to last
            });

            // Assert - Focus should be back on the last element
            expect(document.activeElement).toBe(lastElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Shift+Tab from first followed by Tab returns to first element for any N', () => {
      fc.assert(
        fc.property(
          focusableCountArbitrary,
          (n: number) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(n);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Verify first element has focus
            const firstElement = container.querySelector('[data-testid="pbt-button-0"]');
            expect(document.activeElement).toBe(firstElement);

            // Act - Press Shift+Tab (wraps to last), then Tab (wraps back to first)
            act(() => {
              pressTabKey(true); // Wraps from first to last
            });
            act(() => {
              pressTabKey(); // Wraps from last to first
            });

            // Assert - Focus should be back on the first element
            expect(document.activeElement).toBe(firstElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('single element container keeps focus on that element for any Tab/Shift+Tab sequence', () => {
      // Arbitrary for Tab sequence (true = Tab, false = Shift+Tab)
      const tabSequenceArbitrary = fc.array(fc.boolean(), { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(
          tabSequenceArbitrary,
          (tabSequence: boolean[]) => {
            // Arrange - Create container with exactly 1 focusable element
            container = createContainerWithFocusableElements(1);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Verify the only element has focus
            const onlyElement = container.querySelector('[data-testid="pbt-button-0"]');
            expect(document.activeElement).toBe(onlyElement);

            // Act - Execute the Tab sequence
            for (const isTab of tabSequence) {
              act(() => {
                pressTabKey(!isTab); // isTab=true means Tab, isTab=false means Shift+Tab
              });
            }

            // Assert - Focus should still be on the only element
            expect(document.activeElement).toBe(onlyElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple boundary wraps return focus to starting position for any N and wrap count', () => {
      // Arbitrary for element count and number of full wrap cycles
      const wrapCycleArbitrary = fc.record({
        elementCount: fc.integer({ min: 1, max: 10 }),
        wrapCount: fc.integer({ min: 1, max: 10 }), // Number of full wrap cycles
      });

      fc.assert(
        fc.property(
          wrapCycleArbitrary,
          ({ elementCount, wrapCount }) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(elementCount);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Start from first element
            const firstElement = container.querySelector('[data-testid="pbt-button-0"]');
            expect(document.activeElement).toBe(firstElement);

            // Act - Perform wrapCount full cycles (Shift+Tab to last, Tab to first)
            for (let i = 0; i < wrapCount; i++) {
              act(() => {
                pressTabKey(true); // Shift+Tab: first → last
              });
              act(() => {
                pressTabKey(); // Tab: last → first
              });
            }

            // Assert - Focus should be back on the first element
            expect(document.activeElement).toBe(firstElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('alternating Tab and Shift+Tab from boundary positions maintains trap integrity', () => {
      // Arbitrary for element count and sequence of boundary operations
      const boundaryOpsArbitrary = fc.record({
        elementCount: fc.integer({ min: 2, max: 10 }),
        operations: fc.array(
          fc.constantFrom('tab-from-last', 'shift-tab-from-first') as fc.Arbitrary<'tab-from-last' | 'shift-tab-from-first'>,
          { minLength: 1, maxLength: 20 }
        ),
      });

      fc.assert(
        fc.property(
          boundaryOpsArbitrary,
          ({ elementCount, operations }) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(elementCount);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            const firstElement = container.querySelector('[data-testid="pbt-button-0"]') as HTMLButtonElement;
            const lastElement = container.querySelector(`[data-testid="pbt-button-${elementCount - 1}"]`) as HTMLButtonElement;

            // Track expected position
            let expectedAtFirst = true; // Start at first element

            // Act - Execute operations
            for (const op of operations) {
              if (op === 'tab-from-last') {
                // Move to last, then Tab to wrap to first
                act(() => {
                  lastElement.focus();
                });
                act(() => {
                  pressTabKey();
                });
                expectedAtFirst = true;
              } else {
                // Move to first, then Shift+Tab to wrap to last
                act(() => {
                  firstElement.focus();
                });
                act(() => {
                  pressTabKey(true);
                });
                expectedAtFirst = false;
              }
            }

            // Assert - Focus should be at expected position
            const expectedElement = expectedAtFirst ? firstElement : lastElement;
            expect(document.activeElement).toBe(expectedElement);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('focus trap correctly identifies first and last elements for any N', () => {
      fc.assert(
        fc.property(
          focusableCountArbitrary,
          (n: number) => {
            // Arrange - Create container with N focusable elements
            container = createContainerWithFocusableElements(n);
            const containerRef = { current: container };

            // Activate focus trap
            const { unmount } = renderHook(() => useFocusTrap(containerRef, true));

            // Advance timers for initial focus
            act(() => {
              vi.advanceTimersByTime(1);
            });

            // Get expected first and last elements
            const expectedFirst = container.querySelector('[data-testid="pbt-button-0"]');
            const expectedLast = container.querySelector(`[data-testid="pbt-button-${n - 1}"]`) as HTMLButtonElement;

            // Verify initial focus is on first element
            expect(document.activeElement).toBe(expectedFirst);

            // Verify Shift+Tab from first goes to last
            act(() => {
              pressTabKey(true);
            });
            expect(document.activeElement).toBe(expectedLast);

            // Verify Tab from last goes to first
            act(() => {
              pressTabKey();
            });
            expect(document.activeElement).toBe(expectedFirst);

            // Cleanup
            unmount();
            cleanupContainer(container);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
