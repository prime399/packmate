# Implementation Plan: Package Manager Integration

## Overview

This plan implements multi-platform package manager integration for Packmate, following the established patterns from TuxMate. Tasks are organized to build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Update data model and types
  - [x] 1.1 Add PackageManagerId type and PackageManager interface to `lib/data.ts`
    - Define `PackageManagerId` union type with all 11 package managers
    - Define `PackageManager` interface with id, name, iconUrl, color, installPrefix, osId, isPrimary
    - Export `packageManagers` array with all package manager configurations
    - Add helper function `getPackageManagersByOS(osId: OSId): PackageManager[]`
    - Add helper function `getPackageManagerById(id: PackageManagerId): PackageManager | undefined`
    - Add helper function `getPrimaryPackageManager(osId: OSId): PackageManager`
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 1.2 Write property test for package manager filtering
    - **Property 1: Package manager filtering by OS**
    - **Validates: Requirements 2.1, 2.2, 8.5**

  - [x] 1.3 Update AppData interface to use targets instead of availability
    - Replace `availability: { macos: boolean; linux: boolean; windows: boolean }` with `targets: Partial<Record<PackageManagerId, string>>`
    - Add optional `unavailableReason?: string` field
    - Update type exports
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 1.4 Add new localStorage keys for package manager persistence
    - Add `PACKAGE_MANAGER_WINDOWS`, `PACKAGE_MANAGER_MACOS`, `PACKAGE_MANAGER_LINUX` to `STORAGE_KEYS`
    - _Requirements: 2.3_

- [x] 2. Migrate app data to targets model
  - [x] 2.1 Update all app entries with package manager targets
    - Convert each app's boolean availability to specific package manager targets
    - Add appropriate package names for each package manager (winget IDs, brew formulae/casks, apt packages, etc.)
    - Add `unavailableReason` for apps not in official repos
    - Preserve all existing metadata (id, name, description, category, iconUrl)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 2.2 Write property test for data model integrity
    - **Property 5: Data model integrity**
    - **Validates: Requirements 1.2, 1.3, 1.5, 7.4**

- [x] 3. Checkpoint - Verify data model
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update state management hook
  - [x] 4.1 Add package manager state to usePackmateInit
    - Add `selectedPackageManager` state initialized from localStorage or OS default
    - Add `setSelectedPackageManager` function that persists to localStorage per OS
    - Add `getAvailablePackageManagers` function using `getPackageManagersByOS`
    - Update `isAppAvailable` to check `targets[selectedPackageManager]` instead of `availability[selectedOS]`
    - Handle OS change: restore persisted PM or fall back to primary
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 4.2 Write property tests for state management
    - **Property 2: Package manager persistence round-trip**
    - **Property 3: OS change restores package manager**
    - **Property 4: App availability based on targets**
    - **Validates: Requirements 2.3, 2.4, 3.1, 8.2, 8.3, 8.4**

  - [x] 4.3 Update toggleApp to prevent selecting unavailable apps
    - Check `isAppAvailable` before adding to selection
    - Skip toggle if app is unavailable for current package manager
    - _Requirements: 3.5_

  - [x] 4.4 Write property test for unavailable app selection prevention
    - **Property 11: Unavailable apps cannot be selected**
    - **Validates: Requirements 3.5**

- [x] 5. Checkpoint - Verify state management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create script generation system
  - [x] 6.1 Create shared script utilities in `lib/scripts/shared.ts`
    - Implement `escapeShellString` function for shell character escaping
    - Implement `getSelectedPackages` function to filter apps by package manager
    - Implement `generateAsciiHeader` function with metadata
    - Implement `generateSharedUtils` function with colors, progress, retry logic
    - _Requirements: 4.5, 5.2, 5.3, 5.5, 5.6, 5.7_

  - [x] 6.2 Write property test for shell escaping
    - **Property 8: Shell character escaping**
    - **Validates: Requirements 4.5**

  - [x] 6.3 Create Windows script generators
    - Create `lib/scripts/winget.ts` with Winget script generation
    - Create `lib/scripts/chocolatey.ts` with Chocolatey script generation
    - Create `lib/scripts/scoop.ts` with Scoop script generation
    - Each script checks if PM is installed, handles errors, shows progress
    - _Requirements: 5.1, 5.4, 5.8_

  - [x] 6.4 Create macOS script generators
    - Create `lib/scripts/homebrew.ts` with Homebrew script generation (handle --cask)
    - Create `lib/scripts/macports.ts` with MacPorts script generation
    - _Requirements: 4.3, 5.1_

  - [x] 6.5 Write property test for Homebrew cask grouping
    - **Property 7: Homebrew cask grouping**
    - **Validates: Requirements 4.3**

  - [x] 6.6 Create Linux script generators
    - Create `lib/scripts/apt.ts` for Debian/Ubuntu
    - Create `lib/scripts/dnf.ts` for Fedora
    - Create `lib/scripts/pacman.ts` for Arch
    - Create `lib/scripts/zypper.ts` for openSUSE
    - Create `lib/scripts/flatpak.ts` for Flatpak
    - Create `lib/scripts/snap.ts` for Snap (handle --classic)
    - _Requirements: 4.4, 5.1_

  - [x] 6.7 Create main script generation entry point
    - Create `lib/generateInstallScript.ts` with `generateInstallScript` and `generateSimpleCommand` functions
    - Route to correct generator based on package manager ID
    - Handle empty selection case
    - Create `lib/scripts/index.ts` barrel export
    - _Requirements: 4.1, 4.2, 5.1_

  - [x] 6.8 Write property tests for script generation
    - **Property 6: Command generation filters by availability**
    - **Property 9: Script header contains metadata**
    - **Validates: Requirements 4.2, 5.2**

- [x] 7. Checkpoint - Verify script generation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create Package Manager Selector component
  - [x] 8.1 Create PackageManagerSelector component
    - Create `components/packageManager/PackageManagerSelector.tsx`
    - Implement dropdown with portal rendering (similar to OSSelector)
    - Filter package managers by selected OS
    - Show icon, name, and selection indicator
    - Handle keyboard navigation and click outside
    - _Requirements: 2.2, 2.5_

  - [x] 8.2 Create PackageManagerIcon component
    - Create `components/packageManager/PackageManagerIcon.tsx`
    - Handle icon loading with fallback
    - _Requirements: 2.5_

  - [x] 8.3 Create barrel export for packageManager components
    - Create `components/packageManager/index.ts`

- [x] 9. Update app display components
  - [x] 9.1 Update AppItem component for package manager availability
    - Update availability check to use `isAppAvailable` from hook
    - Apply disabled styling (reduced opacity) for unavailable apps
    - Show unavailableReason tooltip/popover on hover/click for unavailable apps
    - Prevent checkbox interaction for unavailable apps
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 9.2 Update CategorySection component with availability count
    - Calculate available app count based on selected package manager
    - Display count badge showing "X of Y available"
    - _Requirements: 3.4_

  - [x] 9.3 Write property test for category count
    - **Property 10: Category count matches available apps**
    - **Validates: Requirements 3.4**

- [x] 10. Create Command Footer component
  - [x] 10.1 Create CommandFooter component
    - Create `components/command/CommandFooter.tsx`
    - Display generated one-liner command in code block
    - Implement copy to clipboard with visual feedback
    - Implement download script button
    - Show/hide based on selection count
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

  - [x] 10.2 Write property test for footer visibility
    - **Property 12: Footer visibility based on selection**
    - **Validates: Requirements 6.1, 6.7**

  - [x] 10.3 Create CommandDrawer component for script preview
    - Create `components/command/CommandDrawer.tsx`
    - Expandable panel showing full script preview
    - Syntax highlighting for shell script
    - _Requirements: 6.6_

  - [x] 10.4 Create barrel export for command components
    - Create `components/command/index.ts`

- [x] 11. Integrate components into main page
  - [x] 11.1 Update page.tsx to use new components
    - Add PackageManagerSelector next to OSSelector
    - Add CommandFooter at bottom of page
    - Wire up state from usePackmateInit
    - _Requirements: 2.2, 6.1_

  - [x] 11.2 Update layout and styling
    - Ensure footer doesn't overlap content
    - Add padding at bottom for footer space
    - Responsive layout adjustments

- [x] 12. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Verify full flow: OS selection → PM selection → app selection → command generation

## Notes

- All tasks are required including property tests for comprehensive coverage
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Script generators follow TuxMate patterns for consistency
