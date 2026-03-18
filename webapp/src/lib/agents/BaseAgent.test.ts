import { describe, it, expect, vi } from 'vitest';
import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentOutput, AgentPolicy } from './types';

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  name = 'TestAgent';
  description = 'A test agent for unit testing';
  policy: AgentPolicy = {
    name: 'TestPolicy_v1',
    permissions: {
      network: 'BLOCKED',
      fileSystem: 'NO_ACCESS',
    },
    resourceLimits: {
      maxTokens: 100,
      timeoutMs: 5000,
    },
  };

  mockResult: string | object | null = 'test result';
  shouldThrow = false;

  protected async performExecution(input: AgentInput): Promise<string | object | null> {
    if (this.shouldThrow) {
      throw new Error('Simulated agent failure');
    }
    return this.mockResult;
  }
}

describe('BaseAgent', () => {
  it('should return policy correctly', () => {
    const agent = new TestAgent();
    const policy = agent.getPolicy();
    
    expect(policy.name).toBe('TestPolicy_v1');
    expect(policy.permissions.network).toBe('BLOCKED');
    expect(policy.permissions.fileSystem).toBe('NO_ACCESS');
    expect(policy.resourceLimits.maxTokens).toBe(100);
    expect(policy.resourceLimits.timeoutMs).toBe(5000);
  });

  it('should execute successfully and wrap result', async () => {
    const agent = new TestAgent();
    agent.mockResult = 'Hello from TestAgent';
    
    const result = await agent.execute({ query: 'test query' });
    
    expect(result.success).toBe(true);
    // BaseAgent wraps the performExecution result inside data
    expect(result.data).toBeDefined();
  });

  it('should handle object return values', async () => {
    const agent = new TestAgent();
    agent.mockResult = { intent: 'research', confidence: 0.95 };
    
    const result = await agent.execute({ query: 'articolo 2043' });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle null return values gracefully', async () => {
    const agent = new TestAgent();
    agent.mockResult = null;
    
    const result = await agent.execute({ query: 'null test' });
    
    expect(result.success).toBe(true);
  });

  it('should catch errors and return failure with error message', async () => {
    const agent = new TestAgent();
    agent.shouldThrow = true;
    
    const result = await agent.execute({ query: 'will fail' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Simulated agent failure');
    expect(result.data).toBeNull();
  });

  it('should warn on empty query during policy validation', async () => {
    const agent = new TestAgent();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await agent.execute({ query: '' });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('TestAgent')
    );
    consoleSpy.mockRestore();
  });
});
