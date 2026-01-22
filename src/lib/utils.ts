import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Category, getAppsByCategory } from './data';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Requirement 4.5 - Masonry packing algorithm to balance column heights

interface CategoryWithHeight {
  category: Category;
  height: number; // Estimated height based on app count
}

/**
 * Pack categories into columns to minimize height difference.
 * Uses a greedy algorithm that assigns each category to the shortest column.
 * 
 * @param categories - Array of categories to pack
 * @param numColumns - Number of columns to distribute into
 * @returns Array of arrays, where each inner array contains categories for that column
 */
export function packCategories(categories: Category[], numColumns: number): Category[][] {
  if (numColumns <= 0) return [];
  if (categories.length === 0) return Array.from({ length: numColumns }, () => []);

  // Calculate estimated height for each category (header + apps)
  const categoriesWithHeight: CategoryWithHeight[] = categories.map(category => ({
    category,
    height: getAppsByCategory(category).length + 2, // +2 for header padding
  }));

  // Sort by height descending (pack largest first for better balance)
  categoriesWithHeight.sort((a, b) => b.height - a.height);

  // Initialize columns with heights
  const columns: { categories: Category[]; height: number }[] = 
    Array.from({ length: numColumns }, () => ({ categories: [], height: 0 }));

  // Greedy assignment: add each category to the shortest column
  for (const { category, height } of categoriesWithHeight) {
    // Find the column with minimum height
    let minIndex = 0;
    let minHeight = columns[0].height;
    
    for (let i = 1; i < columns.length; i++) {
      if (columns[i].height < minHeight) {
        minHeight = columns[i].height;
        minIndex = i;
      }
    }

    // Add category to shortest column
    columns[minIndex].categories.push(category);
    columns[minIndex].height += height;
  }

  return columns.map(col => col.categories);
}

/**
 * Get the maximum height difference between columns after packing.
 * Useful for testing the balance of the packing algorithm.
 */
export function getColumnHeightDifference(packedColumns: Category[][]): number {
  if (packedColumns.length === 0) return 0;

  const heights = packedColumns.map(column => 
    column.reduce((sum, category) => sum + getAppsByCategory(category).length + 2, 0)
  );

  const maxHeight = Math.max(...heights);
  const minHeight = Math.min(...heights);

  return maxHeight - minHeight;
}
