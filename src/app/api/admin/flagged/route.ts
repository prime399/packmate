// Requirements: 5.1, 5.3, 5.4, 5.5 - Admin flagged packages API route
// Provides endpoints for viewing and managing packages flagged for manual review

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import type { VerificationResultDocument } from '@/lib/db/mongodb';
import type { PackageManagerId } from '@/lib/data';

/**
 * Request body for PATCH /api/admin/flagged
 */
interface ResolveRequestBody {
  appId: string;
  packageManagerId: PackageManagerId;
}

/**
 * Valid sort fields for flagged packages query
 */
type SortField = 'timestamp' | 'appId' | 'packageManagerId' | 'packageName';

/**
 * GET /api/admin/flagged
 * 
 * Retrieves all packages flagged for manual review.
 * 
 * Query parameters:
 * - packageManagerId: (optional) Filter by package manager ID
 * - sortBy: (optional) Sort field, defaults to 'timestamp'
 * 
 * Returns:
 * - 200: Array of VerificationResult objects with manualReviewFlag: true
 * - 500: Internal server error
 * 
 * Requirements:
 * - 5.1: Display list of all packages with Manual_Review_Flag set to true
 * - 5.4: Allow filtering flagged packages by package manager
 * - 5.5: Allow sorting flagged packages by last verification date
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageManagerId = searchParams.get('packageManagerId') as PackageManagerId | null;
    const sortBy = (searchParams.get('sortBy') || 'timestamp') as SortField;

    const db = await getDatabase();
    const collection = db.collection<VerificationResultDocument>('verification_results');

    // Build query - always filter for flagged packages (Requirement 5.1)
    const query: Record<string, unknown> = { manualReviewFlag: true };
    
    // Apply package manager filter if provided (Requirement 5.4)
    if (packageManagerId) {
      query.packageManagerId = packageManagerId;
    }

    // Validate sort field to prevent injection
    const validSortFields: SortField[] = ['timestamp', 'appId', 'packageManagerId', 'packageName'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'timestamp';

    // Query flagged packages with sorting (Requirement 5.5)
    const results = await collection
      .find(query)
      .sort({ [safeSortBy]: -1 })
      .toArray();

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching flagged packages:', error);

    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch flagged packages', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/flagged
 * 
 * Clears the manual review flag for a specific package.
 * 
 * Request body:
 * - appId: The application ID
 * - packageManagerId: The package manager ID
 * 
 * Returns:
 * - 200: { success: true } on successful update
 * - 400: Invalid request body (missing required fields)
 * - 404: No flagged package found matching the criteria
 * - 500: Internal server error
 * 
 * Requirements:
 * - 5.3: Allow clearing the Manual_Review_Flag when administrator resolves a flagged package
 */
export async function PATCH(request: Request) {
  try {
    // Parse and validate request body
    let body: ResolveRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { appId, packageManagerId } = body;

    // Validate required fields
    if (!appId || !packageManagerId) {
      return NextResponse.json(
        { error: 'appId and packageManagerId are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<VerificationResultDocument>('verification_results');

    // Update the flagged package to clear the manual review flag (Requirement 5.3)
    const result = await collection.updateOne(
      { appId, packageManagerId, manualReviewFlag: true },
      { $set: { manualReviewFlag: false } }
    );

    // Check if a document was actually updated
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No flagged package found matching the criteria' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resolving flagged package:', error);

    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to resolve flagged package', details: errorMessage },
      { status: 500 }
    );
  }
}
