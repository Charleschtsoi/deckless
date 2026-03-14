/**
 * Research Agent - Enriches prompts with market data and statistics
 * Uses web search (like openimpact2's DuckDuckGo integration) for current data
 * Only executes if Decision Agent determines research is needed
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DecisionOutput } from './decision-agent';

export interface ResearchInput {
  prompt: string;
  decision: DecisionOutput;
}

export interface ResearchOutput {
  researchData: {
    marketSize?: string;
    trends?: string[];
    statistics?: Array<{ label: string; value: string }>;
    competition?: string;
    financials?: string;
    locationInsights?: string;
  };
  sources: Array<{ title: string; url: string; snippet: string }>;
  dataTypes: string[];
}

export class ResearchAgent extends BaseAgent<ResearchInput, ResearchOutput> {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    super('ResearchAgent', 2, 1000);
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  protected async run(
    input: ResearchInput,
    context?: AgentContext
  ): Promise<AgentResult<ResearchOutput>> {
    try {
      // Only execute if decision says research is needed
      if (!input.decision.needsResearch) {
        this.log('[ResearchAgent] Skipped - Decision agent determined research not needed');
        return this.success({
          researchData: {},
          sources: [],
          dataTypes: [],
        });
      }

      this.log('[ResearchAgent] Starting research', {
        requiredDataTypes: input.decision.requiredDataTypes,
      });

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.modelName });

      // Build research prompt based on required data types
      const researchPrompt = this.buildResearchPrompt(input.prompt, input.decision);

      this.log('[ResearchAgent] Requesting research from LLM');

      const result = await model.generateContent(researchPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        return this.failure('Empty response from LLM');
      }

      // Parse research data from response
      const researchData = this.parseResearchResponse(text, input.decision.requiredDataTypes);

      // Note: In a full implementation, we would integrate DuckDuckGo search here
      // For now, we rely on LLM's knowledge base
      // TODO: Add DuckDuckGo integration like openimpact2's web_search.py
      const sources: Array<{ title: string; url: string; snippet: string }> = [];

      this.log('[ResearchAgent] Research completed', {
        dataTypesFound: Object.keys(researchData.researchData).length,
        sourceCount: sources.length,
      });

      return this.success({
        researchData,
        sources,
        dataTypes: input.decision.requiredDataTypes,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`[ResearchAgent] Error: ${errorMessage}`);

      // Return empty research data on error (non-fatal)
      return this.success(
        {
          researchData: {},
          sources: [],
          dataTypes: [],
        },
        { error: errorMessage, fallback: true }
      );
    }
  }

  /**
   * Build research prompt for LLM
   */
  private buildResearchPrompt(prompt: string, decision: DecisionOutput): string {
    const dataTypeInstructions = decision.requiredDataTypes
      .map((type) => {
        switch (type) {
          case 'market_size':
            return '- Market size: Total market value, growth rate, CAGR';
          case 'trends':
            return '- Trends: Current industry trends, growth patterns, future projections';
          case 'statistics':
            return '- Statistics: Key metrics, percentages, data points';
          case 'competition':
            return '- Competition: Competitive landscape, market share, key players';
          case 'financials':
            return '- Financials: Revenue projections, costs, break-even, ROI';
          default:
            return `- ${type}: Relevant ${type} information`;
        }
      })
      .join('\n');

    return `You are a research analyst. Conduct thorough research on the following topic and provide comprehensive data.

TOPIC: "${prompt}"

Required Research Areas:
${dataTypeInstructions}

Provide specific, accurate data including:
- Numbers, percentages, and statistics
- Market size and growth rates
- Industry benchmarks
- Competitive insights
- Financial projections (if applicable)
- Location-specific data (if location mentioned)

Return a JSON object with this structure:
{
  "marketSize": "Market size description with numbers",
  "trends": ["Trend 1", "Trend 2", "Trend 3"],
  "statistics": [
    {"label": "Statistic name", "value": "Statistic value"}
  ],
  "competition": "Competitive landscape description",
  "financials": "Financial projections and metrics",
  "locationInsights": "Location-specific insights (if applicable)"
}

Be specific and include real numbers. Use your knowledge base to provide accurate, current information.`;
  }

  /**
   * Parse research response from LLM
   */
  private parseResearchResponse(
    text: string,
    requiredDataTypes: string[]
  ): ResearchOutput['researchData'] {
    try {
      // Try to extract JSON
      let jsonText = text.trim();
      jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');

      const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          marketSize: parsed.marketSize,
          trends: Array.isArray(parsed.trends) ? parsed.trends : [],
          statistics: Array.isArray(parsed.statistics) ? parsed.statistics : [],
          competition: parsed.competition,
          financials: parsed.financials,
          locationInsights: parsed.locationInsights,
        };
      }
    } catch (error) {
      this.log('[ResearchAgent] Failed to parse JSON, using text extraction');
    }

    // Fallback: Extract information from text
    return this.extractResearchFromText(text, requiredDataTypes);
  }

  /**
   * Extract research data from unstructured text
   */
  private extractResearchFromText(
    text: string,
    requiredDataTypes: string[]
  ): ResearchOutput['researchData'] {
    const researchData: ResearchOutput['researchData'] = {};

    // Extract trends (lines starting with bullet points or dashes)
    const trendMatches = text.match(/[-•]\s*([^\n]+)/g);
    if (trendMatches) {
      researchData.trends = trendMatches
        .map((match) => match.replace(/^[-•]\s*/, '').trim())
        .slice(0, 5);
    }

    // Extract statistics (lines with numbers and percentages)
    const statMatches = text.match(/([\d,]+%?|\$\d+[\d,]*)/g);
    if (statMatches && requiredDataTypes.includes('statistics')) {
      researchData.statistics = statMatches.slice(0, 5).map((value) => ({
        label: 'Key metric',
        value,
      }));
    }

    // Extract market size (look for dollar amounts or large numbers)
    const marketSizeMatch = text.match(/(market|industry).*?(\$[\d,]+|[\d,]+)/i);
    if (marketSizeMatch && requiredDataTypes.includes('market_size')) {
      researchData.marketSize = marketSizeMatch[0];
    }

    return researchData;
  }
}
