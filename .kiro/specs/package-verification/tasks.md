# Implementation Plan: Package Verification System

## Overview

This implementation plan breaks down the package verification system into discrete coding tasks. The approach is:
1. Set up infrastructure (types, MongoDB connection)
2. Implement individual package manager verifiers
3. Build the verification service
4. Create API routes
5. Build UI components
6. Wire everything together

## Tasks

- [x] 1. Set up verification infrastructure
  - [x] 1.1 Create verification types and constants
    - Create `src/lib/verification/types.ts` with VerificationStatus, VerificationResult, PackageVerifier interface
    - Define VERIFIABLE_MANAGERS and UNVERIFIABLE_MANAGERS arrays
    - _Requirements: 1.6, 2.1_
  
  - [x] 1.2 Write property tests for type validation
    - **Property 3: Verification Results Contain Required Fields**
    - **Property 4: Timestamps Are ISO 8601 Format**
    - **Validates: Requirements 2.1, 2.2**
  
  - [x] 1.3 Set up MongoDB connection utility
    - Create `src/lib/db/mongodb.ts` with connection pooling
    - Add environment variable handling for MONGODB_URI
    - Create database and collection initialization
    - _Requirements: 2.1, 2.5_

- [x] 2. Implement package manager verifiers
  - [x] 2.1 Implement HomebrewVerifier
    - Create `src/lib/verification/verifiers/homebrew.ts`
    - Handle formula vs cask URL construction (--cask prefix detection)
    - Parse API response and return VerificationResult
    - _Requirements: 1.1_
  
  - [x] 2.2 Write property tests for HomebrewVerifier URL construction
    - **Property 1: URL Construction for Verifiable Package Managers (Homebrew)**
    - **Validates: Requirements 1.1**
  
  - [x] 2.3 Implement ChocolateyVerifier
    - Create `src/lib/verification/verifiers/chocolatey.ts`
    - Build OData query URL with proper escaping
    - Parse JSON response and check for results
    - _Requirements: 1.2_
  
  - [x] 2.4 Write property tests for ChocolateyVerifier URL construction
    - **Property 1: URL Construction for Verifiable Package Managers (Chocolatey)**
    - **Validates: Requirements 1.2**
  
  - [x] 2.5 Implement WingetVerifier
    - Create `src/lib/verification/verifiers/winget.ts`
    - Parse Publisher.Name format to construct GitHub API path
    - Handle GitHub API response
    - _Requirements: 1.3_
  
  - [x] 2.6 Write property tests for WingetVerifier URL construction
    - **Property 1: URL Construction for Verifiable Package Managers (Winget)**
    - **Validates: Requirements 1.3**
  
  - [x] 2.7 Implement FlatpakVerifier
    - Create `src/lib/verification/verifiers/flatpak.ts`
    - Build Flathub API URL with app ID
    - Parse response and return result
    - _Requirements: 1.4_
  
  - [x] 2.8 Write property tests for FlatpakVerifier URL construction
    - **Property 1: URL Construction for Verifiable Package Managers (Flatpak)**
    - **Validates: Requirements 1.4**
  
  - [x] 2.9 Implement SnapVerifier
    - Create `src/lib/verification/verifiers/snap.ts`
    - Strip flags (--classic, etc.) from package name
    - Add required Snap-Device-Series header
    - _Requirements: 1.5_
  
  - [x] 2.10 Write property tests for SnapVerifier URL construction
    - **Property 1: URL Construction for Verifiable Package Managers (Snap)**
    - **Validates: Requirements 1.5**
  
  - [x] 2.11 Create verifier index with factory function
    - Create `src/lib/verification/verifiers/index.ts`
    - Export getVerifier(packageManagerId) factory function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Checkpoint - Verify all verifiers work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement VerificationService
  - [x] 4.1 Create core VerificationService class
    - Create `src/lib/verification/service.ts`
    - Implement verifyPackage() method with verifier routing
    - Handle unverifiable package managers
    - _Requirements: 1.6, 2.1_
  
  - [x] 4.2 Write property test for unverifiable package managers
    - **Property 2: Unverifiable Package Managers Return Unverifiable Status**
    - **Validates: Requirements 1.6**
  
  - [x] 4.3 Implement result storage methods
    - Add storeResult() method to save to MongoDB
    - Add getLatestResult() method to fetch previous status
    - Implement timestamp generation in ISO 8601 format
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 4.4 Write property test for failed results having error messages
    - **Property 5: Failed Verifications Include Error Messages**
    - **Validates: Requirements 2.3**
  
  - [x] 4.5 Implement manual review flag logic
    - Detect status regression (verified → failed)
    - Set manualReviewFlag when regression detected
    - _Requirements: 2.4_
  
  - [x] 4.6 Write property test for status regression triggering flag
    - **Property 6: Status Regression Triggers Manual Review Flag**
    - **Validates: Requirements 2.4**
  
  - [x] 4.7 Implement retry mechanism with exponential backoff
    - Create executeWithRetry() helper function
    - Implement isRetryableError() check for 429, 5xx, timeouts
    - Configure max 3 retries with exponential delays
    - _Requirements: 3.3, 7.2, 7.3_
  
  - [x] 4.8 Write property test for retry mechanism
    - **Property 8: Retry Mechanism Attempts Correct Number of Times**
    - **Property 17: 429 Response Triggers Retry**
    - **Validates: Requirements 3.3, 7.2, 7.3**
  
  - [x] 4.9 Implement error handling for API responses
    - Handle 404 → failed with "Package not found"
    - Handle unexpected errors → failed with error details
    - Preserve previous status on network errors
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [x] 4.10 Write property tests for error handling
    - **Property 16: 404 Response Results in Failed Status**
    - **Property 18: Unexpected Errors Result in Failed Status with Details**
    - **Property 19: Network Errors Preserve Previous Status**
    - **Validates: Requirements 7.1, 7.4, 7.5**
  
  - [x] 4.11 Implement verifyAllPackages() for batch verification
    - Iterate through all apps and their targets
    - Apply rate limiting delays between requests
    - Continue processing on individual failures
    - Return summary with counts
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [x] 4.12 Write property test for batch processing resilience
    - **Property 9: Single Failure Does Not Stop Batch Processing**
    - **Validates: Requirements 3.5**

- [x] 5. Checkpoint - Verify service works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create API routes
  - [x] 6.1 Create verification status API route
    - Create `src/app/api/verification-status/route.ts`
    - Implement GET handler for single and bulk status queries
    - Add query parameter handling for appId and packageManagerId
    - _Requirements: 6.4, 6.5_
  
  - [x] 6.2 Create verify API route
    - Create `src/app/api/verify/[appId]/route.ts`
    - Implement POST handler to trigger verification
    - Validate app exists and package manager is supported
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 6.3 Create cron verification API route
    - Create `src/app/api/cron/verify/route.ts`
    - Implement GET handler with CRON_SECRET authentication
    - Call verifyAllPackages() and return summary
    - _Requirements: 3.1, 3.4_
  
  - [x] 6.4 Create admin flagged packages API route
    - Create `src/app/api/admin/flagged/route.ts`
    - Implement GET handler with filtering and sorting
    - Implement PATCH handler to clear manual review flag
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [x] 6.5 Write property tests for admin API filtering and sorting
    - **Property 12: Admin Query Returns Only Flagged Packages**
    - **Property 13: Resolve Action Clears Manual Review Flag**
    - **Property 14: Admin Filter By Package Manager**
    - **Property 15: Admin Sort By Timestamp**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5**

- [x] 7. Implement UI components
  - [x] 7.1 Create VerificationBadge component
    - Create `src/components/verification/VerificationBadge.tsx`
    - Implement badge rendering with status-based icons and colors
    - Use Lucide icons (CheckCircle, XCircle, AlertTriangle, Clock)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 7.2 Write property test for badge rendering
    - **Property 10: Badge Rendering Matches Status**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  
  - [x] 7.3 Create VerificationTooltip component
    - Create tooltip content with last verification date
    - Include error message for failed verifications
    - Integrate with existing Tooltip component
    - _Requirements: 4.5, 4.6_
  
  - [x] 7.4 Write property test for tooltip content
    - **Property 11: Tooltip Content Matches Status**
    - **Validates: Requirements 4.5, 4.6**
  
  - [x] 7.5 Create AdminReviewPanel component
    - Create `src/components/admin/AdminReviewPanel.tsx`
    - Implement table with flagged packages
    - Add filter dropdown for package manager
    - Add sort toggle for timestamp
    - Add resolve button with API call
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 7.6 Create verification components barrel export
    - Create `src/components/verification/index.ts`
    - Export VerificationBadge and related components
    - _Requirements: 4.1_

- [x] 8. Integrate verification badges into app display
  - [x] 8.1 Create useVerificationStatus hook
    - Create `src/hooks/useVerificationStatus.ts`
    - Fetch verification statuses on mount
    - Provide status lookup by appId and packageManagerId
    - _Requirements: 6.4, 6.5_
  
  - [x] 8.2 Integrate VerificationBadge into AppItem component
    - Import VerificationBadge into AppItem
    - Display badge next to package name based on selected package manager
    - Pass verification status and timestamp to badge
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Set up data fetching strategy
  - [x] 9.1 Configure ISR for verification data
    - Add revalidate option to verification status fetching
    - Set 24-hour revalidation period
    - _Requirements: 6.2, 6.3_
  
  - [x] 9.2 Create server component for initial data fetch
    - Fetch verification statuses at build time
    - Pass to client components as props
    - _Requirements: 6.1_

- [x] 10. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Verify badges display correctly in the UI
  - Test admin panel functionality

## Notes

- All tasks including tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- MongoDB connection requires MONGODB_URI environment variable
- Cron endpoint requires CRON_SECRET environment variable for authentication
