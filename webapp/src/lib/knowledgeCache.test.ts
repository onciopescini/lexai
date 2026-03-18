import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQueryHash, findCachedKnowledge } from './knowledgeCache';
import { supabaseAdmin } from './supabase';

vi.mock('./supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('KnowledgeCache Service', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateQueryHash', () => {
    it('should generate consistent hashes for identical queries with different spacing', () => {
      const hash1 = generateQueryHash('Articolo 2043 codice civile');
      const hash2 = generateQueryHash(' articolo   2043  codice civile  ');
      expect(hash1).toBe(hash2);
    });

    it('should be case insensitive', () => {
      const hash1 = generateQueryHash('ARTICOLO 2043');
      const hash2 = generateQueryHash('articolo 2043');
      expect(hash1).toBe(hash2);
    });
  });

  describe('findCachedKnowledge', () => {
    it('should return exact match if valid and not expired', async () => {
      const mockCached = { id: 'uuid-1', query_text: 'test', perplexity_response: 'risposta verificata' };
      
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCached, error: null });
      const mockGt = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      // @ts-expect-error Mocking supabaseAdmin for testing
      supabaseAdmin.from.mockReturnValue({ select: mockSelect });
      
      const result = await findCachedKnowledge('test', [0.1, 0.2]);
      
      expect(result).toEqual(mockCached);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('verified_knowledge');
    });

    it('should fallback to semantic search if exact match fails', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockGt = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      // @ts-expect-error Mocking supabaseAdmin for testing
      supabaseAdmin.from.mockReturnValue({ select: mockSelect });

      const mockSemanticMatch = { id: 'uuid-2', similarity: 0.9 };
      // @ts-expect-error Mocking supabaseAdmin for testing
      supabaseAdmin.rpc.mockResolvedValue({ data: [mockSemanticMatch], error: null });

      const result = await findCachedKnowledge('test', [0.1, 0.2], 0.85);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('match_verified_knowledge', {
        query_embedding: [0.1, 0.2],
        match_threshold: 0.85,
        match_count: 1
      });
      expect(result).toEqual(mockSemanticMatch);
    });

    it('should return null if cache MISS on both', async () => {
      // Setup exact match fail
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockGt = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      // @ts-expect-error Mocking supabaseAdmin for testing
      supabaseAdmin.from.mockReturnValue({ select: mockSelect });

      // Setup semantic search fail
      // @ts-expect-error Mocking supabaseAdmin for testing
      supabaseAdmin.rpc.mockResolvedValue({ data: [], error: null });

      const result = await findCachedKnowledge('test', [0.1, 0.2]);
      expect(result).toBeNull();
    });
  });
});
