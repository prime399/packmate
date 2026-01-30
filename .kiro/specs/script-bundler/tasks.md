# Implementation Plan: Script Bundler

## Overview

This plan implements the script-bundler service as a Node.js/Express API with TypeScript. The implementation follows an incremental approach, starting with project setup and core infrastructure, then building out validation, bundling, and API layers.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - [x] 1.1 Initialize Node.js project with TypeScript configuration
    - Create `script-bundler/` directory at workspace root
    - Initialize package.json with Express, TypeScript, and testing dependencies
    - Configure tsconfig.json with strict mode
    - Set up ESLint and Prettier
    - _Requirements: 10.1, 10.2_

  - [x] 1.2 Create project directory structure
    - Create src/api/, src/validation/, src/bundler/, src/queue/, src/storage/, src/scheduler/ directories
    - Create src/config.ts for environment variable configuration
    - Create src/types.ts for shared type definitions
    - _Requirements: 10.2_

  - [x] 1.3 Write property test for environment variable configuration
    - **Property 19: Environment Variable Configuration**
    - **Validates: Requirements 10.2**

- [x] 2. Implement Script Validator
  - [x] 2.1 Create validator configuration and types
    - Define ValidatorConfig interface
    - Define ValidationResult interface
    - Define prohibited patterns for PowerShell and Bash
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implement ScriptValidator class
    - Implement validate() method with platform-specific checks
    - Implement checkProhibitedPatterns() for security scanning
    - Implement verifyPackmateFormat() for format validation
    - Implement sanitize() method
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.3 Write property test for prohibited pattern rejection
    - **Property 4: Prohibited Pattern Rejection**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [x] 2.4 Write property test for valid script sanitization
    - **Property 5: Valid Script Sanitization**
    - **Validates: Requirements 2.6**

  - [x] 2.5 Write property test for packmate format validation
    - **Property 6: Packmate Format Validation**
    - **Validates: Requirements 2.7, 9.1**

- [x] 3. Checkpoint - Validator Tests Pass
  - Ensure all validator tests pass, ask the user if questions arise.

- [x] 4. Implement Job Queue
  - [x] 4.1 Create Job interface and JobQueue class
    - Define Job interface with all required fields
    - Implement createJob() method with UUID generation
    - Implement getJob() and updateJob() methods
    - Implement getNextJob() for processing queue
    - Implement cleanupExpired() for TTL management
    - _Requirements: 1.1, 6.1, 6.2_

  - [x] 4.2 Write property test for job creation
    - **Property 1: Valid Submission Returns Job ID**
    - **Validates: Requirements 1.1, 6.1**

  - [x] 4.3 Write property test for status response consistency
    - **Property 12: Status Response State Consistency**
    - **Validates: Requirements 6.2, 6.3, 6.4**

- [x] 5. Implement File Store
  - [x] 5.1 Create FileStore class
    - Implement store() method for saving files
    - Implement getPath() and getStream() for retrieval
    - Implement delete() for cleanup
    - Implement cleanupExpired() for TTL-based cleanup
    - _Requirements: 5.1, 7.1, 7.2, 7.3_

  - [x] 5.2 Write property test for file cleanup after timeout
    - **Property 13: File Cleanup After Timeout**
    - **Validates: Requirements 7.1**

  - [x] 5.3 Write property test for file cleanup after download
    - **Property 14: File Cleanup After Download**
    - **Validates: Requirements 7.2**

- [x] 6. Implement Bundling Engine
  - [x] 6.1 Create WindowsBundler class
    - Implement bundle() method using PS2EXE
    - Handle PowerShell script file creation
    - Handle executable output and error handling
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 6.2 Create MacOSBundler class
    - Implement bundle() method using Platypus CLI
    - Implement zipBundle() for .app compression
    - Handle Info.plist generation
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.3 Create BundlingEngine orchestrator
    - Route to appropriate bundler based on platform
    - Handle cleanup of temporary files
    - _Requirements: 3.1, 4.1_

  - [x] 6.4 Write property test for platform-appropriate executable generation
    - **Property 7: Platform-Appropriate Executable Generation**
    - **Validates: Requirements 3.1, 4.1**

  - [x] 6.5 Write property test for macOS bundle structure
    - **Property 8: macOS Bundle Structure**
    - **Validates: Requirements 4.2, 4.4**

  - [x] 6.6 Write property test for macOS downloads are zipped
    - **Property 11: macOS Downloads Are Zipped**
    - **Validates: Requirements 5.5**

- [x] 7. Checkpoint - Core Components Complete
  - Ensure all core component tests pass, ask the user if questions arise.

- [x] 8. Implement API Layer
  - [x] 8.1 Create Express app with middleware
    - Set up Express application
    - Add JSON body parser with size limit
    - Add CORS middleware with allowed origins
    - Add rate limiting middleware
    - Add security headers middleware
    - _Requirements: 1.6, 8.1, 8.2, 8.3, 8.4, 9.2_

  - [x] 8.2 Implement POST /api/bundle endpoint
    - Validate request body (script, platform, metadata)
    - Call ScriptValidator
    - Create job in JobQueue
    - Return job ID and status URL
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 8.3 Implement GET /api/status/:jobId endpoint
    - Look up job in JobQueue
    - Return status with appropriate fields
    - Handle non-existent jobs
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 8.4 Implement GET /api/download/:jobId endpoint
    - Look up job and verify completed status
    - Stream file with correct headers
    - Trigger cleanup after download
    - Handle non-existent and expired jobs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.5 Implement GET /health endpoint
    - Return 200 OK with service status
    - _Requirements: 9.3, 10.3_

  - [x] 8.6 Write property test for invalid platform rejection
    - **Property 2: Invalid Platform Rejection**
    - **Validates: Requirements 1.3**

  - [x] 8.7 Write property test for script size limit enforcement
    - **Property 3: Script Size Limit Enforcement**
    - **Validates: Requirements 1.6**

  - [x] 8.8 Write property test for non-existent job returns 404
    - **Property 10: Non-Existent Job Returns 404**
    - **Validates: Requirements 5.3, 6.5**

  - [x] 8.9 Write property test for download response headers
    - **Property 9: Download Response Headers**
    - **Validates: Requirements 5.2**

  - [x] 8.10 Write property test for rate limiting enforcement
    - **Property 15: Rate Limiting Enforcement**
    - **Validates: Requirements 8.1, 8.2**

  - [x] 8.11 Write property test for security headers present
    - **Property 16: Security Headers Present**
    - **Validates: Requirements 8.4**

  - [x] 8.12 Write property test for CORS headers present
    - **Property 17: CORS Headers Present**
    - **Validates: Requirements 9.2**

  - [x] 8.13 Write property test for metadata affects output filename
    - **Property 18: Metadata Affects Output Filename**
    - **Validates: Requirements 9.4**

- [x] 9. Implement Background Processing
  - [x] 9.1 Create job processor
    - Implement processNextJob() function
    - Poll job queue for pending jobs
    - Call BundlingEngine for each job
    - Update job status on completion/failure
    - _Requirements: 3.1, 4.1_

  - [x] 9.2 Create CleanupScheduler
    - Implement periodic cleanup of expired jobs and files
    - Log cleanup actions
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 9.3 Implement graceful shutdown
    - Handle SIGTERM signal
    - Complete in-progress jobs
    - Clean up resources
    - _Requirements: 10.5_

- [x] 10. Checkpoint - API Tests Pass
  - Ensure all API tests pass, ask the user if questions arise.

- [x] 11. Docker and Deployment Configuration
  - [x] 11.1 Create Dockerfile
    - Use Node.js base image
    - Install PowerShell Core for PS2EXE
    - Install Platypus CLI (or mock for non-macOS)
    - Copy application code
    - Set up health check
    - _Requirements: 10.1_

  - [x] 11.2 Create docker-compose.yml for local development
    - Define service configuration
    - Set up volume mounts for development
    - Configure environment variables
    - _Requirements: 10.1_

  - [x] 11.3 Create render.yaml for render.com deployment
    - Define web service configuration
    - Set environment variables
    - Configure health check path
    - _Requirements: 10.1, 10.3_

  - [x] 11.4 Write unit tests for health endpoint
    - Test /health returns 200 OK
    - Test response includes service status
    - _Requirements: 9.3, 10.3_

- [x] 12. Final Checkpoint - All Tests Pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The bundling tools (PS2EXE, Platypus) require specific OS environments - Docker handles this
- For local development without Docker, bundling can be mocked
