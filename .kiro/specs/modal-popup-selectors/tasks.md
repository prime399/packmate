# Implementation Plan: Modal Popup Selectors

## Overview

This implementation transforms the packmate application's selection interfaces from inline dropdowns to modal popups. The work is organized to build the reusable Modal component first, then integrate it into each selector component incrementally.

## Tasks

- [x] 1. Create reusable Modal component and focus trap hook
  - [x] 1.1 Create useFocusTrap hook in `packmate/src/hooks/useFocusTrap.ts`
    - Implement focus cycling through focusable elements
    - Handle Tab and Shift+Tab key events
    - Return focus to trigger element on unmount
    - _Requirements: 1.6_
  
  - [x] 1.2 Create Modal component in `packmate/src/components/common/Modal.tsx`
    - Implement React Portal rendering to document.body
    - Add backdrop with blur effect (backdrop-blur-sm, bg-black/30)
    - Center content panel with Framer Motion animations
    - Handle backdrop click and Escape key to close
    - Implement body scroll lock when open
    - Set ARIA attributes (role="dialog", aria-modal="true", aria-labelledby)
    - Support maxWidth prop for size variants
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 5.1, 5.3, 5.5_
  
  - [x] 1.3 Write property test for Modal dismiss behavior
    - **Property 1: Modal Dismiss Behavior**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 1.4 Write property test for focus trap cycling
    - **Property 2: Focus Trap Cycling**
    - **Validates: Requirements 1.6**

- [x] 2. Checkpoint - Verify Modal component works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create Terminal Preview Modal and update CommandFooter
  - [x] 3.1 Create TerminalPreviewModal component in `packmate/src/components/command/TerminalPreviewModal.tsx`
    - Reuse syntax highlighting from CommandDrawer
    - Display full script with package manager branding
    - Include Copy and Download buttons with feedback states
    - Support keyboard shortcuts (y=copy, d=download, Escape=close)
    - Show package manager name and app count in header
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 3.2 Update CommandFooter to use TerminalPreviewModal
    - Replace scrollable command area with clickable summary
    - Remove horizontal scrollbar from command display
    - Open TerminalPreviewModal on click instead of CommandDrawer
    - Keep existing keyboard shortcut (Tab) for preview toggle
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.3 Write property test for Terminal Preview content
    - **Property 4: Terminal Preview Content Correctness**
    - **Validates: Requirements 2.3, 2.6**
  
  - [x] 3.4 Write property test for Terminal Preview keyboard shortcuts
    - **Property 5: Terminal Preview Keyboard Shortcuts**
    - **Validates: Requirements 2.7**

- [x] 4. Checkpoint - Verify Terminal Preview Modal works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create OS Selector Modal and update OSSelector
  - [x] 5.1 Create OSSelectorModal component in `packmate/src/components/os/OSSelectorModal.tsx`
    - Display all operating systems in grid layout
    - Show icon, name, and colored left border for each OS
    - Highlight currently selected OS with distinct background
    - Implement keyboard navigation (arrows, Enter, Escape)
    - Auto-focus current selection when opened
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 3.7_
  
  - [x] 5.2 Update OSSelector to use OSSelectorModal
    - Replace portal dropdown with modal trigger
    - Keep button styling with colored left border
    - Open modal on click instead of dropdown
    - _Requirements: 3.1, 3.5_
  
  - [x] 5.3 Write property test for OS Selector rendering
    - **Property 6: OS Selector Renders All Options**
    - **Validates: Requirements 3.2, 3.4, 3.7**
  
  - [x] 5.4 Write property test for OS Selector selection highlight
    - **Property 7: OS Selector Highlights Current Selection**
    - **Validates: Requirements 3.3**
  
  - [x] 5.5 Write property test for OS Selector keyboard navigation
    - **Property 8: OS Selector Keyboard Navigation**
    - **Validates: Requirements 3.6**

- [x] 6. Checkpoint - Verify OS Selector Modal works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create Package Manager Selector Modal and update PackageManagerSelector
  - [x] 7.1 Create PackageManagerSelectorModal component in `packmate/src/components/packageManager/PackageManagerSelectorModal.tsx`
    - Display package managers filtered by selected OS
    - Show icon, name, colored border, and "Default" badge for each
    - Highlight current selection with checkmark indicator
    - Implement full keyboard navigation (arrows, Home, End, Enter, Escape)
    - Auto-focus current selection when opened
    - _Requirements: 4.2, 4.3, 4.4, 4.6, 4.7, 4.8_
  
  - [x] 7.2 Update PackageManagerSelector to use PackageManagerSelectorModal
    - Replace portal dropdown with modal trigger
    - Keep button styling with colored left border
    - Open modal on click instead of dropdown
    - _Requirements: 4.1, 4.5_
  
  - [x] 7.3 Write property test for Package Manager filtering
    - **Property 9: Package Manager Filtering by OS**
    - **Validates: Requirements 4.2**
  
  - [x] 7.4 Write property test for Package Manager option rendering
    - **Property 10: Package Manager Options Render Correctly**
    - **Validates: Requirements 4.4, 4.7, 4.8**
  
  - [x] 7.5 Write property test for Package Manager selection highlight
    - **Property 11: Package Manager Highlights Current Selection**
    - **Validates: Requirements 4.3**
  
  - [x] 7.6 Write property test for Package Manager keyboard navigation
    - **Property 12: Package Manager Keyboard Navigation**
    - **Validates: Requirements 4.6**

- [x] 8. Cleanup and final integration
  - [x] 8.1 Remove CommandDrawer component (replaced by TerminalPreviewModal)
    - Delete `packmate/src/components/command/CommandDrawer.tsx`
    - Update barrel export in `packmate/src/components/command/index.ts`
    - _Requirements: 2.2_
  
  - [x] 8.2 Update component barrel exports
    - Add Modal to `packmate/src/components/common/index.ts`
    - Add OSSelectorModal to `packmate/src/components/os/index.ts`
    - Add PackageManagerSelectorModal to `packmate/src/components/packageManager/index.ts`
    - Add TerminalPreviewModal to `packmate/src/components/command/index.ts`
    - _Requirements: All_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with strict mode as per project configuration
