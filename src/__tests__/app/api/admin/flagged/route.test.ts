
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/admin/flagged/route';

// Define mocks using vi.hoisted to ensure they are available for hoisted vi.mock calls
const { mockCollection, mockDb } = vi.hoisted(() => {
  const mockCollection = {
    find: vi.fn(),
    sort: vi.fn(),
    toArray: vi.fn(),
    updateOne: vi.fn(),
  };

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  
  return { mockCollection, mockDb };
});

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));

vi.mock('@/lib/db/mongodb', () => ({
  getDatabase: vi.fn().mockResolvedValue(mockDb),
}));

describe('Admin Flagged Packages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.find.mockReturnValue(mockCollection);
    mockCollection.sort.mockReturnValue(mockCollection);
    mockCollection.toArray.mockResolvedValue([]);
    mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
  });

  describe('GET (Query Flagged Packages)', () => {
    // Property 12: Admin Query Returns Only Flagged Packages
    it('should query only for flagged packages (manualReviewFlag: true)', async () => {
      const request = new Request('http://localhost/api/admin/flagged');
      await GET(request);
      
      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({ manualReviewFlag: true })
      );
    });

    // Property 14: Admin Filter By Package Manager
    it('should filter by package manager if provided', async () => {
      const request = new Request('http://localhost/api/admin/flagged?packageManagerId=homebrew');
      await GET(request);
      
      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({ 
          manualReviewFlag: true,
          packageManagerId: 'homebrew' 
        })
      );
    });

    it('should NOT filter by package manager if NOT provided', async () => {
      const request = new Request('http://localhost/api/admin/flagged');
      await GET(request);
      
      // Should check arguments of first call to find
      const query = mockCollection.find.mock.calls[0][0];
      expect(query).not.toHaveProperty('packageManagerId');
    });

    // Property 15: Admin Sort By Timestamp
    it('should sort by timestamp descending by default', async () => {
      const request = new Request('http://localhost/api/admin/flagged');
      await GET(request);
      
      expect(mockCollection.sort).toHaveBeenCalledWith({ timestamp: -1 });
    });

    it('should allow sorting by other valid fields', async () => {
      const request = new Request('http://localhost/api/admin/flagged?sortBy=packageName');
      await GET(request);
      
      expect(mockCollection.sort).toHaveBeenCalledWith({ packageName: -1 });
    });

    it('should fallback to timestamp sort for invalid sort fields', async () => {
      const request = new Request('http://localhost/api/admin/flagged?sortBy=invalidField');
      await GET(request);
      
      expect(mockCollection.sort).toHaveBeenCalledWith({ timestamp: -1 });
    });
  });

  describe('PATCH (Resolve Flagged Package)', () => {
    // Property 13: Resolve Action Clears Manual Review Flag
    it('should clear manual review flag when resolved', async () => {
      const request = new Request('http://localhost/api/admin/flagged', {
        method: 'PATCH',
        body: JSON.stringify({ appId: 'test-app', packageManagerId: 'homebrew' }),
      });
      
      await PATCH(request);
      
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { appId: 'test-app', packageManagerId: 'homebrew', manualReviewFlag: true },
        { $set: { manualReviewFlag: false } }
      );
    });

    it('should return 400 if body is invalid', async () => {
      const request = new Request('http://localhost/api/admin/flagged', {
        method: 'PATCH',
        body: 'invalid-json',
      });
      
      const response = await PATCH(request) as unknown as { status: number; body: { error: string } };
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid request body');
    });

    it('should return 400 if required fields are missing', async () => {
      const request = new Request('http://localhost/api/admin/flagged', {
        method: 'PATCH',
        body: JSON.stringify({ appId: 'test-app' }), // Missing packageManagerId
      });
      
      const response = await PATCH(request) as unknown as { status: number; body: { error: string } };
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 if no matching flagged package found', async () => {
      mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });

      const request = new Request('http://localhost/api/admin/flagged', {
        method: 'PATCH',
        body: JSON.stringify({ appId: 'test-app', packageManagerId: 'homebrew' }),
      });
      
      const response = await PATCH(request) as unknown as { status: number; body: { error: string } };
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No flagged package found');
    });
  });
});
