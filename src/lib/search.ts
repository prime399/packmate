/**
 * Search utility module for Packmate
 * Provides pure functions for filtering apps and categories based on search queries
 * 
 * Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 8.1, 8.2, 8.3
 */

import { AppData, Category } from './data';

/**
 * Normalizes a search query for consistent matching
 * - Converts to lowercase
 * - Trims leading and trailing whitespace
 * - Collapses multiple consecutive spaces into a single space
 * 
 * Requirements: 8.1, 8.2, 8.3
 * 
 * @param query - The raw search query string
 * @returns The normalized query string
 */
export function normalizeQuery(query: string): string {
  if (query == null) {
    return '';
  }
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if an app matches the search query
 * Matches against: name, description, category (case-insensitive substring matching)
 * 
 * Requirements: 2.1, 3.1, 4.1
 * 
 * @param app - The app to check
 * @param normalizedQuery - The pre-normalized search query (must be lowercase)
 * @returns True if the app matches the query, false otherwise
 */
export function matchesApp(app: AppData, normalizedQuery: string): boolean {
  // Empty query matches all apps
  if (!normalizedQuery) {
    return true;
  }

  // Check name match (case-insensitive)
  const nameMatch = app.name.toLowerCase().includes(normalizedQuery);
  if (nameMatch) {
    return true;
  }

  // Check description match (case-insensitive)
  const descriptionMatch = app.description.toLowerCase().includes(normalizedQuery);
  if (descriptionMatch) {
    return true;
  }

  // Check category match (case-insensitive)
  const categoryMatch = app.category.toLowerCase().includes(normalizedQuery);
  if (categoryMatch) {
    return true;
  }

  return false;
}

/**
 * Filters apps based on search query
 * Returns all apps if query is empty or whitespace-only
 * 
 * Requirements: 1.1, 1.2, 2.1, 3.1, 4.1
 * 
 * @param apps - The array of apps to filter
 * @param query - The raw search query string
 * @returns Array of apps that match the query
 */
export function filterApps(apps: AppData[], query: string): AppData[] {
  const normalizedQuery = normalizeQuery(query);
  
  // Empty query returns all apps
  if (!normalizedQuery) {
    return apps;
  }

  return apps.filter(app => matchesApp(app, normalizedQuery));
}

/**
 * Filters categories to only include those with matching apps
 * Returns all categories if query is empty or whitespace-only
 * 
 * Requirements: 5.1, 5.2
 * 
 * @param categories - The array of categories to filter
 * @param apps - The array of all apps
 * @param query - The raw search query string
 * @returns Array of categories that contain at least one matching app
 */
export function filterCategories(
  categories: Category[],
  apps: AppData[],
  query: string
): Category[] {
  const normalizedQuery = normalizeQuery(query);
  
  // Empty query returns all categories
  if (!normalizedQuery) {
    return categories;
  }

  // Filter to categories that have at least one matching app
  return categories.filter(category => {
    const categoryApps = apps.filter(app => app.category === category);
    return categoryApps.some(app => matchesApp(app, normalizedQuery));
  });
}

/**
 * Gets filtered apps for a specific category
 * Returns all apps in the category if query is empty
 * 
 * Requirements: 5.2
 * 
 * @param apps - The array of all apps
 * @param category - The category to filter by
 * @param query - The raw search query string
 * @returns Array of apps in the category that match the query
 */
export function getFilteredAppsByCategory(
  apps: AppData[],
  category: Category,
  query: string
): AppData[] {
  const normalizedQuery = normalizeQuery(query);
  
  // Get apps in this category
  const categoryApps = apps.filter(app => app.category === category);
  
  // Empty query returns all apps in category
  if (!normalizedQuery) {
    return categoryApps;
  }

  // Filter by query
  return categoryApps.filter(app => matchesApp(app, normalizedQuery));
}
