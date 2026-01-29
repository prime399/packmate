// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 - Verify API route
// Triggers package verification for a specific app and package manager

import { NextResponse } from 'next/server';
import { apps, type PackageManagerId } from '@/lib/data';
import { VerificationService } from '@/lib/verification/service';
import { getMongoClient } from '@/lib/db/mongodb';

/**
 * Request body for POST /api/verify/[appId]
 */
interface VerifyRequestBody {
  packageManagerId: PackageManagerId;
}

/**
 * Get or create a VerificationService instance with MongoDB connection
 * 
 * @returns Promise resolving to a VerificationService instance
 */
async function getVerificationService(): Promise<VerificationService> {
  try {
    const mongoClient = await getMongoClient();
    return new VerificationService(mongoClient);
  } catch {
    // If MongoDB is not configured, create service without storage
    return new VerificationService(null);
  }
}

/**
 * POST /api/verify/[appId]
 * 
 * Triggers verification for a specific app and package manager combination.
 * 
 * Path parameters:
 * - appId: The application ID (e.g., "firefox", "vscode")
 * 
 * Request body:
 * - packageManagerId: The package manager ID (e.g., "homebrew", "chocolatey")
 * 
 * Returns:
 * - 200: VerificationResult with status, timestamp, and optional error message
 * - 400: Invalid request body (missing packageManagerId)
 * - 404: App not found or package not available for the specified manager
 * - 500: Internal server error during verification
 * 
 * Requirements:
 * - 1.1: Verify Homebrew packages
 * - 1.2: Verify Chocolatey packages
 * - 1.3: Verify Winget packages
 * - 1.4: Verify Flatpak packages
 * - 1.5: Verify Snap packages
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    // Await params (Next.js 15+ async params)
    const { appId } = await params;
    
    // Parse and validate request body
    let body: VerifyRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { packageManagerId } = body;

    // Validate packageManagerId is provided
    if (!packageManagerId) {
      return NextResponse.json(
        { error: 'packageManagerId is required' },
        { status: 400 }
      );
    }

    // Find the app in the catalog
    const app = apps.find(a => a.id === appId);
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Get the package name for the specified package manager
    const packageName = app.targets[packageManagerId];
    
    if (!packageName) {
      return NextResponse.json(
        { error: 'Package not available for this manager' },
        { status: 404 }
      );
    }

    // Get the verification service and verify the package
    const service = await getVerificationService();
    const result = await service.verifyPackage(
      appId,
      packageManagerId,
      packageName
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying package:', error);
    
    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to verify package', details: errorMessage },
      { status: 500 }
    );
  }
}
