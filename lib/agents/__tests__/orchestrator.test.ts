import { AgentOrchestrator } from '../orchestrator';
import { BaseAgent, AgentContext } from '../base-agent';
import { DecisionOutput } from '../decision-agent';
import { ResearchOutput } from '../research-agent';
import { ValidationOutput } from '../validation-agent';

// Mock agents for testing
class MockDecisionAgent extends BaseAgent<string, DecisionOutput> {
  protected async run(): Promise<any> {
    return this.success({
      needsResearch: false,
      reasoning: 'Test reasoning',
      promptComplexity: 'moderate',
      requiredDataTypes: [],
    });
  }
}

class MockContentAgent extends BaseAgent<any, any> {
  protected async run(): Promise<any> {
    return this.success({
      title: 'Test Presentation',
      slides: Array.from({ length: 8 }, (_, i) => ({
        id: `slide_${i + 1}`,
        type: i === 0 ? 'hero' : 'content',
        layout: 'centered',
        content: `Content for slide ${i + 1}`,
      })),
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    });
  }
}

class MockValidationAgent extends BaseAgent<any, ValidationOutput> {
  protected async run(): Promise<any> {
    return this.success({
      isValid: true,
      errors: [],
    });
  }
}

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    const decisionAgent = new MockDecisionAgent('MockDecisionAgent');
    const contentAgent = new MockContentAgent('MockContentAgent');
    const validationAgent = new MockValidationAgent('MockValidationAgent');

    orchestrator = new AgentOrchestrator(
      decisionAgent,
      undefined, // No research agent for this test
      contentAgent,
      validationAgent,
      undefined, // No correction agent for this test
      undefined // No structure agent for this test
    );
  });

  it('should execute full workflow successfully', async () => {
    const result = await orchestrator.execute('Test prompt', [], undefined);

    expect(result.success).toBe(true);
    expect(result.deck).toBeDefined();
    expect(result.deck.slides.length).toBeGreaterThanOrEqual(8);
    expect(result.executionLog.length).toBeGreaterThan(0);
    expect(result.metrics.totalTime).toBeGreaterThan(0);
  });

  it('should log execution steps', async () => {
    const result = await orchestrator.execute('Test prompt', [], undefined);

    expect(result.executionLog.length).toBeGreaterThan(0);
    expect(result.executionLog.some((log) => log.agent === 'decision')).toBe(true);
    expect(result.executionLog.some((log) => log.agent === 'content')).toBe(true);
    expect(result.executionLog.some((log) => log.agent === 'validation')).toBe(true);
  });

  it('should track metrics', async () => {
    const result = await orchestrator.execute('Test prompt', [], undefined);

    expect(result.metrics).toBeDefined();
    expect(result.metrics.totalTime).toBeGreaterThan(0);
    expect(result.metrics.decisionTime).toBeGreaterThanOrEqual(0);
    expect(result.metrics.contentTime).toBeGreaterThanOrEqual(0);
    expect(result.metrics.validationTime).toBeGreaterThanOrEqual(0);
  });
});
