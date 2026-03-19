import { describe, it, expect } from 'vitest';
import { RouterAgent } from '@/lib/agents/RouterAgent';

describe('RouterAgent', () => {
  it('instantiates correctly', () => {
    const router = new RouterAgent();
    expect(router).toBeDefined();
    expect(router.name).toBe('RouterAgent');
  });

  // Since actual API integration needs to be mocked, we test the schema and structural aspects.
  // In a real environment, we would use nock or vitest setup to intercept Groq API calls.
});
