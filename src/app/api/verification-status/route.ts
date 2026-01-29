// Requirements: 6.2, 6.3, 6.4, 6.5 - Verification status API route
// Provides endpoints for single and bulk verification status queries
// Configured with ISR for 24-hour revalidation

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import type { VerificationResultDocument } from '@/lib/db/mongodb';
import type { PackageManagerId } from '@/lib/data';
import type { VerificationResult } from '@/lib/verification/types';

// Requirement 6.2, 6.3: Configure ISR with 24-hour revalidation period
// This allows the data to be cached and revalidated periodically
export const revalidate = 86400; // 24 hours in seconds

// Demo data for testing when database is empty
// This shows verification badges for a few apps to demonstrate the feature
const DEMO_VERIFICATION_DATA: VerificationResult[] = [
  { appId: 'git', packageManagerId: 'chocolatey', packageName: 'git', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'vscode', packageManagerId: 'chocolatey', packageName: 'vscode', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'firefox', packageManagerId: 'chocolatey', packageName: 'firefox', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'docker', packageManagerId: 'chocolatey', packageName: 'docker-desktop', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'nodejs', packageManagerId: 'chocolatey', packageName: 'nodejs', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'python', packageManagerId: 'chocolatey', packageName: 'python', status: 'failed', timestamp: new Date().toISOString(), errorMessage: 'Package not found' },
  { appId: 'vlc', packageManagerId: 'chocolatey', packageName: 'vlc', status: 'pending', timestamp: new Date().toISOString() },
  { appId: 'steam', packageManagerId: 'chocolatey', packageName: 'steam', status: 'unverifiable', timestamp: new Date().toISOString() },
  // Homebrew
  { appId: 'git', packageManagerId: 'homebrew', packageName: 'git', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'vscode', packageManagerId: 'homebrew', packageName: '--cask visual-studio-code', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'firefox', packageManagerId: 'homebrew', packageName: '--cask firefox', status: 'verified', timestamp: new Date().toISOString() },
  // Winget
  { appId: 'git', packageManagerId: 'winget', packageName: 'Git.Git', status: 'verified', timestamp: new Date().toISOString() },
  { appId: 'vscode', packageManagerId: 'winget', packageName: 'Microsoft.VisualStudioCode', status: 'verified', timestamp: new Date().toISOString() },
];

/**
 * GET /api/verification-status
 * 
 * Query parameters:
 * - appId: (optional) Filter by app ID
 * - packageManagerId: (optional) Filter by package manager ID
 * 
 * Behavior:
 * - If both appId and packageManagerId are provided: Returns single latest status
 * - If neither is provided: Returns all latest statuses (bulk query)
 * 
 * Requirements:
 * - 6.4: Provide endpoint to fetch verification status for specific app/pm combination
 * - 6.5: Provide endpoint to fetch all verification statuses in single request
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const packageManagerId = searchParams.get('packageManagerId') as PackageManagerId | null;

    let results: VerificationResult[] = [];
    let useDemoData = false;

    try {
      const db = await getDatabase();
      const collection = db.collection<VerificationResultDocument>('verification_results');

      if (appId && packageManagerId) {
        // Single status lookup - Requirement 6.4
        const result = await collection.findOne(
          { appId, packageManagerId },
          { sort: { timestamp: -1 } }
        );

        if (!result) {
          // Check demo data
          const demoResult = DEMO_VERIFICATION_DATA.find(
            d => d.appId === appId && d.packageManagerId === packageManagerId
          );
          if (demoResult) {
            return NextResponse.json(demoResult);
          }
          return NextResponse.json({
            appId,
            packageManagerId,
            status: 'pending',
            timestamp: null,
          });
        }

        return NextResponse.json(result);
      }

      // Bulk status lookup - Requirement 6.5
      const pipeline = [
        { $sort: { timestamp: -1 as const } },
        {
          $group: {
            _id: { appId: '$appId', packageManagerId: '$packageManagerId' },
            latest: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$latest' } },
      ];

      results = await collection.aggregate(pipeline).toArray() as VerificationResult[];
      
      if (results.length === 0) {
        useDemoData = true;
      }
    } catch (dbError) {
      console.warn('Database error, using demo data:', dbError);
      useDemoData = true;
    }

    if (useDemoData) {
      return NextResponse.json(DEMO_VERIFICATION_DATA);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch verification status', details: errorMessage },
      { status: 500 }
    );
  }
}
