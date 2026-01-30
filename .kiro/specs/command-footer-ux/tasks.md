# Implementation Plan: Command Footer UX Improvements

## Overview

This plan implements vim-style keyboard navigation, an enhanced shortcuts bar, a rich tooltip system, and a command preview drawer for Packmate's command footer. The implementation follows TuxMate's proven patterns while adapting them for Packmate's cross-platform context.

## Tasks

- [x] 1. Create useKeyboardNavigation hook
  - [x] 1.1 Create `packmate/src/hooks/useKeyboardNavigation.ts` with NavItem and FocusPosition interfaces
    - Implement focus position state management (col, row)
    - Handle arrow keys (↑↓←→) and vim keys (hjkl) for navigation
    - Implement Space key to toggle focused item selection
    - Implement Escape key to clear focus
    - Track keyboard vs mouse navigation with `fromKeyboard` ref
    - Implement `isKeyboardNavigating` state for focus ring visibility
    - Implement `setFocusByItem` for mouse selection (no scroll)
    - Add scrollIntoView behavior for keyboard navigation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 Write property tests for navigation movement bounds
    - **Property 1: Navigation Movement Bounds**
    - **Validates: Requirements 1.1**

  - [x] 1.3 Write property tests for Space toggle and Escape clear
    - **Property 2: Space Toggles Selection State**
    - **Property 3: Escape Clears Focus**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 1.4 Write property tests for keyboard navigation flag
    - **Property 4: Keyboard Navigation Flag**
    - **Validates: Requirements 1.5, 1.6**

- [x] 2. Enhance useTooltip hook
  - [x] 2.1 Update `packmate/src/hooks/useTooltip.ts` with follow-cursor positioning
    - Change TooltipState to include content, x (mouse X), y (element top)
    - Implement 450ms delay before showing
    - Track isOverTrigger and isOverTooltip refs for hover persistence
    - Implement tooltipMouseEnter/tooltipMouseLeave callbacks
    - Add setTooltipRef callback for tooltip element reference
    - Add dismiss on click, scroll, and Escape key
    - _Requirements: 5.1, 5.7, 5.8_

  - [x] 2.2 Write property tests for tooltip behavior
    - **Property 11: Tooltip Follows Cursor X Position**
    - **Property 14: Tooltip Hover Persistence**
    - **Property 15: Tooltip Dismiss Events**
    - **Validates: Requirements 5.1, 5.7, 5.8**

- [x] 3. Checkpoint - Ensure hooks are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create enhanced Tooltip component
  - [x] 4.1 Update `packmate/src/components/common/Tooltip.tsx` with rich features
    - Implement follow-cursor positioning (use mouse X, element top Y)
    - Add markdown-ish formatting: **bold**, `code`, [links](url)
    - Implement right-anchor adjustment when near viewport edge (x + 300 > viewport)
    - Add arrow indicator pointing to cursor
    - Set fixed 300px width with word wrapping
    - Add fade in/out transitions
    - Hide on mobile (hidden md:block)
    - Accept onMouseEnter, onMouseLeave, setRef props
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9_

  - [x] 4.2 Write property tests for markdown parsing
    - **Property 12: Tooltip Markdown Parsing**
    - **Validates: Requirements 5.2**

  - [x] 4.3 Write property tests for edge adjustment
    - **Property 13: Tooltip Edge Adjustment**
    - **Validates: Requirements 5.3**

- [x] 5. Create ShortcutsBar component
  - [x] 5.1 Create `packmate/src/components/command/ShortcutsBar.tsx`
    - Display package manager name as colored badge (left side)
    - Add search input with "/" prefix and clear button
    - Display selected app count when > 0
    - Show keyboard shortcut hints (hjkl, /, Space, Tab, ?)
    - Add branded "PACK" end badge
    - Handle Escape/Enter to blur search input
    - Hide shortcuts section on mobile
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.2 Write property tests for ShortcutsBar
    - **Property 5: Package Manager Badge Rendering**
    - **Property 6: App Count Display**
    - **Property 7: Search Input Callback**
    - **Validates: Requirements 2.1, 2.3, 2.6**

- [x] 6. Create CommandDrawer component
  - [x] 6.1 Create `packmate/src/components/command/CommandDrawer.tsx`
    - Implement slide-up animation from bottom
    - Display full generated script in scrollable code block
    - Add copy and download buttons within drawer
    - Add close button (X icon)
    - Display selected app count and package manager info
    - Handle isClosing state for exit animation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Write property tests for CommandDrawer
    - **Property 9: Drawer Shows Script When Open**
    - **Property 10: Drawer Shows Count and Package Manager**
    - **Validates: Requirements 4.1, 4.4**

- [x] 7. Checkpoint - Ensure new components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance CommandFooter component
  - [x] 8.1 Update `packmate/src/components/command/CommandFooter.tsx` with new features
    - Change width to 85% (from 90% max-w-4xl)
    - Add ShortcutsBar above command bar
    - Add Preview button that opens CommandDrawer
    - Add Clear all button
    - Add colored left border accent (package manager color)
    - Add soft glow effect behind bars
    - Integrate CommandDrawer with open/close state
    - Add props for searchQuery, onSearchChange, searchInputRef, clearAll
    - _Requirements: 3.1, 3.2, 3.3, 3.9, 3.10_

  - [x] 8.2 Add global keyboard shortcuts to CommandFooter
    - Implement 'y' key for copy
    - Implement 'd' key for download
    - Implement 't' key for theme toggle with flash effect
    - Implement 'c' key for clear all
    - Implement Tab key for drawer toggle
    - Skip shortcuts when in input field or with modifier keys
    - Disable copy/download when selectedCount === 0
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 6.3, 6.4, 6.5_

  - [x] 8.3 Write property tests for keyboard shortcuts
    - **Property 8: Keyboard Shortcuts Trigger Actions**
    - **Property 16: Input and Modifier Shortcut Bypass**
    - **Property 17: Disabled Shortcuts When No Selection**
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.8, 6.3, 6.4, 6.5**

- [x] 9. Update barrel exports
  - [x] 9.1 Update `packmate/src/components/command/index.ts` to export new components
    - Export ShortcutsBar
    - Export CommandDrawer (if not already exported)
    - _Requirements: N/A (infrastructure)_

  - [x] 9.2 Update `packmate/src/hooks/index.ts` to export useKeyboardNavigation
    - Export useKeyboardNavigation hook
    - _Requirements: N/A (infrastructure)_

- [x] 10. Integrate into main page
  - [x] 10.1 Update `packmate/src/app/page.tsx` to use new features
    - Import and use useKeyboardNavigation hook
    - Build navItems grid from categories and apps
    - Pass keyboard navigation props to CategorySection/AppItem
    - Add searchQuery state and searchInputRef
    - Update Tooltip component usage with new props
    - Pass new props to CommandFooter (searchQuery, onSearchChange, searchInputRef, clearAll)
    - Add data-nav-id attributes to navigable items
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2_

  - [x] 10.2 Update AppItem component for keyboard focus
    - Add data-nav-id attribute for scroll targeting
    - Add focus ring styling when isKeyboardNavigating and item is focused
    - Update tooltip trigger to use new show/hide API
    - _Requirements: 1.4, 1.5_

- [x] 11. Add CSS animations
  - [x] 11.1 Update `packmate/src/app/globals.css` with required animations
    - Add footerSlideUp keyframe animation
    - Add drawer slide-up animation
    - Add theme-flash class for theme toggle feedback
    - Add tooltip fade transition styles
    - _Requirements: 3.6, 4.5, 5.6_

- [x] 12. Final checkpoint - Full integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify keyboard navigation works across the app grid
  - Verify tooltips follow cursor and support markdown
  - Verify command footer shortcuts work correctly
  - Verify drawer opens/closes with animation

## Notes

- All tasks including property tests are required
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Implementation uses fast-check for property-based testing
- All components follow TuxMate patterns adapted for Packmate's context
