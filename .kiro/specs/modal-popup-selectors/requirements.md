# Requirements Document

## Introduction

This feature transforms the user interface for selecting apps, operating systems, and package managers from inline scrollable/dropdown patterns to a unified modal popup pattern. The goal is to provide a cleaner, more focused user experience by removing scrollbars from the command footer and presenting selection interfaces in centered modal dialogs with blur backdrops.

## Glossary

- **Modal**: A dialog overlay that appears above the main content with a backdrop, requiring user interaction before returning to the main interface
- **Backdrop**: A semi-transparent overlay behind the modal that dims the main content and can be clicked to dismiss the modal
- **Focus_Trap**: A mechanism that keeps keyboard focus within the modal while it's open
- **Command_Footer**: The fixed footer bar at the bottom of the screen showing the generated install command
- **OS_Selector**: The component for selecting the target operating system
- **Package_Manager_Selector**: The component for selecting the package manager for the chosen OS
- **Terminal_Preview**: A styled code block showing the generated installation script

## Requirements

### Requirement 1: Reusable Modal Component

**User Story:** As a developer, I want a reusable modal component, so that I can consistently implement modal dialogs across the application.

#### Acceptance Criteria

1. THE Modal SHALL render a backdrop overlay with blur effect (backdrop-blur-sm) and semi-transparent background
2. WHEN the backdrop is clicked, THE Modal SHALL close and return focus to the trigger element
3. WHEN the Escape key is pressed, THE Modal SHALL close and return focus to the trigger element
4. THE Modal SHALL center its content panel both horizontally and vertically on the viewport
5. THE Modal SHALL apply smooth animations for opening (fade in, scale up) and closing (fade out, scale down)
6. THE Modal SHALL implement focus trap to keep keyboard navigation within the modal while open
7. THE Modal SHALL set appropriate ARIA attributes (role="dialog", aria-modal="true", aria-labelledby)
8. THE Modal SHALL support custom width and height constraints via props
9. WHEN the Modal opens, THE Modal SHALL prevent body scroll on the underlying page

### Requirement 2: Command Footer Modal Integration

**User Story:** As a user, I want to click on the command preview area to see a full terminal preview in a modal, so that I can review the complete script without scrolling inline.

#### Acceptance Criteria

1. THE Command_Footer SHALL display a summary of selected apps count without horizontal scrollbar
2. WHEN the user clicks on the command preview area, THE Command_Footer SHALL open a Terminal_Preview modal
3. THE Terminal_Preview modal SHALL display the full generated script with syntax highlighting
4. THE Terminal_Preview modal SHALL include Copy and Download buttons with the same functionality as the footer
5. WHEN copy succeeds, THE Terminal_Preview modal SHALL show visual feedback (color change, checkmark icon)
6. THE Terminal_Preview modal SHALL display the package manager name and selected app count in the header
7. THE Terminal_Preview modal SHALL support keyboard shortcuts (y for copy, d for download, Escape to close)

### Requirement 3: OS Selector Modal

**User Story:** As a user, I want to select my operating system from a modal popup, so that I have a clearer view of all available options.

#### Acceptance Criteria

1. WHEN the user clicks the OS selector button, THE OS_Selector SHALL open a modal instead of a dropdown
2. THE OS_Selector modal SHALL display all operating systems in a grid or list layout
3. THE OS_Selector modal SHALL highlight the currently selected OS with a distinct visual style
4. THE OS_Selector modal SHALL display each OS with its icon and name
5. WHEN an OS is selected, THE OS_Selector modal SHALL close and update the selection
6. THE OS_Selector modal SHALL support keyboard navigation (arrow keys, Enter to select, Escape to close)
7. THE OS_Selector modal SHALL show a colored left border accent for each OS option matching its brand color

### Requirement 4: Package Manager Selector Modal

**User Story:** As a user, I want to select my package manager from a modal popup, so that I have a clearer view of all available options for my chosen OS.

#### Acceptance Criteria

1. WHEN the user clicks the package manager selector button, THE Package_Manager_Selector SHALL open a modal instead of a dropdown
2. THE Package_Manager_Selector modal SHALL display package managers filtered by the selected OS
3. THE Package_Manager_Selector modal SHALL highlight the currently selected package manager
4. THE Package_Manager_Selector modal SHALL display a "Default" badge for primary package managers
5. WHEN a package manager is selected, THE Package_Manager_Selector modal SHALL close and update the selection
6. THE Package_Manager_Selector modal SHALL support keyboard navigation (arrow keys, Enter to select, Home, End, Escape)
7. THE Package_Manager_Selector modal SHALL show a colored left border accent for each option matching its brand color
8. THE Package_Manager_Selector modal SHALL display each package manager with its icon and name

### Requirement 5: Animation and Visual Consistency

**User Story:** As a user, I want consistent animations and visual styling across all modal popups, so that the interface feels polished and cohesive.

#### Acceptance Criteria

1. THE Modal backdrop SHALL use consistent blur (backdrop-blur-sm) and opacity (bg-black/30) across all modal types
2. THE Modal content panel SHALL animate with consistent timing (0.3s ease-out for open, 0.2s ease-in for close)
3. THE Modal content panel SHALL use consistent border radius (rounded-lg) and shadow (shadow-2xl)
4. WHEN hovering over selectable items in modals, THE system SHALL show consistent hover states
5. THE Modal SHALL use Framer Motion for animations to ensure smooth performance
