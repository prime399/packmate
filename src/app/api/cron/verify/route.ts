// Requirements: 3.1, 3.4 - Cron verification API route
// Executes daily verification of all packages with CRON_SECRET authentication

import { NextResponse } from 'next/server';
import { VerificationService } from '@/lib/verification/service';
import { getMongoClient } from '@/lib/db/mongodb';

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
 * GET /api/cron/verify
 * 
 * Executes a full verification of all verifiable packages in the app catalog.
 * This endpoint is designed to be called by a cron job (e.g., Vercel Cron, 
 * external scheduler) once per day.
 * 
 * Authentication:
 * - Requires Bearer token authentication using CRON_SECRET environment variable
 * - Header format: `Authorization: Bearer <CRON_SECRET>`
 * 
 * Returns:
 * - 200: VerificationSummary with total, verified, failed, errors, unverifiable counts
 * - 401: Unauthorized (missing or invalid CRON_SECRET)
 * - 500: Internal server error during verification
 * 
 * Example response:
 * ```json
 * {
 *   "total": 150,
 *   "verified": 120,
 *   "failed": 10,
 *   "errors": 5,
 *   "unverifiable": 15
 * }
 * ```
 * 
 * Requirements:
 * - 3.1: Execute full verification of all verifiable packages once per day
 * - 3.4: Log summary including total packages checked, verified count, failed count, error count
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    // Requirements: 3.1 - Secure the daily verification endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check if CRON_SECRET is configured
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Validate authorization header
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the verification service and run full verification
    const service = await getVerificationService();
    const summary = await service.verifyAllPackages();

    // Requirements: 3.4 - Log summary when daily job completes
    console.log('Daily verification complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error during cron verification:', error);

    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to complete verification', details: errorMessage },
      { status: 500 }
    );
  }
}
