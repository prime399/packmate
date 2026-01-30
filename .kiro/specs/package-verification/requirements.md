# Requirements Document

## Introduction

This document defines the requirements for an automated package verification system for Packmate. The system will verify that package names in the app catalog exist in their respective package manager repositories, store verification results in MongoDB Atlas, display verification status badges in the UI, and run daily verification jobs. This ensures users can trust that the package names provided will work when they run the generated install scripts.

## Glossary

- **Verification_Service**: The backend service responsible for checking package existence across package manager APIs
- **Package_Manager_API**: External APIs provided by package managers (Homebrew, Chocolatey, Winget, Flatpak, Snap) to query package information
- **Verification_Result**: A record containing the status of a package verification attempt including timestamp, status, and any error messages
- **Verification_Badge**: A visual indicator in the UI showing the verification status of a package
- **Verification_Status**: One of: verified (package exists), failed (package not found), pending (not yet checked), unverifiable (no API available)
- **Manual_Review_Flag**: A marker indicating a failed verification requires human attention
- **Verifiable_Package_Manager**: Package managers with public APIs: Homebrew, Chocolatey, Winget, Flatpak, Snap
- **Unverifiable_Package_Manager**: Package managers without public APIs: MacPorts, APT, DNF, Pacman, Zypper, Scoop

## Requirements

### Requirement 1: Package Verification API Integration

**User Story:** As a system administrator, I want the system to verify package names against official package manager APIs, so that I can ensure the app catalog contains valid package references.

#### Acceptance Criteria

1. WHEN the Verification_Service checks a Homebrew package, THE Verification_Service SHALL query `https://formulae.brew.sh/api/formula/{name}.json` for formulae and `https://formulae.brew.sh/api/cask/{name}.json` for casks
2. WHEN the Verification_Service checks a Chocolatey package, THE Verification_Service SHALL query `https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '{id}'` using OData format
3. WHEN the Verification_Service checks a Winget package, THE Verification_Service SHALL query `https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/{first-letter}/{publisher}/{name}`
4. WHEN the Verification_Service checks a Flatpak package, THE Verification_Service SHALL query `https://flathub.org/api/v2/appstream/{app_id}`
5. WHEN the Verification_Service checks a Snap package, THE Verification_Service SHALL query `https://api.snapcraft.io/v2/snaps/info/{name}`
6. WHEN the Verification_Service encounters a package from an Unverifiable_Package_Manager, THE Verification_Service SHALL mark the Verification_Status as "unverifiable"

### Requirement 2: Verification Result Storage

**User Story:** As a system administrator, I want verification results stored persistently, so that I can track verification history and avoid redundant API calls.

#### Acceptance Criteria

1. WHEN a verification completes, THE Verification_Service SHALL store the Verification_Result in MongoDB Atlas with appId, packageManagerId, packageName, status, timestamp, and errorMessage fields
2. WHEN storing a Verification_Result, THE Verification_Service SHALL include the verification timestamp in ISO 8601 format
3. WHEN a verification fails, THE Verification_Result SHALL include a descriptive errorMessage explaining the failure reason
4. WHEN a verification fails for a previously verified package, THE Verification_Service SHALL set the Manual_Review_Flag to true
5. THE Verification_Service SHALL maintain a history of verification results for audit purposes

### Requirement 3: Daily Verification Job

**User Story:** As a system administrator, I want automated daily verification of all packages, so that the verification data stays current without manual intervention.

#### Acceptance Criteria

1. THE Verification_Service SHALL execute a full verification of all verifiable packages once per day
2. WHEN the daily job runs, THE Verification_Service SHALL respect rate limits of external APIs by implementing appropriate delays between requests
3. WHEN the daily job encounters an API error, THE Verification_Service SHALL retry the request up to 3 times with exponential backoff
4. WHEN the daily job completes, THE Verification_Service SHALL log a summary including total packages checked, verified count, failed count, and error count
5. IF the daily job fails to complete, THEN THE Verification_Service SHALL log the failure and continue with remaining packages

### Requirement 4: Verification Badge Display

**User Story:** As a user, I want to see verification badges next to apps, so that I can know which package names have been confirmed to exist.

#### Acceptance Criteria

1. WHEN displaying an app, THE UI SHALL show a green checkmark badge for packages with Verification_Status "verified"
2. WHEN displaying an app, THE UI SHALL show a yellow warning badge for packages with Verification_Status "unverifiable"
3. WHEN displaying an app, THE UI SHALL show a red X badge for packages with Verification_Status "failed"
4. WHEN displaying an app, THE UI SHALL show a gray pending badge for packages with Verification_Status "pending"
5. WHEN a user hovers over a Verification_Badge, THE UI SHALL display a tooltip showing the last verification date
6. WHEN a user hovers over a failed Verification_Badge, THE UI SHALL display the error message in the tooltip

### Requirement 5: Admin Review Interface

**User Story:** As an administrator, I want to view packages flagged for manual review, so that I can investigate and fix verification failures.

#### Acceptance Criteria

1. THE Admin_Interface SHALL display a list of all packages with Manual_Review_Flag set to true
2. WHEN displaying flagged packages, THE Admin_Interface SHALL show the app name, package manager, package name, error message, and last verification date
3. WHEN an administrator resolves a flagged package, THE Admin_Interface SHALL allow clearing the Manual_Review_Flag
4. THE Admin_Interface SHALL allow filtering flagged packages by package manager
5. THE Admin_Interface SHALL allow sorting flagged packages by last verification date

### Requirement 6: Data Fetching Strategy

**User Story:** As a developer, I want efficient data fetching for verification status, so that the UI loads quickly while staying current.

#### Acceptance Criteria

1. THE Application SHALL fetch verification data at build time for initial page load performance
2. THE Application SHALL revalidate verification data periodically using Next.js ISR (Incremental Static Regeneration)
3. WHEN verification data is older than 24 hours, THE Application SHALL trigger a background revalidation
4. THE API SHALL provide an endpoint to fetch verification status for a specific app and package manager combination
5. THE API SHALL provide an endpoint to fetch all verification statuses in a single request for bulk operations

### Requirement 7: Error Handling and Resilience

**User Story:** As a system administrator, I want robust error handling, so that temporary API failures don't corrupt the verification data.

#### Acceptance Criteria

1. WHEN a Package_Manager_API returns a 404 status, THE Verification_Service SHALL mark the package as "failed" with message "Package not found"
2. WHEN a Package_Manager_API returns a 429 status (rate limited), THE Verification_Service SHALL wait and retry after the specified delay
3. WHEN a Package_Manager_API times out, THE Verification_Service SHALL retry up to 3 times before marking as "failed"
4. WHEN a Package_Manager_API returns an unexpected error, THE Verification_Service SHALL log the error and mark the package as "failed" with the error details
5. IF a network error occurs, THEN THE Verification_Service SHALL preserve the previous Verification_Status and log the error
