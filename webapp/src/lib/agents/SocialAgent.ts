import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentOutput, AgentPolicy } from './types';
import { generateSocialSummary } from '../gemini';

export interface SocialInput extends AgentInput {
  originalQuery: string;
  complexResponse: string;
}

export class SocialAgent extends BaseAgent {
  name = 'SocialAgent';
  description = 'Generates a concise, shareable social summary from a complex legal AI response';
  policy: AgentPolicy = {
    allowedModels: ['gemini-2.5-flash'],
    maxTokens: 1024,
    networkAccess: false,
    sandboxLevel: 'strict',
  };

  protected async performExecution(input: SocialInput): Promise<AgentOutput> {
    const summary = await generateSocialSummary(input.originalQuery, input.complexResponse);

    if (!summary) {
      return { success: false, data: null, error: 'Failed to generate social summary' };
    }

    return { success: true, data: summary };
  }
}
