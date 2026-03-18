import { describe, it, expect } from 'vitest';
import { RouterAgent } from './RouterAgent';
import { AtenaSearchAgent } from './AtenaSearchAgent';
import { MindMapAgent } from './MindMapAgent';
import { TenthManAgent } from './TenthManAgent';
import { PicoClawAgent } from './PicoClawAgent';
import { MemoryAgent } from './MemoryAgent';
import { LiveWebAgent } from './LiveWebAgent';
import { SocialAgent } from './SocialAgent';
import { IngestAgent } from './IngestAgent';

describe('Agent Registry', () => {
  
  describe('All agents have valid metadata', () => {
    const agents = [
      new RouterAgent(),
      new AtenaSearchAgent(),
      new MindMapAgent(),
      new TenthManAgent(),
      new PicoClawAgent(),
      new MemoryAgent(),
      new LiveWebAgent(),
      new SocialAgent(),
      new IngestAgent(),
    ];

    it('should have 9 agents total', () => {
      expect(agents).toHaveLength(9);
    });

    agents.forEach(agent => {
      describe(agent.name, () => {
        it('should have a non-empty name', () => {
          expect(agent.name).toBeTruthy();
          expect(agent.name.length).toBeGreaterThan(0);
        });

        it('should have a non-empty description', () => {
          expect(agent.description).toBeTruthy();
          expect(agent.description.length).toBeGreaterThan(0);
        });

        it('should have a defined policy object', () => {
          const policy = agent.getPolicy();
          expect(policy).toBeDefined();
          expect(typeof policy).toBe('object');
        });
      });
    });
  });

  // Agents with OpenShell-style policy (name, permissions, resourceLimits)
  describe('OpenShell Policy Schema Agents', () => {
    const openShellAgents = [
      { agent: new RouterAgent(), expectedNetwork: 'RESTRICTED', expectedFS: 'NO_ACCESS' },
      { agent: new AtenaSearchAgent(), expectedNetwork: 'RESTRICTED', expectedFS: 'READ_ONLY' },
      { agent: new TenthManAgent(), expectedNetwork: 'RESTRICTED', expectedFS: 'READ_ONLY' },
      { agent: new PicoClawAgent(), expectedNetwork: 'RESTRICTED', expectedFS: 'READ_ONLY' },
      { agent: new LiveWebAgent(), expectedNetwork: 'OUTBOUND_ALLOWED', expectedFS: 'NO_ACCESS' },
    ];

    openShellAgents.forEach(({ agent, expectedNetwork, expectedFS }) => {
      describe(agent.name, () => {
        it('should have a named policy', () => {
          const policy = agent.getPolicy();
          expect(policy.name).toBeTruthy();
        });

        it(`should have network=${expectedNetwork}`, () => {
          const policy = agent.getPolicy();
          expect(policy.permissions.network).toBe(expectedNetwork);
        });

        it(`should have fileSystem=${expectedFS}`, () => {
          const policy = agent.getPolicy();
          expect(policy.permissions.fileSystem).toBe(expectedFS);
        });

        it('should have positive resource limits', () => {
          const policy = agent.getPolicy();
          expect(policy.resourceLimits.maxTokens).toBeGreaterThan(0);
          expect(policy.resourceLimits.timeoutMs).toBeGreaterThan(0);
        });
      });
    });
  });

  // Agents with legacy policy (allowedModels, maxTokens, sandboxLevel)
  describe('Legacy Policy Schema Agents', () => {
    const legacyAgents = [
      new MindMapAgent(),
      new MemoryAgent(),
      new SocialAgent(),
      new IngestAgent(),
    ];

    legacyAgents.forEach(agent => {
      describe(agent.name, () => {
        it('should have a policy object', () => {
          const policy = agent.getPolicy();
          expect(policy).toBeDefined();
        });

        // These agents use a different (internal) policy format.
        // We verify they at least have the policy accessible.
        it('should expose policy via getPolicy()', () => {
          expect(typeof agent.getPolicy).toBe('function');
          const result = agent.getPolicy();
          expect(result).not.toBeNull();
        });
      });
    });
  });

  describe('RouterAgent specifics', () => {
    it('should have ultra-fast timeout (<=5s)', () => {
      const agent = new RouterAgent();
      expect(agent.getPolicy().resourceLimits.timeoutMs).toBeLessThanOrEqual(5000);
    });

    it('should have low maxTokens for classification', () => {
      const agent = new RouterAgent();
      expect(agent.getPolicy().resourceLimits.maxTokens).toBeLessThanOrEqual(200);
    });
  });

  describe('LiveWebAgent specifics', () => {
    it('should have OUTBOUND_ALLOWED for Perplexity API', () => {
      const agent = new LiveWebAgent();
      expect(agent.getPolicy().permissions.network).toBe('OUTBOUND_ALLOWED');
    });
  });
});
