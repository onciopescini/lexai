import { describe, it, expect } from 'vitest';
import type { AgentInput, AgentOutput, AgentPolicy, AgentContext, Agent } from './types';

describe('Agent Type System', () => {
  
  describe('AgentInput', () => {
    it('should accept minimal input with just query', () => {
      const input: AgentInput = { query: 'test' };
      expect(input.query).toBe('test');
      expect(input.context).toBeUndefined();
    });

    it('should accept input with full context', () => {
      const context: AgentContext = {
        history: [
          { role: 'user', content: 'Ciao' },
          { role: 'assistant', content: 'Benvenuto' },
        ],
        documents: 'Art. 2043 Codice Civile...',
        systemMemories: 'User prefers formal language',
      };
      
      const input: AgentInput = { query: 'articolo 2043', context };
      
      expect(input.context?.history).toHaveLength(2);
      expect(input.context?.documents).toContain('Art. 2043');
      expect(input.context?.systemMemories).toBeTruthy();
    });
  });

  describe('AgentOutput', () => {
    it('should represent a successful result', () => {
      const output: AgentOutput = {
        success: true,
        data: 'Legal analysis result',
      };
      expect(output.success).toBe(true);
      expect(output.error).toBeUndefined();
    });

    it('should represent a failure result', () => {
      const output: AgentOutput = {
        success: false,
        data: null,
        error: 'Model timeout',
      };
      expect(output.success).toBe(false);
      expect(output.data).toBeNull();
      expect(output.error).toBe('Model timeout');
    });

    it('should support metadata', () => {
      const output: AgentOutput = {
        success: true,
        data: { nodes: [], edges: [] },
        metadata: { processingTimeMs: 1500, model: 'gemini-2.5-flash' },
      };
      expect(output.metadata?.processingTimeMs).toBe(1500);
    });
  });

  describe('AgentPolicy', () => {
    it('should define valid policy configurations', () => {
      const policy: AgentPolicy = {
        name: 'TestPolicy_v1',
        permissions: {
          network: 'RESTRICTED',
          fileSystem: 'READ_ONLY',
        },
        resourceLimits: {
          maxTokens: 4000,
          timeoutMs: 15000,
        },
      };

      expect(policy.permissions.network).toBe('RESTRICTED');
      expect(policy.permissions.fileSystem).toBe('READ_ONLY');
      expect(policy.resourceLimits.maxTokens).toBe(4000);
    });

    it('should support all network permission levels', () => {
      const levels: AgentPolicy['permissions']['network'][] = ['BLOCKED', 'RESTRICTED', 'OUTBOUND_ALLOWED'];
      levels.forEach(level => {
        expect(['BLOCKED', 'RESTRICTED', 'OUTBOUND_ALLOWED']).toContain(level);
      });
    });

    it('should support all filesystem permission levels', () => {
      const levels: AgentPolicy['permissions']['fileSystem'][] = ['READ_ONLY', 'READ_WRITE', 'NO_ACCESS'];
      levels.forEach(level => {
        expect(['READ_ONLY', 'READ_WRITE', 'NO_ACCESS']).toContain(level);
      });
    });
  });
});
