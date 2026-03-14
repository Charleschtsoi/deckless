/**
 * Decision Agent - Inspired by openimpact2's agent_bot.py
 * Analyzes user prompts to determine what actions are needed
 * Shows transparent decision-making with reasoning
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DecisionOutput {
  needsResearch: boolean;
  reasoning: string;
  promptComplexity: 'simple' | 'moderate' | 'complex';
  requiredDataTypes: string[]; // e.g., ['market_size', 'trends', 'statistics']
}

export interface DecisionInput {
  prompt: string;
}

export class DecisionAgent extends BaseAgent<DecisionInput, DecisionOutput> {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    super('DecisionAgent', 2, 500);
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  protected async run(
    input: DecisionInput,
    context?: AgentContext
  ): Promise<AgentResult<DecisionOutput>> {
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.modelName });

      const decisionPrompt = this.buildDecisionPrompt(input.prompt);

      this.log(`[DecisionAgent] Analyzing prompt: "${input.prompt.substring(0, 100)}..."`);

      const result = await model.generateContent(decisionPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        return this.failure('Empty response from LLM');
      }

      // Parse JSON response
      let decision: DecisionOutput;
      try {
        // Try to extract JSON from markdown code blocks or direct JSON
        let jsonText = text.trim();
        jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');
        
        const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          decision = JSON.parse(jsonMatch[1]);
        } else {
          decision = JSON.parse(jsonText);
        }
      } catch (parseError) {
        // Fallback: Use heuristics to determine decision
        this.log('[DecisionAgent] JSON parse failed, using heuristics');
        decision = this.fallbackDecision(input.prompt);
      }

      // Validate decision structure
      if (!decision.needsResearch || typeof decision.needsResearch !== 'boolean') {
        decision.needsResearch = this.shouldNeedResearch(input.prompt);
      }

      if (!decision.reasoning) {
        decision.reasoning = this.generateReasoning(input.prompt, decision.needsResearch);
      }

      if (!decision.promptComplexity) {
        decision.promptComplexity = this.assessComplexity(input.prompt);
      }

      if (!decision.requiredDataTypes || !Array.isArray(decision.requiredDataTypes)) {
        decision.requiredDataTypes = this.inferDataTypes(input.prompt);
      }

      // Log decision with transparent reasoning (like openimpact2)
      this.log(`[DecisionAgent] Decision: ${decision.needsResearch ? 'Research needed' : 'Research not needed'}`);
      this.log(`[DecisionAgent] Reasoning: ${decision.reasoning}`);
      this.log(`[DecisionAgent] Prompt Complexity: ${decision.promptComplexity}`);
      this.log(`[DecisionAgent] Required Data Types: ${decision.requiredDataTypes.join(', ')}`);

      return this.success(decision);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`[DecisionAgent] Error: ${errorMessage}`);
      
      // Fallback to heuristic-based decision
      const fallbackDecision = this.fallbackDecision(input.prompt);
      return this.success(fallbackDecision, { fallback: true, error: errorMessage });
    }
  }

  /**
   * Build decision prompt for LLM
   */
  private buildDecisionPrompt(userPrompt: string): string {
    return `You are an intelligent decision agent that analyzes user prompts to determine what actions are needed for generating a professional presentation.

Analyze the following user prompt and determine:
1. Does this prompt need research/enrichment? (e.g., simple prompts like "coffee shop pitch" need research, while detailed prompts with specific data may not)
2. What is the complexity level of the prompt?
3. What types of data would enhance this presentation?

USER PROMPT: "${userPrompt}"

Return a JSON object with this exact structure:
{
  "needsResearch": true/false,
  "reasoning": "Brief explanation of why research is or isn't needed",
  "promptComplexity": "simple" | "moderate" | "complex",
  "requiredDataTypes": ["market_size", "trends", "statistics", "competition", "financials", etc.]
}

Guidelines:
- Simple prompts (1-5 words, vague): needsResearch = true, complexity = "simple"
- Moderate prompts (6-20 words, some detail): needsResearch = true, complexity = "moderate"  
- Complex prompts (20+ words, specific data included): needsResearch = false, complexity = "complex"
- If prompt mentions specific numbers, statistics, or data: needsResearch = false
- If prompt is generic or lacks detail: needsResearch = true

Return ONLY valid JSON, no explanatory text.`;
  }

  /**
   * Fallback decision using heuristics
   */
  private fallbackDecision(prompt: string): DecisionOutput {
    const needsResearch = this.shouldNeedResearch(prompt);
    const complexity = this.assessComplexity(prompt);
    const dataTypes = this.inferDataTypes(prompt);
    const reasoning = this.generateReasoning(prompt, needsResearch);

    return {
      needsResearch,
      reasoning,
      promptComplexity: complexity,
      requiredDataTypes: dataTypes,
    };
  }

  /**
   * Heuristic: Determine if research is needed
   */
  private shouldNeedResearch(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    const wordCount = prompt.split(/\s+/).length;

    // If prompt is very short or generic, needs research
    if (wordCount <= 5) {
      return true;
    }

    // If prompt contains specific data indicators, may not need research
    const dataIndicators = [
      /\$[\d,]+/g, // Dollar amounts
      /\d+%/g, // Percentages
      /\d{4}/g, // Years
      'statistics',
      'data',
      'research',
      'study',
      'report',
    ];

    const hasData = dataIndicators.some((indicator) => {
      if (typeof indicator === 'string') {
        return lowerPrompt.includes(indicator);
      }
      return indicator.test(prompt);
    });

    // Generic business terms that need research
    const genericTerms = [
      'pitch',
      'idea',
      'proposal',
      'business plan',
      'startup',
      'product launch',
    ];

    const isGeneric = genericTerms.some((term) => lowerPrompt.includes(term));

    // Needs research if generic and lacks specific data
    return isGeneric && !hasData;
  }

  /**
   * Assess prompt complexity
   */
  private assessComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = prompt.split(/\s+/).length;

    if (wordCount <= 5) {
      return 'simple';
    } else if (wordCount <= 20) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }

  /**
   * Infer required data types from prompt
   */
  private inferDataTypes(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const dataTypes: string[] = [];

    if (
      lowerPrompt.includes('market') ||
      lowerPrompt.includes('industry') ||
      lowerPrompt.includes('sector')
    ) {
      dataTypes.push('market_size');
    }

    if (
      lowerPrompt.includes('trend') ||
      lowerPrompt.includes('growth') ||
      lowerPrompt.includes('future')
    ) {
      dataTypes.push('trends');
    }

    if (
      lowerPrompt.includes('competitor') ||
      lowerPrompt.includes('competition') ||
      lowerPrompt.includes('rival')
    ) {
      dataTypes.push('competition');
    }

    if (
      lowerPrompt.includes('revenue') ||
      lowerPrompt.includes('profit') ||
      lowerPrompt.includes('financial') ||
      lowerPrompt.includes('cost') ||
      lowerPrompt.includes('price')
    ) {
      dataTypes.push('financials');
    }

    if (
      lowerPrompt.includes('statistic') ||
      lowerPrompt.includes('data') ||
      lowerPrompt.includes('number')
    ) {
      dataTypes.push('statistics');
    }

    // Default data types if none inferred
    if (dataTypes.length === 0) {
      dataTypes.push('market_size', 'trends', 'statistics');
    }

    return dataTypes;
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(prompt: string, needsResearch: boolean): string {
    const wordCount = prompt.split(/\s+/).length;

    if (needsResearch) {
      if (wordCount <= 5) {
        return `Prompt is very brief (${wordCount} words) and lacks specific details. Research is needed to enrich content with market data, statistics, and industry insights.`;
      } else {
        return `Prompt is generic and lacks specific data points. Research will help add market size, trends, and competitive analysis to create Level 3 quality content.`;
      }
    } else {
      return `Prompt contains sufficient detail (${wordCount} words) or specific data points. Can proceed directly to content generation without additional research.`;
    }
  }
}
