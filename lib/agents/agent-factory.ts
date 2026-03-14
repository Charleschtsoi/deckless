/**
 * Agent Factory - Creates and configures all agents
 * Centralized agent initialization
 */

import { DecisionAgent } from './decision-agent';
import { ResearchAgent } from './research-agent';
import { ContentAgent } from './content-agent';
import { ValidationAgent } from './validation-agent';
import { CorrectionAgent } from './correction-agent';
import { StructureAgent } from './structure-agent';
import { AgentOrchestrator } from './orchestrator';

export function createAgentOrchestrator(apiKey: string): AgentOrchestrator {
  // Create all agents
  const decisionAgent = new DecisionAgent(apiKey);
  const researchAgent = new ResearchAgent(apiKey);
  const contentAgent = new ContentAgent(apiKey);
  const validationAgent = new ValidationAgent();
  const correctionAgent = new CorrectionAgent(apiKey);
  const structureAgent = new StructureAgent();

  // Create orchestrator
  return new AgentOrchestrator(
    decisionAgent,
    researchAgent,
    contentAgent,
    validationAgent,
    correctionAgent,
    structureAgent
  );
}
