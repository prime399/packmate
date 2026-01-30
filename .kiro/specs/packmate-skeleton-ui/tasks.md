# Implementation Plan: Packmate Skeleton UI

## Overview

This implementation plan breaks down the Packmate skeleton UI into discrete coding tasks. Each task builds incrementally on previous work, ensuring the application is functional at each step. The implementation follows TuxMate's patterns while adapting for cross-platform use.

## Tasks

- [x] 1. Set up project foundation and styling
  - [x] 1.1 Update globals.css with theme variables and animations
    - Add CSS custom properties for dark/light themes matching TuxMate
    - Add animation keyframes for entrance animations, tooltips, dropdowns
    - Add theme toggle switch styles
    - Add scrollbar and selection styles
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_
  
  - [x] 1.2 Update layout.tsx with fonts and theme setup
    - Import Outfit and Inter fonts from Google Fonts
    - Add theme flash prevention script
    - Set up metadata for Packmate
    - _Requirements: 7.5_

- [x] 2. Create data layer and types
  - [x] 2.1 Create lib/data.ts with types and sample data
    - Define OSId, Category, OS, and AppData types
    - Create operatingSystems array with MacOS, Linux, Windows
    - Create categories array with all 15 categories
    - Create sample apps array with 50+ apps across all categories
    - Add helper functions: getAppsByCategory, getCategoryColor
    - _Requirements: 4.2, 8.1, 8.2, 8.3_
  
  - [x] 2.2 Write property test for app data completeness
    - **Property 7: App Data Completeness**
    - **Validates: Requirements 8.2, 8.3**

- [x] 3. Implement theme system
  - [x] 3.1 Create hooks/useTheme.tsx
    - Create ThemeProvider context
    - Implement theme toggle logic with localStorage persistence
    - Handle system preference detection
    - Implement hydration-safe theme initialization
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.2 Create components/ui/ThemeToggle.tsx
    - Implement sun/moon toggle switch matching TuxMate style
    - Connect to useTheme hook
    - _Requirements: 1.6, 3.1_
  
  - [x] 3.3 Write property test for theme toggle round-trip
    - **Property 2: Theme Toggle Round-Trip**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 4. Checkpoint - Verify theme system works
  - Ensure theme toggle switches between dark and light modes
  - Ensure theme persists across page reloads
  - Ask the user if questions arise

- [x] 5. Implement main state hook
  - [x] 5.1 Create hooks/usePackmateInit.ts
    - Implement OS selection state with localStorage persistence
    - Implement app selection state with localStorage persistence
    - Implement isAppAvailable function based on selected OS
    - Implement clearAll function
    - Implement selectedCount computed value
    - Handle hydration with isHydrated flag
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 5.2 Write property tests for state management
    - **Property 1: OS Selection Round-Trip**
    - **Property 3: App Selection Round-Trip**
    - **Property 10: Clear All Selections**
    - **Validates: Requirements 2.4, 2.5, 9.1, 9.2, 9.3**

- [x] 6. Implement OS selector component
  - [x] 6.1 Create components/os/OSIcon.tsx
    - Implement icon component with fallback handling
    - _Requirements: 2.1_
  
  - [x] 6.2 Create components/os/OSSelector.tsx
    - Implement dropdown with portal rendering
    - Display current OS with icon
    - Show MacOS, Linux, Windows options
    - Handle selection and close on click outside
    - Style with colored left border accent
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 6.3 Create components/os/index.ts barrel export
    - Export OSIcon and OSSelector
    - _Requirements: N/A (code organization)_

- [x] 7. Implement header components
  - [x] 7.1 Create components/header/HowItWorks.tsx
    - Implement help link/popup component
    - _Requirements: 1.3_
  
  - [x] 7.2 Create components/header/GitHubLink.tsx
    - Implement GitHub icon link
    - _Requirements: 1.4_
  
  - [x] 7.3 Create components/header/ContributeLink.tsx
    - Implement contribute link
    - _Requirements: 1.5_
  
  - [x] 7.4 Create components/header/index.ts barrel export
    - Export all header components
    - _Requirements: N/A (code organization)_

- [x] 8. Checkpoint - Verify header and OS selector work
  - Ensure header displays all required elements
  - Ensure OS selector opens and allows selection
  - Ensure OS selection persists
  - Ask the user if questions arise

- [x] 9. Implement common components
  - [x] 9.1 Create hooks/useTooltip.ts
    - Implement tooltip positioning logic
    - Handle show/hide with mouse events
    - _Requirements: 6.4_
  
  - [x] 9.2 Create components/common/Tooltip.tsx
    - Implement tooltip component with portal rendering
    - Style with theme colors and animation
    - _Requirements: 6.4_
  
  - [x] 9.3 Create components/common/LoadingSkeleton.tsx
    - Implement loading skeleton for hydration state
    - _Requirements: 9.5_
  
  - [x] 9.4 Create components/common/index.ts barrel export
    - Export Tooltip and LoadingSkeleton
    - _Requirements: N/A (code organization)_

- [x] 10. Implement app display components
  - [x] 10.1 Create components/app/AppIcon.tsx
    - Implement app icon with fallback
    - Handle loading states
    - _Requirements: 6.1_
  
  - [x] 10.2 Create components/app/CategoryHeader.tsx
    - Implement category header with icon, name, chevron
    - Display selection count badge
    - Handle expand/collapse click
    - Apply category color styling
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 10.3 Create components/app/AppItem.tsx
    - Implement app row with checkbox, icon, name
    - Handle selection toggle on click
    - Apply category color to checkbox when selected
    - Show dimmed state for unavailable apps
    - Integrate tooltip on hover
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_
  
  - [x] 10.4 Create components/app/CategorySection.tsx
    - Implement collapsible category section
    - Render CategoryHeader and AppItem list
    - Handle expand/collapse animation
    - Apply entrance animations
    - _Requirements: 5.3, 5.5, 5.6_
  
  - [x] 10.5 Create components/app/index.ts barrel export
    - Export all app components
    - _Requirements: N/A (code organization)_
  
  - [x] 10.6 Write property tests for app components
    - **Property 4: Category Section Toggle**
    - **Property 5: App Item Selection Toggle**
    - **Property 6: Category Selection Count Accuracy**
    - **Property 9: App Availability Filtering**
    - **Validates: Requirements 5.3, 5.4, 6.2, 6.6**

- [x] 11. Implement masonry packing algorithm
  - [x] 11.1 Create lib/utils.ts with packing function
    - Implement packCategories function for masonry layout
    - Distribute categories to minimize column height difference
    - _Requirements: 4.5_
  
  - [x] 11.2 Write property test for masonry packing
    - **Property 8: Masonry Packing Balance**
    - **Validates: Requirements 4.5**

- [x] 12. Checkpoint - Verify components render correctly
  - Ensure category sections expand/collapse
  - Ensure app items can be selected
  - Ensure tooltips appear on hover
  - Ask the user if questions arise

- [x] 13. Implement main page
  - [x] 13.1 Update app/page.tsx with full layout
    - Import and use all components
    - Implement multi-column grid layout
    - Use masonry packing for category distribution
    - Handle responsive layout (5 columns desktop, 2 mobile)
    - Wire up all state and event handlers
    - _Requirements: 1.1, 1.2, 1.7, 1.8, 4.1, 4.3, 4.4_

- [x] 14. Final checkpoint - Full integration test
  - Ensure all components work together
  - Ensure theme toggle works
  - Ensure OS selector works and filters app availability
  - Ensure app selection persists
  - Ensure responsive layout works
  - Ask the user if questions arise

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows TuxMate's patterns for consistency
