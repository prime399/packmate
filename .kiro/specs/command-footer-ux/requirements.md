# Requirements Document

## Introduction

This feature enhances Packmate's command footer section with improved UX features including vim-style keyboard navigation, an enhanced shortcuts bar, a richer tooltip system, and a command preview drawer. The goal is to match or exceed TuxMate's implementation while adapting it for Packmate's cross-platform package manager context.

## Glossary

- **Command_Footer**: The fixed footer component that displays the generated install command and action buttons
- **Shortcuts_Bar**: A neovim-style statusline showing search, app count, keyboard shortcuts, and package manager badge
- **Keyboard_Navigation**: Vim-style navigation system using arrow keys and hjkl for moving between app items
- **Tooltip**: A follow-cursor popup that displays app descriptions with markdown-ish formatting support
- **Command_Drawer**: An expandable preview panel showing the full generated script
- **Focus_Position**: The current navigation position in the app grid (column, row)
- **Package_Manager**: The selected package manager (winget, homebrew, apt, etc.)

## Requirements

### Requirement 1: Vim-Style Keyboard Navigation

**User Story:** As a power user, I want to navigate the app list using vim-style keyboard shortcuts, so that I can efficiently browse and select apps without using a mouse.

#### Acceptance Criteria

1. WHEN a user presses arrow keys (↑↓←→) or vim keys (hjkl), THE Keyboard_Navigation SHALL move focus between app items in the grid
2. WHEN a user presses Space on a focused item, THE Keyboard_Navigation SHALL toggle the app selection state
3. WHEN a user presses Escape, THE Keyboard_Navigation SHALL clear the current focus
4. WHEN focus moves via keyboard, THE Keyboard_Navigation SHALL scroll the focused item into view
5. WHEN an item is focused via keyboard, THE Keyboard_Navigation SHALL display a visible focus ring indicator
6. WHEN a user clicks an item with mouse, THE Keyboard_Navigation SHALL update focus position without scrolling

### Requirement 2: Shortcuts Bar Component

**User Story:** As a user, I want to see available keyboard shortcuts and search functionality in a compact bar, so that I can quickly learn and use the interface.

#### Acceptance Criteria

1. THE Shortcuts_Bar SHALL display the current package manager name as a colored badge
2. THE Shortcuts_Bar SHALL provide a search input with "/" prefix (vim-style)
3. WHEN apps are selected, THE Shortcuts_Bar SHALL display the selected app count
4. THE Shortcuts_Bar SHALL display keyboard shortcut hints (hjkl navigation, / search, Space toggle, Tab preview, ? help)
5. THE Shortcuts_Bar SHALL display a branded "PACK" end badge
6. WHEN the search input receives focus, THE Shortcuts_Bar SHALL allow typing to filter apps
7. WHEN Escape or Enter is pressed in search, THE Shortcuts_Bar SHALL blur the search input

### Requirement 3: Enhanced Command Footer

**User Story:** As a user, I want a wider, more functional command footer with keyboard shortcuts and visual feedback, so that I can efficiently copy and download install scripts.

#### Acceptance Criteria

1. THE Command_Footer SHALL use 85% width (increased from 90% max-w-4xl)
2. THE Command_Footer SHALL display a preview button that opens the Command_Drawer
3. THE Command_Footer SHALL display a clear all button
4. WHEN user presses 'y' key, THE Command_Footer SHALL copy the command to clipboard
5. WHEN user presses 'd' key, THE Command_Footer SHALL download the install script
6. WHEN user presses 't' key, THE Command_Footer SHALL toggle the theme with visual flash feedback
7. WHEN user presses 'c' key, THE Command_Footer SHALL clear all selected apps
8. WHEN user presses Tab key, THE Command_Footer SHALL toggle the preview drawer
9. THE Command_Footer SHALL display a colored left border accent matching the package manager color
10. THE Command_Footer SHALL display a soft glow effect behind the bars

### Requirement 4: Command Preview Drawer

**User Story:** As a user, I want to preview the full generated script before downloading, so that I can verify what will be installed.

#### Acceptance Criteria

1. WHEN the preview drawer is opened, THE Command_Drawer SHALL display the full generated script
2. THE Command_Drawer SHALL provide copy and download buttons within the drawer
3. WHEN Escape is pressed while drawer is open, THE Command_Drawer SHALL close with animation
4. THE Command_Drawer SHALL display the selected app count and package manager info
5. THE Command_Drawer SHALL animate smoothly when opening and closing

### Requirement 5: Rich Tooltip System

**User Story:** As a user, I want informative tooltips that follow my cursor and support formatted text, so that I can learn about apps without clicking.

#### Acceptance Criteria

1. THE Tooltip SHALL follow the cursor position when hovering over app items
2. THE Tooltip SHALL support markdown-ish formatting: **bold**, `code`, and [links](url)
3. THE Tooltip SHALL adjust position when near viewport edges (right-anchor adjustment)
4. THE Tooltip SHALL display an arrow indicator pointing toward the cursor
5. THE Tooltip SHALL have a fixed 300px width with proper word wrapping
6. THE Tooltip SHALL fade in/out smoothly with transitions
7. THE Tooltip SHALL remain visible when hovering over the tooltip itself
8. WHEN user clicks, scrolls, or presses Escape, THE Tooltip SHALL dismiss immediately
9. THE Tooltip SHALL only appear on desktop (hidden on mobile/touch devices)

### Requirement 6: Global Keyboard Shortcuts

**User Story:** As a power user, I want global keyboard shortcuts that work anywhere on the page, so that I can perform common actions quickly.

#### Acceptance Criteria

1. WHEN user presses '/' key, THE System SHALL focus the search input
2. WHEN user presses '?' key, THE System SHALL show help/shortcuts information
3. WHEN user is typing in an input field, THE System SHALL ignore navigation shortcuts
4. WHEN modifier keys (Ctrl, Alt, Meta) are pressed, THE System SHALL ignore custom shortcuts to avoid conflicts with browser shortcuts
5. WHEN no apps are selected, THE System SHALL disable action shortcuts (copy, download) but allow theme toggle and clear

