export interface AgentContext {
  history?: { role: string; content: string }[];
  documents?: string; // e.g., retrieved RAG context
  systemMemories?: string;
}

export interface AgentInput {
  query: string;
  context?: AgentContext;
}

export interface AgentOutput {
  success: boolean;
  data: string | object | null;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentPolicy {
  name: string;
  permissions: {
    network: 'BLOCKED' | 'RESTRICTED' | 'OUTBOUND_ALLOWED';
    fileSystem: 'READ_ONLY' | 'READ_WRITE' | 'NO_ACCESS';
  };
  resourceLimits: {
    maxTokens: number;
    timeoutMs: number;
  };
}

export interface Agent {
  name: string;
  description: string;
  execute(input: AgentInput): Promise<AgentOutput>;
  getPolicy(): AgentPolicy;
}
