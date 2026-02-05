# Implementation Plan: Smart Search

## Overview

This plan implements smart search functionality for Packmate, enabling real-time filtering of the app catalog by name, description, and category. The implementation follows a modular approach with a dedicated search utility module integrated into the existing state management.

## Tasks

- [ ] 1. Create search utility module
  - [x] 1.1 Create `packmate/src/lib/search.ts` with core search functions
    - Implement `normalizeQuery(query: string): string` - lowercase, trim, collapse spaces
    - Implement `matchesApp(app: AppData, normalizedQuery: string): boolean` - check name, description, category
    - Implement `filterApps(apps: AppData[], query: string): AppData[]` - filter apps by query
    - Implement `filterCategories(categories: Category[], apps: AppData[], query: string): Category[]` - filter categories with matching apps
    - Implement `getFilteredAppsByCategory(apps: AppData[], category: Category, query: string): AppData[]` - get filtered apps for a category
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 8.1, 8.2, 8.3_

  - [x] 1.2 Write property test for query normalization consistency
    - **Property 7: Query Normalization Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 1.3 Write property test for all returned apps match query
    - **Property 1: All Returned Apps Match Query**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1**

  - [x] 1.4 Write property test for empty query returns all apps
    - **Property 2: Empty Query Returns All Apps**
    - **Validates: Requirements 1.2, 5.3**

  - [x] 1.5 Write property test for name substring inclusion
    - **Property 3: Name Substring Inclusion**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 1.6 Write property test for description substring inclusion
    - **Property 4: Description Substring Inclusion**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 1.7 Write property test for category substring inclusion
    - **Property 5: Category Substring Inclusion**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 1.8 Write property test for filtered categories contain only matching apps
    - **Property 6: Filtered Categories Contain Only Matching Apps**
    - **Validates: Requirements 5.1, 5.2, 6.3**

- [ ] 2. Integrate search into state management
  - [x] 2.1 Update `usePackmateInit` hook to expose search filtering
    - Add `filteredApps` memoized state derived from `searchQuery`
    - Add `filteredCategories` memoized state derived from `searchQuery`
    - Add `getFilteredAppsByCategory(category: Category)` function
    - Add `hasSearchResults` boolean for empty state detection
    - _Requirements: 1.1, 5.1, 6.1, 7.3_

  - [x] 2.2 Write unit tests for usePackmateInit search integration
    - Test filtered apps update when searchQuery changes
    - Test filtered categories update when searchQuery changes
    - Test hasSearchResults is false when no matches
    - _Requirements: 1.1, 5.1, 6.1_

- [x] 3. Checkpoint - Ensure search logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Update page component to use filtered data
  - [x] 4.1 Update `page.tsx` to pass filtered data to CategorySection components
    - Replace `categories` with `filteredCategories` in rendering
    - Replace `getAppsByCategory` with `getFilteredAppsByCategory` 
    - Move `searchQuery` state to `usePackmateInit` hook
    - _Requirements: 1.1, 5.1, 5.2_

  - [x] 4.2 Create SearchEmptyState component
    - Create `packmate/src/components/search/SearchEmptyState.tsx`
    - Display message when no apps match search query
    - Include "Clear search" button
    - _Requirements: 6.1, 6.2_

  - [x] 4.3 Integrate SearchEmptyState into page.tsx
    - Show SearchEmptyState when `hasSearchResults` is false and query is non-empty
    - Hide all CategorySection components when showing empty state
    - _Requirements: 6.1, 6.3_

- [ ] 5. Implement search result animations
  - [x] 5.1 Update CategorySection to animate filtered apps
    - Add GSAP animations for apps appearing/disappearing during search
    - Use staggered fade-in with slide effect for newly visible apps
    - Ensure animations complete within 300ms
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 5.2 Add category transition animations
    - Animate category sections appearing/disappearing during filtering
    - Use smooth height transitions for category containers
    - _Requirements: 9.3_

  - [x] 5.3 Add staggered animation when clearing search
    - Animate all apps back into view with staggered timing when query is cleared
    - _Requirements: 9.5_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The search module uses pure functions for easy testing
- GSAP is already used in the codebase for animations
