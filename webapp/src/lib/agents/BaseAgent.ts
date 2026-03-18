import { Agent, AgentInput, AgentOutput, AgentPolicy } from './types';

export abstract class BaseAgent implements Agent {
  abstract name: string;
  abstract description: string;
  
  // Represents a mock YAML/JSON policy that OpenShell would ingest
  abstract policy: AgentPolicy;

  getPolicy(): AgentPolicy {
    return this.policy;
  }

  // Pre-execution hook for OpenShell policy validation simulation
  protected async validatePolicy(input: AgentInput): Promise<void> {
    // In a real OpenShell environment, the NVIDIA runtime would enforce this at the OS/Network level.
    // For now, we simulate basic validation.
    if (!input.query) {
       console.warn(`[OpenShell Mock] ${this.name} warning: Empty query payload.`);
    }
  }

  // Main execution wrapper
  async execute(input: AgentInput): Promise<AgentOutput> {
    try {
      await this.validatePolicy(input);
      const data = await this.performExecution(input);
      return {
        success: true,
        data,
      };
    } catch (error: unknown) {
      console.error(`[Agent ${this.name}] Execution failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown agent execution error';
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    }
  }

  // Abstract method that concrete Agents will implement
  protected abstract performExecution(input: AgentInput): Promise<string | object | null>;
}
