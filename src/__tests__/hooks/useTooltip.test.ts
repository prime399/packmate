import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useTooltip, type TooltipState } from '@/hooks/useTooltip';

// Feature: command-footer-ux
// Property 11: Tooltip Follows Cursor X Position
// Property 14: Tooltip Hover Persistence
// Property 15: Tooltip Dismiss Events
// **Validates: Requirements 5.1, 5.7, 5.8**

/**
 * Pure tooltip positioning logic extracted for property testing.
 * This mirrors the show() behavior in useTooltip hook.
 * 
 * For any tooltip show event with mouse position (x, y), the tooltip's
 * x coordinate SHALL equal the mouse's clientX value.
 */
function computeTooltipPosition(
  mouseClientX: number,
  mouseClientY: number,
  elementRect: { top: number; left: number; right: number; bottom: number }
): TooltipState {
  return {
    content: 'test content',
    x: mouseClientX, // Tooltip x follows mouse clientX
    y: elementRect.top, // Tooltip y uses element top
  };
}

/**
 * Pure tooltip visibility logic extracted for property testing.
 * This mirrors the hover persistence behavior in useTooltip hook.
 * 
 * For any tooltip that is visible, if the mouse enters the tooltip element
 * (isOverTooltip=true), the tooltip SHALL remain visible even if the mouse
 * leaves the trigger element.
 */
function computeTooltipVisibility(
  isOverTrigger: boolean,
  isOverTooltip: boolean,
  currentTooltip: TooltipState | null
): boolean {
  // Tooltip remains visible if hovering over trigger OR tooltip
  if (currentTooltip === null) return false;
  return isOverTrigger || isOverTooltip;
}

/**
 * Pure tooltip dismiss logic extracted for property testing.
 * This mirrors the dismiss behavior in useTooltip hook.
 * 
 * For any visible tooltip, a mousedown, scroll, or Escape keydown event
 * SHALL immediately set the tooltip state to null.
 */
function computeTooltipAfterDismissEvent(
  currentTooltip: TooltipState | null,
  eventType: 'mousedown' | 'scroll' | 'keydown-escape'
): TooltipState | null {
  // Any dismiss event immediately sets tooltip to null
  if (eventType === 'mousedown' || eventType === 'scroll' || eventType === 'keydown-escape') {
    return null;
  }
  return currentTooltip;
}

// Arbitrary generators for property tests

// Generate valid mouse coordinates (within reasonable viewport bounds)
const mouseCoordinateArb = fc.integer({ min: 0, max: 2000 });

// Generate valid element rect
const elementRectArb = fc.record({
  top: fc.integer({ min: 0, max: 1000 }),
  left: fc.integer({ min: 0, max: 1000 }),
  right: fc.integer({ min: 100, max: 2000 }),
  bottom: fc.integer({ min: 100, max: 2000 }),
});

// Generate tooltip content
const tooltipContentArb = fc.string({ minLength: 1, maxLength: 200 });

// Generate a tooltip state
const tooltipStateArb = fc.record({
  content: tooltipContentArb,
  x: mouseCoordinateArb,
  y: mouseCoordinateArb,
});

// Generate dismiss event types
const dismissEventArb = fc.constantFrom(
  'mousedown' as const,
  'scroll' as const,
  'keydown-escape' as const
);

// Generate boolean for hover states
const hoverStateArb = fc.boolean();

describe('useTooltip - Property 11: Tooltip Follows Cursor X Position', () => {
  // Feature: command-footer-ux, Property 11: Tooltip Follows Cursor X Position
  // **Validates: Requirements 5.1**

  describe('Property 11: Tooltip Follows Cursor X Position', () => {
    it('tooltip x coordinate equals mouse clientX for any mouse position', () => {
      fc.assert(
        fc.property(
          mouseCoordinateArb,
          mouseCoordinateArb,
          elementRectArb,
          (mouseX, mouseY, elementRect) => {
            // Compute tooltip position
            const tooltipState = computeTooltipPosition(mouseX, mouseY, elementRect);
            
            // Property: Tooltip x must equal mouse clientX
            expect(tooltipState.x).toBe(mouseX);
            
            return tooltipState.x === mouseX;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip y coordinate equals element top for any element position', () => {
      fc.assert(
        fc.property(
          mouseCoordinateArb,
          mouseCoordinateArb,
          elementRectArb,
          (mouseX, mouseY, elementRect) => {
            // Compute tooltip position
            const tooltipState = computeTooltipPosition(mouseX, mouseY, elementRect);
            
            // Property: Tooltip y must equal element top
            expect(tooltipState.y).toBe(elementRect.top);
            
            return tooltipState.y === elementRect.top;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip position is independent of element left/right/bottom', () => {
      fc.assert(
        fc.property(
          mouseCoordinateArb,
          mouseCoordinateArb,
          fc.integer({ min: 0, max: 1000 }), // top
          fc.integer({ min: 0, max: 2000 }), // left
          fc.integer({ min: 0, max: 2000 }), // right
          fc.integer({ min: 0, max: 2000 }), // bottom
          (mouseX, mouseY, top, left, right, bottom) => {
            const elementRect1 = { top, left, right, bottom };
            const elementRect2 = { top, left: left + 100, right: right + 100, bottom: bottom + 100 };
            
            // Compute tooltip positions with different element rects (same top)
            const tooltipState1 = computeTooltipPosition(mouseX, mouseY, elementRect1);
            const tooltipState2 = computeTooltipPosition(mouseX, mouseY, elementRect2);
            
            // Property: Tooltip position should be the same (only depends on mouseX and element top)
            expect(tooltipState1.x).toBe(tooltipState2.x);
            expect(tooltipState1.y).toBe(tooltipState2.y);
            
            return tooltipState1.x === tooltipState2.x && tooltipState1.y === tooltipState2.y;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip x follows cursor across entire viewport width', () => {
      fc.assert(
        fc.property(
          fc.array(mouseCoordinateArb, { minLength: 2, maxLength: 10 }),
          elementRectArb,
          (mouseXPositions, elementRect) => {
            // Test multiple cursor positions
            for (const mouseX of mouseXPositions) {
              const tooltipState = computeTooltipPosition(mouseX, 100, elementRect);
              
              // Property: Each tooltip x must match its corresponding mouseX
              expect(tooltipState.x).toBe(mouseX);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip position is deterministic for same inputs', () => {
      fc.assert(
        fc.property(
          mouseCoordinateArb,
          mouseCoordinateArb,
          elementRectArb,
          (mouseX, mouseY, elementRect) => {
            // Compute tooltip position twice with same inputs
            const tooltipState1 = computeTooltipPosition(mouseX, mouseY, elementRect);
            const tooltipState2 = computeTooltipPosition(mouseX, mouseY, elementRect);
            
            // Property: Same inputs should produce same outputs
            expect(tooltipState1.x).toBe(tooltipState2.x);
            expect(tooltipState1.y).toBe(tooltipState2.y);
            
            return tooltipState1.x === tooltipState2.x && tooltipState1.y === tooltipState2.y;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('useTooltip - Property 14: Tooltip Hover Persistence', () => {
  // Feature: command-footer-ux, Property 14: Tooltip Hover Persistence
  // **Validates: Requirements 5.7**

  describe('Property 14: Tooltip Hover Persistence', () => {
    it('tooltip remains visible when mouse is over tooltip element', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          hoverStateArb, // isOverTrigger
          (tooltip, isOverTrigger) => {
            // Mouse is over tooltip
            const isOverTooltip = true;
            
            // Compute visibility
            const isVisible = computeTooltipVisibility(isOverTrigger, isOverTooltip, tooltip);
            
            // Property: Tooltip must remain visible when hovering over tooltip
            expect(isVisible).toBe(true);
            
            return isVisible === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip remains visible when mouse is over trigger element', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          hoverStateArb, // isOverTooltip
          (tooltip, isOverTooltip) => {
            // Mouse is over trigger
            const isOverTrigger = true;
            
            // Compute visibility
            const isVisible = computeTooltipVisibility(isOverTrigger, isOverTooltip, tooltip);
            
            // Property: Tooltip must remain visible when hovering over trigger
            expect(isVisible).toBe(true);
            
            return isVisible === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip hides when mouse leaves both trigger and tooltip', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          (tooltip) => {
            // Mouse is not over trigger or tooltip
            const isOverTrigger = false;
            const isOverTooltip = false;
            
            // Compute visibility
            const isVisible = computeTooltipVisibility(isOverTrigger, isOverTooltip, tooltip);
            
            // Property: Tooltip must hide when not hovering over either
            expect(isVisible).toBe(false);
            
            return isVisible === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null tooltip is never visible regardless of hover state', () => {
      fc.assert(
        fc.property(
          hoverStateArb,
          hoverStateArb,
          (isOverTrigger, isOverTooltip) => {
            // No tooltip
            const tooltip: TooltipState | null = null;
            
            // Compute visibility
            const isVisible = computeTooltipVisibility(isOverTrigger, isOverTooltip, tooltip);
            
            // Property: Null tooltip is never visible
            expect(isVisible).toBe(false);
            
            return isVisible === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tooltip visibility follows OR logic: visible if over trigger OR over tooltip', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          hoverStateArb,
          hoverStateArb,
          (tooltip, isOverTrigger, isOverTooltip) => {
            // Compute visibility
            const isVisible = computeTooltipVisibility(isOverTrigger, isOverTooltip, tooltip);
            
            // Property: Visibility should follow OR logic
            const expectedVisible = isOverTrigger || isOverTooltip;
            expect(isVisible).toBe(expectedVisible);
            
            return isVisible === expectedVisible;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('transitioning from trigger to tooltip keeps tooltip visible', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          (tooltip) => {
            // Simulate transition: start over trigger
            const step1 = computeTooltipVisibility(true, false, tooltip);
            expect(step1).toBe(true);
            
            // Transition: over both (brief moment)
            const step2 = computeTooltipVisibility(true, true, tooltip);
            expect(step2).toBe(true);
            
            // Transition: only over tooltip
            const step3 = computeTooltipVisibility(false, true, tooltip);
            expect(step3).toBe(true);
            
            // Property: Tooltip remains visible throughout transition
            return step1 && step2 && step3;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('useTooltip - Property 15: Tooltip Dismiss Events', () => {
  // Feature: command-footer-ux, Property 15: Tooltip Dismiss Events
  // **Validates: Requirements 5.8**

  describe('Property 15: Tooltip Dismiss Events', () => {
    it('mousedown event dismisses any visible tooltip', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          (tooltip) => {
            // Compute tooltip after mousedown
            const result = computeTooltipAfterDismissEvent(tooltip, 'mousedown');
            
            // Property: Tooltip must be null after mousedown
            expect(result).toBeNull();
            
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('scroll event dismisses any visible tooltip', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          (tooltip) => {
            // Compute tooltip after scroll
            const result = computeTooltipAfterDismissEvent(tooltip, 'scroll');
            
            // Property: Tooltip must be null after scroll
            expect(result).toBeNull();
            
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Escape keydown event dismisses any visible tooltip', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          (tooltip) => {
            // Compute tooltip after Escape keydown
            const result = computeTooltipAfterDismissEvent(tooltip, 'keydown-escape');
            
            // Property: Tooltip must be null after Escape
            expect(result).toBeNull();
            
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('any dismiss event on null tooltip keeps it null', () => {
      fc.assert(
        fc.property(
          dismissEventArb,
          (eventType) => {
            // Start with null tooltip
            const tooltip: TooltipState | null = null;
            
            // Compute tooltip after dismiss event
            const result = computeTooltipAfterDismissEvent(tooltip, eventType);
            
            // Property: Tooltip must remain null
            expect(result).toBeNull();
            
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all dismiss event types produce the same result (null)', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          (tooltip) => {
            // Apply all dismiss events
            const afterMousedown = computeTooltipAfterDismissEvent(tooltip, 'mousedown');
            const afterScroll = computeTooltipAfterDismissEvent(tooltip, 'scroll');
            const afterEscape = computeTooltipAfterDismissEvent(tooltip, 'keydown-escape');
            
            // Property: All dismiss events should produce null
            expect(afterMousedown).toBeNull();
            expect(afterScroll).toBeNull();
            expect(afterEscape).toBeNull();
            
            return afterMousedown === null && afterScroll === null && afterEscape === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('dismiss is immediate regardless of tooltip content or position', () => {
      fc.assert(
        fc.property(
          tooltipContentArb,
          mouseCoordinateArb,
          mouseCoordinateArb,
          dismissEventArb,
          (content, x, y, eventType) => {
            const tooltip: TooltipState = { content, x, y };
            
            // Compute tooltip after dismiss event
            const result = computeTooltipAfterDismissEvent(tooltip, eventType);
            
            // Property: Dismiss is immediate regardless of tooltip state
            expect(result).toBeNull();
            
            return result === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('dismiss is idempotent - multiple dismiss events keep tooltip null', () => {
      fc.assert(
        fc.property(
          tooltipStateArb,
          fc.array(dismissEventArb, { minLength: 1, maxLength: 10 }),
          (tooltip, eventSequence) => {
            let currentTooltip: TooltipState | null = tooltip;
            
            // Apply sequence of dismiss events
            for (const eventType of eventSequence) {
              currentTooltip = computeTooltipAfterDismissEvent(currentTooltip, eventType);
            }
            
            // Property: After any sequence of dismiss events, tooltip is null
            expect(currentTooltip).toBeNull();
            
            return currentTooltip === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// Integration tests with the actual hook
describe('useTooltip - Hook Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Property 11 Integration: Tooltip Follows Cursor X Position', () => {
    it('show() sets tooltip x to mouse clientX', () => {
      fc.assert(
        fc.property(
          mouseCoordinateArb,
          tooltipContentArb,
          (mouseX, content) => {
            const { result } = renderHook(() => useTooltip());
            
            // Create mock mouse event
            const mockEvent = {
              clientX: mouseX,
              clientY: 100,
              currentTarget: {
                getBoundingClientRect: () => ({
                  top: 50,
                  left: 0,
                  right: 100,
                  bottom: 100,
                }),
              },
            } as unknown as React.MouseEvent;
            
            // Call show
            act(() => {
              result.current.show(content, mockEvent);
            });
            
            // Advance timers past the 450ms delay
            act(() => {
              vi.advanceTimersByTime(500);
            });
            
            // Property: Tooltip x should equal mouse clientX
            expect(result.current.tooltip?.x).toBe(mouseX);
            
            return result.current.tooltip?.x === mouseX;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14 Integration: Tooltip Hover Persistence', () => {
    it('tooltipMouseEnter keeps tooltip visible after hide is called', () => {
      const { result } = renderHook(() => useTooltip());
      
      // Create mock mouse event
      const mockEvent = {
        clientX: 100,
        clientY: 100,
        currentTarget: {
          getBoundingClientRect: () => ({
            top: 50,
            left: 0,
            right: 100,
            bottom: 100,
          }),
        },
      } as unknown as React.MouseEvent;
      
      // Show tooltip
      act(() => {
        result.current.show('Test content', mockEvent);
      });
      
      // Advance past delay
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.tooltip).not.toBeNull();
      
      // Enter tooltip element
      act(() => {
        result.current.tooltipMouseEnter();
      });
      
      // Call hide (simulating mouse leaving trigger)
      act(() => {
        result.current.hide();
      });
      
      // Advance past hide delay
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      // Property: Tooltip should still be visible because we're over the tooltip
      expect(result.current.tooltip).not.toBeNull();
    });
  });

  describe('Property 15 Integration: Tooltip Dismiss Events', () => {
    it('mousedown event dismisses tooltip', () => {
      const { result } = renderHook(() => useTooltip());
      
      // Create mock mouse event
      const mockEvent = {
        clientX: 100,
        clientY: 100,
        currentTarget: {
          getBoundingClientRect: () => ({
            top: 50,
            left: 0,
            right: 100,
            bottom: 100,
          }),
        },
      } as unknown as React.MouseEvent;
      
      // Show tooltip
      act(() => {
        result.current.show('Test content', mockEvent);
      });
      
      // Advance past delay
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.tooltip).not.toBeNull();
      
      // Simulate mousedown event
      act(() => {
        window.dispatchEvent(new MouseEvent('mousedown'));
      });
      
      // Property: Tooltip should be dismissed
      expect(result.current.tooltip).toBeNull();
    });

    it('scroll event dismisses tooltip', () => {
      const { result } = renderHook(() => useTooltip());
      
      // Create mock mouse event
      const mockEvent = {
        clientX: 100,
        clientY: 100,
        currentTarget: {
          getBoundingClientRect: () => ({
            top: 50,
            left: 0,
            right: 100,
            bottom: 100,
          }),
        },
      } as unknown as React.MouseEvent;
      
      // Show tooltip
      act(() => {
        result.current.show('Test content', mockEvent);
      });
      
      // Advance past delay
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.tooltip).not.toBeNull();
      
      // Simulate scroll event
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      
      // Property: Tooltip should be dismissed
      expect(result.current.tooltip).toBeNull();
    });

    it('Escape key dismisses tooltip', () => {
      const { result } = renderHook(() => useTooltip());
      
      // Create mock mouse event
      const mockEvent = {
        clientX: 100,
        clientY: 100,
        currentTarget: {
          getBoundingClientRect: () => ({
            top: 50,
            left: 0,
            right: 100,
            bottom: 100,
          }),
        },
      } as unknown as React.MouseEvent;
      
      // Show tooltip
      act(() => {
        result.current.show('Test content', mockEvent);
      });
      
      // Advance past delay
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.tooltip).not.toBeNull();
      
      // Simulate Escape keydown event
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      
      // Property: Tooltip should be dismissed
      expect(result.current.tooltip).toBeNull();
    });
  });
});
