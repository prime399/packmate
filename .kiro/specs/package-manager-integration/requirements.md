# Requirements Document

## Introduction

This feature extends Packmate to support multi-platform package manager integration, transforming it from a simple app catalog with boolean availability flags into a full-featured cross-platform bulk app installer. Users will be able to select their preferred package manager for their operating system, view app availability per package manager, and generate installation scripts or commands that can be copied or downloaded.

## Glossary

- **Package_Manager**: A software tool that automates installing, upgrading, configuring, and removing software packages (e.g., Homebrew, Winget, apt)
- **Package_Manager_Selector**: A UI component that allows users to choose their preferred package manager for their selected operating system
- **Targets**: A mapping of package manager IDs to their corresponding package names/commands for a specific app
- **Installation_Script**: A generated shell script or command that installs selected apps using the chosen package manager
- **Command_Footer**: A UI component at the bottom of the screen showing the generated installation command with copy/download actions
- **Unavailable_Reason**: Markdown text explaining why an app is not available for a specific package manager and providing alternative installation instructions

## Requirements

### Requirement 1: Package Manager Data Model

**User Story:** As a developer, I want a data model that maps apps to their package names across different package managers, so that the system can generate correct installation commands.

#### Acceptance Criteria

1. THE Data_Model SHALL define a `PackageManagerId` type that includes: `winget`, `chocolatey`, `scoop` (Windows); `homebrew`, `macports` (macOS); `apt`, `dnf`, `pacman`, `zypper`, `flatpak`, `snap` (Linux)
2. THE Data_Model SHALL define a `PackageManager` interface with properties: `id`, `name`, `iconUrl`, `color`, `installPrefix`, and `osId`
3. THE AppData interface SHALL include a `targets` property of type `Partial<Record<PackageManagerId, string>>` mapping package managers to package names
4. THE AppData interface SHALL include an optional `unavailableReason` property containing markdown text for fallback instructions
5. WHEN an app entry has a target for a package manager, THE target value SHALL contain the exact package name or command flags needed for installation

### Requirement 2: Package Manager Configuration

**User Story:** As a user, I want to see which package managers are available for my operating system and select my preferred one, so that I can generate commands for my specific setup.

#### Acceptance Criteria

1. THE System SHALL provide a list of package managers filtered by the currently selected operating system
2. WHEN a user selects an operating system, THE Package_Manager_Selector SHALL display only package managers compatible with that OS
3. THE System SHALL persist the selected package manager to localStorage per operating system
4. WHEN a user changes operating systems, THE System SHALL restore the previously selected package manager for that OS or default to the primary package manager
5. THE Package_Manager_Selector SHALL display the package manager name, icon, and a visual indicator for the currently selected option

### Requirement 3: App Availability Display

**User Story:** As a user, I want to see which apps are available for my selected package manager, so that I can make informed selections.

#### Acceptance Criteria

1. WHEN displaying an app, THE System SHALL show a visual indicator of availability based on the selected package manager (not just OS)
2. WHEN an app is unavailable for the selected package manager, THE System SHALL display the app with reduced opacity and a disabled state
3. WHEN a user hovers over or clicks an unavailable app, THE System SHALL display the `unavailableReason` markdown content if available
4. THE Category_Section SHALL display a badge showing the count of available apps for the selected package manager
5. WHEN an app is unavailable, THE System SHALL prevent it from being selected

### Requirement 4: Installation Command Generation

**User Story:** As a user, I want to generate installation commands for my selected apps using my chosen package manager, so that I can quickly install software on my system.

#### Acceptance Criteria

1. WHEN apps are selected, THE System SHALL generate a simple one-liner command using the selected package manager's install prefix
2. THE Command_Generator SHALL only include apps that have targets for the selected package manager
3. WHEN generating commands for Homebrew, THE System SHALL correctly handle `--cask` prefixed packages by grouping them separately
4. WHEN generating commands for Snap, THE System SHALL handle `--classic` flags appropriately
5. THE System SHALL escape special shell characters in package names to prevent command injection

### Requirement 5: Installation Script Generation

**User Story:** As a user, I want to download a full installation script with error handling and progress indicators, so that I can run a robust installation process.

#### Acceptance Criteria

1. THE System SHALL generate downloadable shell scripts for each package manager type
2. THE Installation_Script SHALL include ASCII art header with metadata (package manager name, package count, generation date)
3. THE Installation_Script SHALL include colored output utilities for success, error, warning, and progress messages
4. THE Installation_Script SHALL check if each package is already installed before attempting installation
5. THE Installation_Script SHALL implement retry logic for network-related failures
6. THE Installation_Script SHALL display a progress bar with ETA during installation
7. THE Installation_Script SHALL print a summary at the end showing installed, skipped, and failed packages
8. IF the package manager is not installed, THEN THE Installation_Script SHALL display an error message with installation instructions

### Requirement 6: Command Footer Component

**User Story:** As a user, I want a persistent footer showing my generated command with copy and download options, so that I can easily use the generated commands.

#### Acceptance Criteria

1. WHEN apps are selected, THE Command_Footer SHALL appear at the bottom of the screen
2. THE Command_Footer SHALL display the generated one-liner command in a code block
3. THE Command_Footer SHALL provide a "Copy" button that copies the command to clipboard
4. THE Command_Footer SHALL provide a "Download" button that downloads the full installation script
5. WHEN the copy action succeeds, THE System SHALL display visual feedback (e.g., "Copied!" tooltip)
6. THE Command_Footer SHALL be expandable to show a preview of the full script
7. WHEN no apps are selected, THE Command_Footer SHALL be hidden or display a placeholder message

### Requirement 7: App Data Migration

**User Story:** As a developer, I want to migrate existing app data from boolean availability to the targets-based model, so that the system can generate accurate installation commands.

#### Acceptance Criteria

1. THE System SHALL update all existing app entries to use the `targets` mapping instead of boolean `availability`
2. WHEN an app was previously marked as available for an OS, THE migration SHALL include appropriate package manager targets for that OS
3. THE migration SHALL include `unavailableReason` for apps that are not in official package manager repositories
4. THE migration SHALL preserve all existing app metadata (id, name, description, category, iconUrl)

### Requirement 8: State Management Updates

**User Story:** As a developer, I want the state management hook to support package manager selection and availability checking, so that components can react to package manager changes.

#### Acceptance Criteria

1. THE usePackmateInit hook SHALL expose `selectedPackageManager` and `setSelectedPackageManager` for the current OS
2. THE usePackmateInit hook SHALL expose an `isAppAvailable` function that checks availability against the selected package manager
3. THE usePackmateInit hook SHALL persist package manager selections to localStorage with keys per OS
4. WHEN the selected OS changes, THE hook SHALL automatically update the selected package manager to the appropriate default or persisted value
5. THE hook SHALL expose a `getAvailablePackageManagers` function that returns package managers for the current OS
