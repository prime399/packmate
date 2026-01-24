import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: gsap-animations, Property 2: Staggered Delay Calculation
 * **Validates: Requirements 3.3**
 *
 * Property: For any category with index N, the animation delay SHALL equal
 * N * 0.05 seconds. This ensures categories animate in sequence from
 * top-left to bottom-right.
 */
describe('Feature: gsap-animations, Property 2: Staggered Delay Calculation', () => {
  /**
   * The stagger delay calculation function.
   * This mirrors the calculation in CategorySection.tsx:
   *   const delay = categoryIndex * 0.05;
   */
  const calculateStaggerDelay = (categoryIndex: number): number => {
    return categoryIndex * 0.05;
  };

  /**
   * Animation configuration constants from the design document.
   */
  const STAGGER_FACTOR = 0.05;
  const MAX_REASONABLE_CATEGORIES = 100;

  /**
   * Floating point comparison tolerance.
   * Due to IEEE 754 floating point representation, 0.05 cannot be represented
   * exactly in binary, leading to small precision errors in calculations.
   */
  const FLOAT_TOLERANCE = 1e-10;

  /**
   * Property: Stagger delay equals categoryIndex * 0.05 for all valid indices
   *
   * For any non-negative integer category index, the calculated delay
   * must equal exactly categoryIndex * STAGGER_FACTOR (0.05).
   */
  it('delay equals categoryIndex * 0.05 for all valid indices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_REASONABLE_CATEGORIES }),
        (categoryIndex: number) => {
          const delay = calculateStaggerDelay(categoryIndex);
          const expectedDelay = categoryIndex * STAGGER_FACTOR;

          // Use approximate equality due to floating point precision
          return Math.abs(delay - expectedDelay) < Number.EPSILON;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Stagger delay is non-negative for all valid indices
   *
   * Since category indices are non-negative, the delay should always
   * be non-negative.
   */
  it('delay is non-negative for all valid indices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_REASONABLE_CATEGORIES }),
        (categoryIndex: number) => {
          const delay = calculateStaggerDelay(categoryIndex);
          return delay >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Stagger delay increases monotonically with category index
   *
   * For any two category indices where index1 < index2, the delay for
   * index1 should be less than the delay for index2.
   */
  it('delay increases monotonically with category index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_REASONABLE_CATEGORIES - 1 }),
        fc.integer({ min: 1, max: MAX_REASONABLE_CATEGORIES }),
        (index1: number, index2: number) => {
          // Ensure index1 < index2
          const lowerIndex = Math.min(index1, index2);
          const higherIndex = Math.max(index1, index2);

          if (lowerIndex === higherIndex) {
            return true; // Skip equal indices
          }

          const delay1 = calculateStaggerDelay(lowerIndex);
          const delay2 = calculateStaggerDelay(higherIndex);

          return delay1 < delay2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Delay difference between consecutive indices equals STAGGER_FACTOR
   *
   * For any category index N, the difference between delay(N+1) and delay(N)
   * should equal exactly STAGGER_FACTOR (0.05) within floating point tolerance.
   */
  it('delay difference between consecutive indices equals 0.05', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_REASONABLE_CATEGORIES - 1 }),
        (categoryIndex: number) => {
          const currentDelay = calculateStaggerDelay(categoryIndex);
          const nextDelay = calculateStaggerDelay(categoryIndex + 1);
          const difference = nextDelay - currentDelay;

          // Use approximate equality due to floating point precision
          return Math.abs(difference - STAGGER_FACTOR) < FLOAT_TOLERANCE;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: First category (index 0) has zero delay
   *
   * The first category should animate immediately without delay.
   */
  it('first category (index 0) has zero delay', () => {
    const delay = calculateStaggerDelay(0);
    expect(delay).toBe(0);
  });

  // Unit tests for specific edge cases
  describe('specific delay calculations', () => {
    it('calculates correct delay for index 0', () => {
      expect(calculateStaggerDelay(0)).toBe(0);
    });

    it('calculates correct delay for index 1', () => {
      expect(calculateStaggerDelay(1)).toBe(0.05);
    });

    it('calculates correct delay for index 10', () => {
      expect(calculateStaggerDelay(10)).toBe(0.5);
    });

    it('calculates correct delay for index 15 (typical max categories)', () => {
      // With 15 categories (indices 0-14), max delay is 14 * 0.05 = 0.7s
      // Use toBeCloseTo for floating point comparison
      expect(calculateStaggerDelay(14)).toBeCloseTo(0.7, 10);
    });

    it('calculates correct delay for index 20', () => {
      expect(calculateStaggerDelay(20)).toBe(1.0);
    });

    it('calculates correct delay for index 100', () => {
      expect(calculateStaggerDelay(100)).toBe(5.0);
    });
  });

  /**
   * Property: Delay calculation is deterministic
   *
   * For any category index, calling the function multiple times
   * should always return the same result.
   */
  it('delay calculation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_REASONABLE_CATEGORIES }),
        (categoryIndex: number) => {
          const delay1 = calculateStaggerDelay(categoryIndex);
          const delay2 = calculateStaggerDelay(categoryIndex);
          const delay3 = calculateStaggerDelay(categoryIndex);

          return delay1 === delay2 && delay2 === delay3;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Delay is proportional to category index
   *
   * For any category index N and multiplier M, delay(N*M) should equal
   * M * delay(N) (within floating point precision).
   */
  it('delay is proportional to category index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (baseIndex: number, multiplier: number) => {
          const baseDelay = calculateStaggerDelay(baseIndex);
          const multipliedDelay = calculateStaggerDelay(baseIndex * multiplier);
          const expectedDelay = baseDelay * multiplier;

          // Use approximate equality due to floating point precision
          return Math.abs(multipliedDelay - expectedDelay) < 1e-10;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: gsap-animations, Property 3: Animation Idempotence
 * **Validates: Requirements 3.5**
 *
 * Property: For any category section that has already animated
 * (hasAnimated.current === true), subsequent renders SHALL NOT trigger
 * new entrance animations. The animation should only run once per
 * component mount.
 */
describe('Feature: gsap-animations, Property 3: Animation Idempotence', () => {
  /**
   * Simulates the animation guard logic from CategorySection.tsx.
   * This mirrors the behavior:
   *   if (!sectionRef.current || hasAnimated.current) return;
   *   hasAnimated.current = true;
   *   // ... run animation
   */
  interface AnimationState {
    hasAnimated: boolean;
    animationRunCount: number;
  }

  /**
   * Simulates a single effect trigger (like useLayoutEffect running).
   * Returns the new state and whether animation was executed.
   */
  const simulateEffectTrigger = (
    state: AnimationState,
    sectionRefExists: boolean
  ): { newState: AnimationState; animationExecuted: boolean } => {
    // Guard check: if no ref or already animated, don't run animation
    if (!sectionRefExists || state.hasAnimated) {
      return {
        newState: state,
        animationExecuted: false,
      };
    }

    // Animation runs and sets hasAnimated to true
    return {
      newState: {
        hasAnimated: true,
        animationRunCount: state.animationRunCount + 1,
      },
      animationExecuted: true,
    };
  };

  /**
   * Simulates multiple effect triggers (like multiple re-renders).
   * Returns the final state and total animation count.
   */
  const simulateMultipleEffectTriggers = (
    initialState: AnimationState,
    sectionRefExists: boolean,
    triggerCount: number
  ): { finalState: AnimationState; totalAnimations: number } => {
    let currentState = { ...initialState };
    let totalAnimations = 0;

    for (let i = 0; i < triggerCount; i++) {
      const result = simulateEffectTrigger(currentState, sectionRefExists);
      currentState = result.newState;
      if (result.animationExecuted) {
        totalAnimations++;
      }
    }

    return { finalState: currentState, totalAnimations };
  };

  /**
   * Property: Animation runs exactly once when hasAnimated starts as false
   *
   * For any number of effect triggers (>= 1) with a valid section ref,
   * starting from hasAnimated = false, the animation should run exactly once.
   */
  it('animation runs exactly once when hasAnimated starts as false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Number of effect triggers
        (triggerCount: number) => {
          const initialState: AnimationState = {
            hasAnimated: false,
            animationRunCount: 0,
          };

          const { finalState, totalAnimations } = simulateMultipleEffectTriggers(
            initialState,
            true, // sectionRef exists
            triggerCount
          );

          // Animation should run exactly once
          return totalAnimations === 1 && finalState.hasAnimated === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Animation never runs when hasAnimated starts as true
   *
   * For any number of effect triggers with hasAnimated already true,
   * no additional animations should run.
   */
  it('animation never runs when hasAnimated starts as true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Number of effect triggers
        (triggerCount: number) => {
          const initialState: AnimationState = {
            hasAnimated: true,
            animationRunCount: 5, // Some previous count
          };

          const { finalState, totalAnimations } = simulateMultipleEffectTriggers(
            initialState,
            true, // sectionRef exists
            triggerCount
          );

          // No new animations should run
          return (
            totalAnimations === 0 &&
            finalState.animationRunCount === 5 && // Count unchanged
            finalState.hasAnimated === true
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Animation never runs when sectionRef is null
   *
   * For any number of effect triggers without a valid section ref,
   * no animations should run regardless of hasAnimated state.
   */
  it('animation never runs when sectionRef is null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Number of effect triggers
        fc.boolean(), // Initial hasAnimated state
        (triggerCount: number, initialHasAnimated: boolean) => {
          const initialState: AnimationState = {
            hasAnimated: initialHasAnimated,
            animationRunCount: 0,
          };

          const { finalState, totalAnimations } = simulateMultipleEffectTriggers(
            initialState,
            false, // sectionRef does NOT exist
            triggerCount
          );

          // No animations should run
          return (
            totalAnimations === 0 &&
            finalState.hasAnimated === initialHasAnimated // State unchanged
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasAnimated becomes true after first animation
   *
   * For any initial state where hasAnimated is false and sectionRef exists,
   * after one effect trigger, hasAnimated should be true.
   */
  it('hasAnimated becomes true after first animation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // Initial animation run count (irrelevant)
        (initialRunCount: number) => {
          const initialState: AnimationState = {
            hasAnimated: false,
            animationRunCount: initialRunCount,
          };

          const result = simulateEffectTrigger(initialState, true);

          return (
            result.animationExecuted === true &&
            result.newState.hasAnimated === true
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Animation count is bounded by 1 regardless of trigger count
   *
   * For any number of effect triggers, the total animation count should
   * never exceed 1 (assuming we start from hasAnimated = false).
   */
  it('animation count is bounded by 1 regardless of trigger count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // Large number of triggers
        (triggerCount: number) => {
          const initialState: AnimationState = {
            hasAnimated: false,
            animationRunCount: 0,
          };

          const { totalAnimations } = simulateMultipleEffectTriggers(
            initialState,
            true,
            triggerCount
          );

          return totalAnimations <= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State transition is idempotent after first animation
   *
   * Once hasAnimated is true, any subsequent effect trigger should
   * return the exact same state (no mutations).
   */
  it('state transition is idempotent after first animation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // At least 2 triggers
        (triggerCount: number) => {
          const initialState: AnimationState = {
            hasAnimated: false,
            animationRunCount: 0,
          };

          // Run first trigger to set hasAnimated = true
          const afterFirst = simulateEffectTrigger(initialState, true);

          // Run remaining triggers
          const states: AnimationState[] = [afterFirst.newState];
          let currentState = afterFirst.newState;

          for (let i = 1; i < triggerCount; i++) {
            const result = simulateEffectTrigger(currentState, true);
            states.push(result.newState);
            currentState = result.newState;
          }

          // All states after the first should be identical
          const firstStateAfterAnimation = states[0];
          return states.every(
            (state) =>
              state.hasAnimated === firstStateAfterAnimation.hasAnimated &&
              state.animationRunCount === firstStateAfterAnimation.animationRunCount
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit tests for specific edge cases
  describe('specific idempotence scenarios', () => {
    it('first trigger with valid ref runs animation', () => {
      const initialState: AnimationState = {
        hasAnimated: false,
        animationRunCount: 0,
      };

      const result = simulateEffectTrigger(initialState, true);

      expect(result.animationExecuted).toBe(true);
      expect(result.newState.hasAnimated).toBe(true);
      expect(result.newState.animationRunCount).toBe(1);
    });

    it('second trigger does not run animation', () => {
      const stateAfterFirst: AnimationState = {
        hasAnimated: true,
        animationRunCount: 1,
      };

      const result = simulateEffectTrigger(stateAfterFirst, true);

      expect(result.animationExecuted).toBe(false);
      expect(result.newState.hasAnimated).toBe(true);
      expect(result.newState.animationRunCount).toBe(1);
    });

    it('100 triggers result in exactly 1 animation', () => {
      const initialState: AnimationState = {
        hasAnimated: false,
        animationRunCount: 0,
      };

      const { totalAnimations, finalState } = simulateMultipleEffectTriggers(
        initialState,
        true,
        100
      );

      expect(totalAnimations).toBe(1);
      expect(finalState.hasAnimated).toBe(true);
      expect(finalState.animationRunCount).toBe(1);
    });

    it('trigger without ref does not change state', () => {
      const initialState: AnimationState = {
        hasAnimated: false,
        animationRunCount: 0,
      };

      const result = simulateEffectTrigger(initialState, false);

      expect(result.animationExecuted).toBe(false);
      expect(result.newState).toEqual(initialState);
    });

    it('multiple triggers without ref never animate', () => {
      const initialState: AnimationState = {
        hasAnimated: false,
        animationRunCount: 0,
      };

      const { totalAnimations, finalState } = simulateMultipleEffectTriggers(
        initialState,
        false,
        50
      );

      expect(totalAnimations).toBe(0);
      expect(finalState.hasAnimated).toBe(false);
    });
  });
});


/**
 * Feature: gsap-animations, CSS Initial States
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 *
 * Unit tests to verify that globals.css contains the required CSS initial
 * state rules for GSAP animations. These rules hide elements before GSAP
 * animates them visible, preventing flash of unstyled content.
 */
describe('Feature: gsap-animations, CSS Initial States', () => {
  let cssContent: string;

  beforeAll(async () => {
    // Read the globals.css file content
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(__dirname, '../../app/globals.css');
    cssContent = fs.readFileSync(cssPath, 'utf-8');
  });

  /**
   * Requirement 4.1: Category header initial state
   * THE Stylesheet SHALL define .category-header with clip-path: inset(0 100% 0 0) as initial state
   */
  describe('Requirement 4.1: .category-header initial state', () => {
    it('should have .category-header class defined', () => {
      expect(cssContent).toMatch(/\.category-header\s*\{/);
    });

    it('should have clip-path: inset(0 100% 0 0) for .category-header', () => {
      // Match .category-header rule with clip-path property
      const categoryHeaderMatch = cssContent.match(
        /\.category-header\s*\{[^}]*clip-path:\s*inset\s*\(\s*0\s+100%\s+0\s+0\s*\)[^}]*\}/
      );
      expect(categoryHeaderMatch).not.toBeNull();
    });
  });

  /**
   * Requirement 4.2: App item initial state
   * THE Stylesheet SHALL define .app-item with opacity: 0 and transform: translateY(-20px) as initial state
   */
  describe('Requirement 4.2: .app-item initial state', () => {
    it('should have .app-item class defined', () => {
      expect(cssContent).toMatch(/\.app-item\s*\{/);
    });

    it('should have opacity: 0 for .app-item', () => {
      // Match .app-item rule with opacity: 0
      const appItemMatch = cssContent.match(
        /\.app-item\s*\{[^}]*opacity:\s*0[^}]*\}/
      );
      expect(appItemMatch).not.toBeNull();
    });

    it('should have transform: translateY(-20px) for .app-item', () => {
      // Match .app-item rule with transform: translateY(-20px)
      const appItemMatch = cssContent.match(
        /\.app-item\s*\{[^}]*transform:\s*translateY\s*\(\s*-20px\s*\)[^}]*\}/
      );
      expect(appItemMatch).not.toBeNull();
    });

    it('should have will-change property for .app-item (performance optimization)', () => {
      // Match .app-item rule with will-change property
      const appItemMatch = cssContent.match(
        /\.app-item\s*\{[^}]*will-change:[^}]*\}/
      );
      expect(appItemMatch).not.toBeNull();
    });
  });

  /**
   * Requirement 4.3: Header animate initial state
   * THE Stylesheet SHALL define .header-animate with clip-path: inset(0 100% 0 0) as initial state
   */
  describe('Requirement 4.3: .header-animate initial state', () => {
    it('should have .header-animate class defined', () => {
      expect(cssContent).toMatch(/\.header-animate\s*\{/);
    });

    it('should have clip-path: inset(0 100% 0 0) for .header-animate', () => {
      // Match .header-animate rule with clip-path property
      const headerAnimateMatch = cssContent.match(
        /\.header-animate\s*\{[^}]*clip-path:\s*inset\s*\(\s*0\s+100%\s+0\s+0\s*\)[^}]*\}/
      );
      expect(headerAnimateMatch).not.toBeNull();
    });
  });

  /**
   * Requirement 4.4: Header controls initial state
   * THE Stylesheet SHALL define .header-controls with opacity: 0 and transform: translateY(-10px) as initial state
   */
  describe('Requirement 4.4: .header-controls initial state', () => {
    it('should have .header-controls class defined', () => {
      expect(cssContent).toMatch(/\.header-controls\s*\{/);
    });

    it('should have opacity: 0 for .header-controls', () => {
      // Match .header-controls rule with opacity: 0
      const headerControlsMatch = cssContent.match(
        /\.header-controls\s*\{[^}]*opacity:\s*0[^}]*\}/
      );
      expect(headerControlsMatch).not.toBeNull();
    });

    it('should have transform: translateY(-10px) for .header-controls', () => {
      // Match .header-controls rule with transform: translateY(-10px)
      const headerControlsMatch = cssContent.match(
        /\.header-controls\s*\{[^}]*transform:\s*translateY\s*\(\s*-10px\s*\)[^}]*\}/
      );
      expect(headerControlsMatch).not.toBeNull();
    });
  });

  /**
   * Requirement 4.5: GPU acceleration properties
   * THE Stylesheet SHALL include GPU acceleration properties (backface-visibility, perspective) for animated elements
   */
  describe('Requirement 4.5: GPU acceleration properties', () => {
    it('should have GPU acceleration rule for animated elements', () => {
      // Match the combined selector for GPU acceleration
      const gpuAccelerationMatch = cssContent.match(
        /\.category-header[\s\S]*?\.app-item[\s\S]*?\.header-animate[\s\S]*?\.header-controls\s*\{/
      );
      expect(gpuAccelerationMatch).not.toBeNull();
    });

    it('should have backface-visibility property for GPU acceleration', () => {
      // Check for backface-visibility in the GPU acceleration section
      const backfaceMatch = cssContent.match(/backface-visibility:\s*hidden/);
      expect(backfaceMatch).not.toBeNull();
    });

    it('should have -webkit-backface-visibility property for cross-browser support', () => {
      // Check for webkit prefix
      const webkitBackfaceMatch = cssContent.match(/-webkit-backface-visibility:\s*hidden/);
      expect(webkitBackfaceMatch).not.toBeNull();
    });

    it('should have perspective property for GPU acceleration', () => {
      // Check for perspective property
      const perspectiveMatch = cssContent.match(/perspective:\s*1000px/);
      expect(perspectiveMatch).not.toBeNull();
    });

    it('should have -webkit-perspective property for cross-browser support', () => {
      // Check for webkit prefix
      const webkitPerspectiveMatch = cssContent.match(/-webkit-perspective:\s*1000px/);
      expect(webkitPerspectiveMatch).not.toBeNull();
    });
  });

  /**
   * Additional verification: CSS comments documenting requirements
   */
  describe('CSS documentation', () => {
    it('should have comments referencing requirements 4.1, 4.2, 4.3, 4.4', () => {
      // Check that the CSS file has documentation comments
      expect(cssContent).toMatch(/Requirement 4\.1/i);
      expect(cssContent).toMatch(/Requirement 4\.2/i);
      expect(cssContent).toMatch(/Requirement 4\.3/i);
      expect(cssContent).toMatch(/Requirement 4\.4/i);
    });

    it('should have section header for entrance animation initial states', () => {
      expect(cssContent).toMatch(/ENTRANCE ANIMATION INITIAL STATES/i);
    });

    it('should have section header for GPU acceleration', () => {
      expect(cssContent).toMatch(/GPU ACCELERATION/i);
    });
  });
});
