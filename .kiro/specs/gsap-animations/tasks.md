# Implementation Plan: GSAP Animations for Packmate

## Overview

This implementation plan adds GSAP animations to Packmate, replicating the animation patterns from TuxMate. The work is organized into logical phases: dependency setup, CSS initial states, header animations, category animations, and testing.

## Tasks

- [ ] 1. Verify GSAP dependency and CSS initial states
  - [x] 1.1 Verify GSAP is installed in package.json
    - Check that gsap is listed in dependencies
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Add CSS initial states for GSAP animations to globals.css
    - Add .category-header with clip-path: inset(0 100% 0 0)
    - Add .app-item with opacity: 0 and transform: translateY(-20px)
    - Add .header-animate with clip-path: inset(0 100% 0 0)
    - Add .header-controls with opacity: 0 and transform: translateY(-10px)
    - Add GPU acceleration properties (backface-visibility, perspective)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.2_

- [ ] 2. Implement header entrance animations
  - [x] 2.1 Add GSAP import and header animation to page.tsx
    - Import gsap from 'gsap'
    - Add headerRef to reference the header element
    - Add useLayoutEffect hook for header animations
    - Implement clip-path reveal for .header-animate element
    - Implement fade-in with translateY for .header-controls element
    - Gate animations behind isHydrated check
    - Clear clip-path on animation complete
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.2 Add header-animate and header-controls CSS classes to JSX
    - Add header-animate class to logo/title container
    - Add header-controls class to controls container
    - Add ref={headerRef} to header element
    - _Requirements: 2.1, 2.2_

- [ ] 3. Implement category section animations
  - [x] 3.1 Add GSAP import and animation refs to CategorySection.tsx
    - Import gsap from 'gsap'
    - Add sectionRef for DOM access
    - Add hasAnimated ref to track animation state
    - Add prevAppCount ref to track filter changes
    - _Requirements: 3.5, 5.2_
  
  - [x] 3.2 Implement initial entrance animation with useLayoutEffect
    - Set initial state with gsap.set (clip-path, y, opacity, force3D)
    - Use requestAnimationFrame for smooth setup
    - Calculate staggered delay based on categoryIndex
    - Animate category header with clip-path reveal
    - Animate app items with translateY and opacity
    - Use power2.out easing for natural motion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.3_
  
  - [x] 3.3 Implement app count change handler with useEffect
    - Compare current app count with prevAppCount ref
    - Reset item visibility with gsap.set when count changes
    - Update prevAppCount ref after handling
    - _Requirements: 5.1, 5.3_
  
  - [x] 3.4 Add category-header class to CategoryHeader component
    - Ensure CategoryHeader renders with category-header class
    - _Requirements: 3.1_
  
  - [x] 3.5 Add app-item class to AppItem component
    - Ensure AppItem renders with app-item class
    - _Requirements: 3.2_

- [x] 4. Checkpoint - Verify animations work
  - Ensure all animations run correctly on page load
  - Verify animations only run after hydration
  - Test package manager filter changes reset visibility
  - Ask the user if questions arise

- [ ] 5. Add property-based tests for animation logic
  - [x] 5.1 Write property test for stagger delay calculation
    - **Property 2: Staggered Delay Calculation**
    - Test that delay = categoryIndex * 0.05 for all valid indices
    - Use fast-check to generate random category indices
    - **Validates: Requirements 3.3**
  
  - [x] 5.2 Write property test for animation idempotence
    - **Property 3: Animation Idempotence**
    - Test that hasAnimated ref prevents re-animation
    - Simulate multiple effect triggers
    - **Validates: Requirements 3.5**
  
  - [x] 5.3 Write unit tests for CSS initial states
    - Verify globals.css contains required initial state rules
    - Test for .category-header, .app-item, .header-animate, .header-controls
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Run npm test to verify all tests pass
  - Ensure no TypeScript errors
  - Ask the user if questions arise

## Notes

- GSAP is already installed in package.json (version ^3.14.2)
- The existing CategorySection already has categoryIndex prop passed from page.tsx
- CSS classes may already exist in globals.css - verify and update as needed
- Property tests use fast-check which is already in devDependencies
