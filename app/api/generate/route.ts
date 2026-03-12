import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateSlideDeck } from '@/lib/schemas/deck-schema';
import { getPresetById, getDefaultPreset } from '@/lib/presets/style-presets';

/**
 * LLM Provider abstraction
 */
interface LLMProvider {
  generateDeck(prompt: string, images: ImageData[], stylePreset?: { theme: any }): Promise<unknown>;
}

interface ImageData {
  base64: string;
  name: string;
  mimeType: string;
}

/**
 * Build system prompt for LLM to act as professional consultant
 */
function buildSystemPrompt(userPrompt: string, imageCount: number): string {
  return `You are a professional consultant from Accenture/IBM with expertise in creating compelling business presentations.

Your task is to create a comprehensive, professional presentation deck based on the user's request.

CRITICAL REQUIREMENTS:
1. Generate AT LEAST 8 slides (aim for 8-12 slides for optimal presentation flow)
2. Follow professional consulting presentation structure:
   - Slide 1: Title/Cover slide with main topic
   - Slide 2: Executive Summary or Agenda
   - Slides 3-6: Main content sections (Problem Statement, Solution, Benefits, Approach)
   - Slide 7: Key Takeaways or Recommendations
   - Slide 8: Next Steps or Call to Action
3. Each slide must be optimized for MOBILE VERTICAL SCROLLING:
   - Content should be concise and speakable (not dense text)
   - Use clear visual hierarchy
   - Ensure text is readable on mobile screens
   - Design for presenters to slowly walk through ideas verbally
4. Content should be suitable for verbal presentation - use bullet points, key phrases, and talking points rather than paragraphs
5. Map uploaded images to relevant slides using the imageRef field (if images are provided)

CRITICAL CONTENT LENGTH REQUIREMENTS:
- Each slide should have MAXIMUM 3-5 bullet points
- Each bullet point should be 10-15 words maximum
- Total content per slide should not exceed 80 words
- Use short, punchy phrases - NOT full sentences
- Prioritize key information - remove filler words
- Be concise and impactful - every word must add value

RESEARCH REQUIREMENTS:
- Conduct thorough research on the topic using your knowledge base
- Search for and include relevant statistics, trends, industry data, and current information
- Provide real-world examples, case studies, and best practices where applicable
- Fill slides with substantive, informative content based on research - NOT placeholder text
- Include specific numbers, percentages, and data points when relevant
- Reference industry standards, benchmarks, or frameworks when appropriate
- Ensure all information is accurate and reflects current best practices
- Make each slide informative and valuable - users should learn something from each slide

CONTENT ENRICHMENT STRATEGY:
When the user provides a simple prompt (e.g., "coffee shop pitch", "new app idea", "product launch"), you MUST expand it into comprehensive content:

1. EXPAND THE TOPIC:
   - Research the industry/market (size, growth, trends)
   - Identify target audience demographics and behaviors
   - Analyze competitive landscape
   - Find relevant statistics and market data
   - Include location-specific insights if location is mentioned

2. FILL CONTENT GAPS:
   For each bullet point, ensure:
   - Specificity: Instead of "improve efficiency", say "reduce processing time by 40%"
   - Context: Include industry benchmarks (e.g., "industry average is X, we target Y")
   - Examples: Reference similar successful implementations
   - Data: Include statistics, percentages, numbers, dates

3. RESEARCH INTEGRATION EXAMPLES:
   Simple prompt: "coffee shop pitch"
   Expanded content should include:
   - Market size: "Global coffee market valued at $465B, growing at 5.5% CAGR"
   - Location insights: "Mong Kok has 200+ coffee shops, average daily footfall of 50K"
   - Competition: "Top 3 competitors hold 40% market share"
   - Financials: "Average coffee shop revenue: $15K/month, break-even at 6 months"
   - Trends: "Cold brew segment growing 25% annually"

4. CONTENT DEPTH LEVELS:
   - Level 1 (BAD): "• Improve efficiency • Reduce costs • Better service"
   - Level 2 (GOOD): "• Improve efficiency by 30% • Reduce costs by $10K monthly • Increase customer satisfaction"
   - Level 3 (EXCELLENT): "• Improve efficiency by 30% through automation (industry benchmark: 15%) • Reduce operational costs by $10K monthly, achieving ROI in 8 months • Increase customer satisfaction from 3.2 to 4.5 stars based on pilot data"

   TARGET: Level 3 (EXCELLENT) for ALL slides

${buildDetailedSlideInstructions()}

USER REQUEST: ${userPrompt}
${imageCount > 0 ? `\nIMAGES PROVIDED: ${imageCount} image(s) - incorporate these into relevant slides where appropriate.` : ''}

Return a JSON object matching this exact structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "id": "slide_1",
      "type": "hero",
      "title": "Slide Title",
      "content": "Main content as a STRING - use bullet points separated by newlines (\\n). Make this comprehensive and detailed with specific data, examples, and actionable insights.",
      "layout": "centered",
      "imageRef": "optional_image_reference_string_or_omit_if_not_needed",
      "speakerNotes": "Optional: Additional context for presenter",
      "keyPoints": ["Optional: Array of key points"],
      "dataPoints": {"Optional": "Supporting data/metrics"}
    }
  ],
  "theme": {
    "primaryColor": "#hexcolor",
    "secondaryColor": "#hexcolor",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "system-ui"
  }
}

CRITICAL FIELD REQUIREMENTS:
- "content" MUST be a STRING, NOT an array. Use newlines (\\n) to separate bullet points.
  Example: "• Point 1\\n• Point 2\\n• Point 3"
- "imageRef" MUST be a STRING if provided, or OMIT the field entirely if not needed. Do NOT use null.
- "title" is optional - omit if not needed, do not use null.

CRITICAL: Valid slide types (MUST use exactly these strings):
- "hero" - for title/cover slides
- "content" - for general content slides
- "features" - for feature/product highlights
- "pricing" - for pricing information
- "testimonial" - for testimonials/reviews
- "cta" - for call-to-action slides

CRITICAL: Valid layout types (MUST use exactly these strings):
- "centered" - centered content layout
- "split" - split screen layout
- "grid" - grid layout

You MUST use only these exact string values. Do not invent new types or layouts.

IMPORTANT JSON OUTPUT REQUIREMENTS:
- The "content" field should be CONCISE and IMPACTFUL - aim for 3-5 bullet points per slide maximum
- Each bullet point: 10-15 words maximum, short punchy phrases
- Total words per slide: Maximum 80 words
- Include speakerNotes when helpful for presenter context
- Include keyPoints array to highlight main takeaways
- Include dataPoints object with supporting metrics/data
- All content should be Level 3 (Excellent) quality - specific, data-driven, actionable, but CONCISE
- NO generic placeholder text - every element should add value
- Prioritize brevity while maintaining impact - remove filler words

CRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text before or after the JSON. The response must be parseable JSON that matches the exact structure specified above.
`;
}

/**
 * Build detailed slide-by-slide content instructions
 * Provides comprehensive guidance for each slide type with content requirements and examples
 */
function buildDetailedSlideInstructions(): string {
  return `
DETAILED SLIDE-BY-SLIDE CONTENT INSTRUCTIONS:

SLIDE 1 - HERO/TITLE SLIDE:
Required Content:
- Compelling title (8-12 words) that captures main value proposition
- Subtitle or tagline (10-15 words) describing key value proposition
- Optional: Key metric or hook (e.g., "Serving 10,000+ customers daily")

Content Depth Level: EXCELLENT (Level 3)
- Title should be specific and compelling, not generic
- Include quantifiable metrics when relevant
- Use action-oriented language

Example Good Content:
Title: "Revolutionizing Coffee Culture in Mong Kok"
Content: "A premium coffee experience combining local heritage with global innovation • Targeting 15% market share in first year • $2M projected revenue"

SLIDE 2 - EXECUTIVE SUMMARY:
Required Content:
- 4-6 key points, each with:
  * Specific objective (not generic)
  * Quantifiable outcome
  * Timeline reference
  * Supporting context

Content Depth Level: EXCELLENT (Level 3)
- Each point should be specific and actionable
- Include metrics, percentages, or data where relevant
- Reference industry benchmarks when applicable

Example Good Content:
"• Market Opportunity: Mong Kok coffee market valued at $50M, growing 12% annually
• Target Market: 25-45 year old professionals, 200,000+ potential customers
• Competitive Advantage: Unique fusion menu + tech-enabled ordering system
• Financial Projection: Break-even in 8 months, $500K profit Year 1
• Strategic Partnerships: 3 confirmed local suppliers, 2 tech integrations
• Launch Timeline: Q2 2024, with 6-month pre-launch marketing campaign"

SLIDE 3 - PROBLEM STATEMENT:
Required Content:
- Detailed problem description with impact quantification
- Current challenges identified (specific, not generic)
- Business impact (quantified with numbers/percentages)
- Why this matters now (contextualized)

Content Depth Level: EXCELLENT (Level 3)
- Problem should be specific to the user's situation
- Include industry context and benchmarks
- Quantify impact with data

Example Good Content:
"• Current Challenge: Processing 500+ orders daily with 2-hour average wait time
• Business Impact: $50K monthly lost revenue from customer frustration
• Market Context: Industry standard is 1-hour processing, we're at 3 hours
• Why Now: Customer expectations shifted to instant gratification, 85% expect same-day delivery"

SLIDE 4 - SOLUTION/FEATURES:
Required Content:
- Comprehensive solution breakdown with components
- How it addresses the problem (specific mechanisms)
- Key differentiators (what makes this unique)
- Technical approach (high-level, not implementation details)

Content Depth Level: EXCELLENT (Level 3)
- Solution should be comprehensive but clear
- Include specific components/features
- Reference similar solutions for context

Example Good Content:
"• Solution Overview: AI-powered ordering system reducing wait times by 80%
• Key Components:
  - Real-time inventory tracking
  - Predictive ordering algorithms  
  - Mobile app for on-the-go ordering
• Differentiator: Only solution combining heritage recipes with AI personalization
• Technical Approach: Cloud-based microservices architecture"

SLIDE 5 - BENEFITS:
Required Content:
- Specific, quantifiable benefits with supporting data
- Each benefit should be:
  * Clear value proposition
  * Quantifiable metric (e.g., "Reduce costs by 30%")
  * Supporting context

Content Depth Level: EXCELLENT (Level 3)
- Benefits should be specific and measurable
- Include ROI projections, cost savings, efficiency gains
- Reference industry benchmarks

Example Good Content:
"• Benefit 1: Improved Efficiency - Reduce order processing time from 3 hours to 30 minutes (quantified)
• Benefit 2: Cost Reduction - Save $15K monthly on reduced waste (with data)
• Benefit 3: Enhanced Value - Increase customer satisfaction by 40% (with survey data)
• Benefit 4: Scalability - Handle 10x growth without linear cost increase"

SLIDE 6 - IMPLEMENTATION APPROACH:
Required Content:
- Detailed phased approach with timelines
- Each phase should include:
  * Specific activities
  * Deliverables
  * Timeline (dates/milestones)
  * Resources required

Content Depth Level: EXCELLENT (Level 3)
- Approach should be actionable and realistic
- Include specific milestones
- Reference similar implementations for context

Example Good Content:
"• Phase 1: Planning & Setup (Weeks 1-2)
  - Market research and competitive analysis
  - Team assembly and tool selection
  - Technical architecture design
• Phase 2: Execution (Months 3-6)
  - Pilot launch with 3 locations
  - User training and adoption support
  - Performance monitoring and optimization
• Phase 3: Review & Optimization (Month 7+)
  - Data analysis and insights
  - Scaling plan development
  - Continuous improvement roadmap"

SLIDE 7 - KEY TAKEAWAYS:
Required Content:
- Actionable insights with supporting rationale
- Each takeaway should be:
  * Specific and memorable
  * Supported by data or examples
  * Action-oriented

Content Depth Level: EXCELLENT (Level 3)
- Takeaways should be memorable and actionable
- Include supporting data/examples
- Make each point stand alone

Example Good Content:
"• Key Insight 1: AI personalization drives 3x higher engagement (with A/B test data)
• Key Insight 2: Mobile-first approach captures 60% of orders (industry data)
• Key Insight 3: Phased rollout minimizes risk - 85% success rate in pilot phase"

SLIDE 8 - NEXT STEPS / CALL TO ACTION:
Required Content:
- Specific, time-bound action items
- Each action should include:
  * Owner/responsibility
  * Timeline (specific dates)
  * Success metrics

Content Depth Level: EXCELLENT (Level 3)
- Steps should be immediately actionable
- Include specific owners and dates
- Make outcomes measurable

Example Good Content:
"• Immediate Action 1: Finalize supplier contracts (By: [Date], Owner: [Name]
• Action 2: Deploy pilot system (By: [Date], Success Metric: 3 locations live
• Action 3: Begin user training (By: [Date], Target: 500 users trained
• Timeline: Full launch by [Date]
• Expected Outcomes: 10K orders processed daily, 95% satisfaction rate"

CONTENT QUALITY STANDARDS:
- NO placeholder text like "Lorem ipsum", "Sample content", or generic statements
- Every bullet point should add value and be specific
- Content should be research-driven, not generic
- Include industry context, benchmarks, or real examples where relevant
- Make each slide informative and valuable
- Content depth should match Level 3 (Excellent) for all slides
`;
}

/**
 * Claude (Anthropic) Provider
 */
class ClaudeProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[]): Promise<unknown> {
    // TODO: Implement Claude API integration
    // This is a stub that returns a sample deck structure with 8+ slides
    const systemPrompt = buildSystemPrompt(prompt, images.length);
    
    // Generate sample slides following consultant structure
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    
    return {
      title: title || 'Professional Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: title || 'Presentation Title',
          content: 'Welcome to this professional presentation',
          layout: 'centered',
        },
        {
          id: 'slide_2',
          type: 'content',
          title: 'Executive Summary',
          content: '• Overview of key objectives\n• Strategic approach\n• Expected outcomes',
          layout: 'centered',
        },
        {
          id: 'slide_3',
          type: 'content',
          title: 'Problem Statement',
          content: '• Current challenges identified\n• Impact on business\n• Why this matters now',
          layout: 'centered',
        },
        {
          id: 'slide_4',
          type: 'features',
          title: 'Proposed Solution',
          content: '• Solution overview\n• Key components\n• How it addresses the problem',
          layout: 'centered',
        },
        {
          id: 'slide_5',
          type: 'content',
          title: 'Key Benefits',
          content: '• Benefit 1: Improved efficiency\n• Benefit 2: Cost reduction\n• Benefit 3: Enhanced value',
          layout: 'grid',
        },
        {
          id: 'slide_6',
          type: 'content',
          title: 'Implementation Approach',
          content: '• Phase 1: Planning and setup\n• Phase 2: Execution\n• Phase 3: Review and optimization',
          layout: 'centered',
        },
        {
          id: 'slide_7',
          type: 'content',
          title: 'Key Takeaways',
          content: '• Main point 1\n• Main point 2\n• Main point 3',
          layout: 'centered',
        },
        {
          id: 'slide_8',
          type: 'cta',
          title: 'Next Steps',
          content: '• Immediate actions required\n• Timeline and milestones\n• Expected outcomes',
          layout: 'centered',
        },
      ],
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };
  }
}

/**
 * GPT (OpenAI) Provider
 */
class GPTProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[], stylePreset?: { theme: any }): Promise<unknown> {
    // TODO: Implement OpenAI API integration
    // This is a stub that returns a sample deck structure with 8+ slides
    const systemPrompt = buildSystemPrompt(prompt, images.length);
    
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    
    const theme = stylePreset?.theme || {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    };
    
    return {
      title: title || 'Professional Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: title || 'Presentation Title',
          content: 'Welcome to this professional presentation',
          layout: 'centered',
        },
        {
          id: 'slide_2',
          type: 'content',
          title: 'Executive Summary',
          content: '• Overview of key objectives\n• Strategic approach\n• Expected outcomes',
          layout: 'centered',
        },
        {
          id: 'slide_3',
          type: 'content',
          title: 'Problem Statement',
          content: '• Current challenges identified\n• Impact on business\n• Why this matters now',
          layout: 'centered',
        },
        {
          id: 'slide_4',
          type: 'features',
          title: 'Proposed Solution',
          content: '• Solution overview\n• Key components\n• How it addresses the problem',
          layout: 'centered',
        },
        {
          id: 'slide_5',
          type: 'content',
          title: 'Key Benefits',
          content: '• Benefit 1: Improved efficiency\n• Benefit 2: Cost reduction\n• Benefit 3: Enhanced value',
          layout: 'grid',
        },
        {
          id: 'slide_6',
          type: 'content',
          title: 'Implementation Approach',
          content: '• Phase 1: Planning and setup\n• Phase 2: Execution\n• Phase 3: Review and optimization',
          layout: 'centered',
        },
        {
          id: 'slide_7',
          type: 'content',
          title: 'Key Takeaways',
          content: '• Main point 1\n• Main point 2\n• Main point 3',
          layout: 'centered',
        },
        {
          id: 'slide_8',
          type: 'cta',
          title: 'Next Steps',
          content: '• Immediate actions required\n• Timeline and milestones\n• Expected outcomes',
          layout: 'centered',
        },
      ],
      theme,
    };
  }
}

/**
 * Generate fallback deck from text when JSON parsing fails
 */
function generateFallbackDeck(text: string, prompt: string, stylePreset?: { theme: any }): any {
  const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt || 'Generated Presentation';
  
  // Try to extract useful information from the text
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const bulletPoints = lines.filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
  
  // Create slides from extracted content
  const slides = [];
  const slideTitles = [
    'Introduction',
    'Executive Summary',
    'Problem Statement',
    'Solution Overview',
    'Key Benefits',
    'Implementation Plan',
    'Key Takeaways',
    'Next Steps',
  ];
  
  // Distribute content across 8 slides
  const contentPerSlide = Math.max(3, Math.ceil(bulletPoints.length / 8));
  
  for (let i = 0; i < 8; i++) {
    const startIdx = i * contentPerSlide;
    const endIdx = Math.min(startIdx + contentPerSlide, bulletPoints.length);
    const slideContent = bulletPoints.slice(startIdx, endIdx);
    
    // If no bullet points, use text lines
    const content = slideContent.length > 0
      ? slideContent.join('\n')
      : lines.slice(startIdx * 2, endIdx * 2).join('\n') || `Content for ${slideTitles[i]}`;
    
    slides.push({
      id: `slide_${i + 1}`,
      type: i === 0 ? 'hero' : i === 7 ? 'cta' : 'content',
      title: slideTitles[i],
      content: content.substring(0, 500), // Limit content length
      layout: 'centered',
    });
  }
  
  const theme = stylePreset?.theme || {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'system-ui',
  };
  
  return {
    title,
    slides,
    theme,
  };
}

/**
 * Gemini (Google) Provider
 */
class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[], stylePreset?: { theme: any }): Promise<unknown> {
    const systemPrompt = buildSystemPrompt(prompt, images.length);
    
    // Validate API key
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error('Google API key is not configured. Please set GOOGLE_API_KEY in your .env file.');
    }
    
    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Use gemini-2.5-flash - better at structured JSON output and vision tasks
      // Supports both text and images
      const modelName = 'gemini-2.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log('Calling Gemini API with model:', modelName);
      console.log('Prompt length:', systemPrompt.length);
      console.log('Images count:', images.length);

      // Prepare content parts
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: systemPrompt }
      ];

      // Add images if provided
      if (images.length > 0) {
        for (const image of images) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.base64,
            },
          });
        }
      }

      // Generate content
      // Try multiple formats - Gemini SDK supports both
      let result;
      try {
        // Format 1: Direct parts array (simpler)
        result = await model.generateContent(parts);
      } catch (formatError: any) {
        console.log('Direct parts format failed, trying contents format:', formatError.message);
        // Format 2: Wrapped in contents array
        result = await model.generateContent({
          contents: [{ role: 'user', parts }],
        });
      }

      const response = await result.response;
      
      // Check for errors in the response
      if (!response) {
        throw new Error('No response received from Gemini API');
      }
      
      // Check for blocked content or safety issues
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        const finishReason = response.promptFeedback?.blockReason || 'unknown';
        throw new Error(`Gemini API blocked the response. Reason: ${finishReason}. The content may violate safety policies.`);
      }
      
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response received from Gemini API');
      }
      
      console.log('Gemini API response received, length:', text.length);
      console.log('Raw response preview (first 500 chars):', text.substring(0, 500));

      // Robust JSON extraction with multiple fallback strategies
      let deck: any = null;
      let parseSuccess = false;
      
      // Strategy 1: Try parsing the entire text as JSON
      try {
        deck = JSON.parse(text.trim());
        parseSuccess = true;
        console.log('Strategy 1 succeeded: Direct JSON parse');
      } catch (e) {
        console.log('Strategy 1 failed, trying Strategy 2...');
      }
      
      // Strategy 2: Extract JSON from markdown code blocks
      if (!parseSuccess) {
        try {
          let jsonText = text.trim();
          // Remove markdown code blocks
          jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');
          
          // Try to find JSON object
          const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
          if (jsonMatch) {
            deck = JSON.parse(jsonMatch[1]);
            parseSuccess = true;
            console.log('Strategy 2 succeeded: Extracted from markdown');
          }
        } catch (e) {
          console.log('Strategy 2 failed, trying Strategy 3...');
        }
      }
      
      // Strategy 3: Try to fix common JSON issues and parse
      if (!parseSuccess) {
        try {
          let jsonText = text.trim();
          // Remove markdown
          jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');
          
          // Fix common JSON issues
          jsonText = jsonText
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
            .replace(/:\s*undefined/g, ': null') // Replace undefined with null
            .replace(/:\s*null(\s*[,}])/g, ':$1'); // Remove null values for optional fields
          
          const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
          if (jsonMatch) {
            deck = JSON.parse(jsonMatch[1]);
            parseSuccess = true;
            console.log('Strategy 3 succeeded: Fixed JSON issues');
          }
        } catch (e) {
          console.log('Strategy 3 failed, trying Strategy 4...');
        }
      }
      
      // Strategy 4: Try to extract array if response is an array
      if (!parseSuccess) {
        try {
          const arrayMatch = text.match(/(\[[\s\S]*\])/);
          if (arrayMatch) {
            const array = JSON.parse(arrayMatch[1]);
            // Convert array to deck structure
            deck = {
              title: prompt.substring(0, 50) || 'Generated Presentation',
              slides: array.map((item: any, index: number) => ({
                id: `slide_${index + 1}`,
                type: item.type || 'content',
                title: item.title || '',
                content: Array.isArray(item.content) ? item.content.join('\n') : String(item.content || ''),
                layout: item.layout || 'centered',
              })),
            };
            parseSuccess = true;
            console.log('Strategy 4 succeeded: Converted array to deck');
          }
        } catch (e) {
          console.log('Strategy 4 failed, using fallback generator...');
        }
      }
      
      // Strategy 5: Fallback - Generate deck from text content
      if (!parseSuccess) {
        console.warn('All JSON parsing strategies failed, generating fallback deck from text');
        deck = generateFallbackDeck(text, prompt, stylePreset);
        console.log('Fallback deck generated');
      }

      // Log the parsed deck structure for debugging
      console.log('Parsed deck structure:', {
        title: deck.title,
        slideCount: deck.slides?.length,
        slideTypes: deck.slides?.map((s: any) => s.type),
      });

      // Normalize and fix slide data before validation
      if (deck.slides && Array.isArray(deck.slides)) {
        const validTypes = ['hero', 'content', 'features', 'pricing', 'testimonial', 'cta'];
        const validLayouts = ['centered', 'split', 'grid'];
        
        deck.slides = deck.slides.map((slide: any, index: number) => {
          const normalizedSlide: any = { ...slide };
          
          // Fix invalid slide types
          if (!validTypes.includes(slide.type)) {
            console.warn(`Invalid slide type "${slide.type}" at index ${index}, defaulting to "content"`);
            // Map common invalid types to valid ones
            if (slide.type?.toLowerCase().includes('title') || slide.type?.toLowerCase().includes('cover')) {
              normalizedSlide.type = 'hero';
            } else if (slide.type?.toLowerCase().includes('feature')) {
              normalizedSlide.type = 'features';
            } else if (slide.type?.toLowerCase().includes('action') || slide.type?.toLowerCase().includes('next')) {
              normalizedSlide.type = 'cta';
            } else {
              normalizedSlide.type = 'content';
            }
          }
          
          // Fix invalid layouts
          if (!validLayouts.includes(slide.layout)) {
            console.warn(`Invalid layout "${slide.layout}" at index ${index}, defaulting to "centered"`);
            normalizedSlide.layout = 'centered';
          }
          
          // Normalize content: convert arrays to strings
          if (Array.isArray(slide.content)) {
            console.log(`Slide ${index} content is an array, converting to string`);
            normalizedSlide.content = slide.content
              .map((item: any) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                  // Handle objects like {text: "...", bullet: true}
                  return item.text || item.content || JSON.stringify(item);
                }
                return String(item);
              })
              .filter((item: any) => item && item.trim().length > 0)
              .join('\n');
          } else if (typeof slide.content !== 'string') {
            // Convert non-string content to string
            console.log(`Slide ${index} content is not a string (${typeof slide.content}), converting`);
            normalizedSlide.content = String(slide.content || '');
          }
          
          // Normalize imageRef: convert null to undefined (remove property)
          if (slide.imageRef === null || slide.imageRef === undefined) {
            delete normalizedSlide.imageRef;
          } else if (typeof slide.imageRef !== 'string') {
            // Convert non-string imageRef to string or remove
            if (slide.imageRef) {
              normalizedSlide.imageRef = String(slide.imageRef);
            } else {
              delete normalizedSlide.imageRef;
            }
          }
          
          // Ensure required fields exist
          if (!normalizedSlide.id) {
            normalizedSlide.id = `slide_${index + 1}`;
          }
          
          return normalizedSlide;
        });
        
        console.log('Normalized slides:', deck.slides.map((s: any) => ({
          id: s.id,
          type: s.type,
          layout: s.layout,
          contentType: typeof s.content,
          contentLength: s.content?.length,
          hasImageRef: s.imageRef !== undefined,
        })));
      }

      // Apply style preset theme if provided
      const theme = stylePreset?.theme || {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      };

      // Ensure theme is applied
      if (!deck.theme) {
        deck.theme = theme;
      } else {
        // Merge theme properties
        deck.theme = { ...theme, ...deck.theme };
      }

      // Ensure slides have IDs if not provided
      if (deck.slides && Array.isArray(deck.slides)) {
        deck.slides = deck.slides.map((slide: any, index: number) => ({
          ...slide,
          id: slide.id || `slide_${index + 1}`,
        }));
      }

      return deck;
    } catch (error: any) {
      // Enhanced error logging
      console.error('Gemini API error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        code: error?.code,
        stack: error?.stack,
        cause: error?.cause,
        response: error?.response,
      });
      
      // Log the full error object for debugging
      try {
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (e) {
        console.error('Could not stringify error:', e);
      }
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        const errorCode = (error as any).code;
        const status = (error as any).status;
        
        // Authentication errors
        if (
          errorMessage.includes('api_key_invalid') ||
          errorMessage.includes('invalid api key') ||
          errorMessage.includes('401') ||
          status === 401 ||
          errorCode === '401'
        ) {
          throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY in the .env file.');
        }
        
        // Rate limit errors
        if (
          errorMessage.includes('429') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('quota') ||
          status === 429 ||
          errorCode === '429'
        ) {
          throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
        }
        
        // Quota exceeded errors
        if (
          errorMessage.includes('quota') ||
          errorMessage.includes('quota exceeded') ||
          errorMessage.includes('resource_exhausted')
        ) {
          throw new Error('Gemini API quota exceeded. Please check your API usage limits.');
        }
        
        // Network errors
        if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('econnrefused') ||
          errorCode === 'ECONNREFUSED'
        ) {
          throw new Error('Network error connecting to Gemini API. Please check your internet connection.');
        }
        
        // Timeout errors
        if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out') ||
          errorCode === 'ETIMEDOUT'
        ) {
          throw new Error('Request to Gemini API timed out. Please try again.');
        }
        
        // Invalid request errors
        if (
          errorMessage.includes('400') ||
          errorMessage.includes('bad request') ||
          status === 400 ||
          errorCode === '400'
        ) {
          throw new Error('Invalid request to Gemini API. Please check your input and try again.');
        }
        
        // Permission errors
        if (
          errorMessage.includes('403') ||
          errorMessage.includes('forbidden') ||
          errorMessage.includes('permission') ||
          status === 403 ||
          errorCode === '403'
        ) {
          throw new Error('Permission denied. Please check your API key permissions.');
        }
        
        // Server errors
        if (
          errorMessage.includes('500') ||
          errorMessage.includes('internal server error') ||
          status === 500 ||
          errorCode === '500'
        ) {
          throw new Error('Gemini API server error. Please try again later.');
        }
        
        // Re-throw with original message if it's a known error type
        throw error;
      }
      
      // Unknown error type
      throw new Error(
        `Failed to generate presentation with Gemini API: ${error?.message || 'Unknown error'}`
      );
    }
  }
}

/**
 * Get LLM provider based on environment configuration
 */
function getLLMProvider(): LLMProvider | null {
  const provider = (process.env.LLM_PROVIDER || 'claude').toLowerCase();
  let apiKey: string | undefined;

  switch (provider) {
    case 'claude':
      apiKey = process.env.CLAUDE_API_KEY;
      if (apiKey) return new ClaudeProvider(apiKey);
      break;
    case 'gpt':
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) return new GPTProvider(apiKey);
      break;
    case 'gemini':
    case 'google':
      apiKey = process.env.GOOGLE_API_KEY;
      if (apiKey) return new GeminiProvider(apiKey);
      break;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const stylePresetId = (formData.get('stylePresetId') as string) || 'minimalist';

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get style preset
    const stylePreset = getPresetById(stylePresetId) || getDefaultPreset();

    // Extract images from form data
    const images: ImageData[] = [];
    let index = 0;
    while (formData.has(`image_${index}`)) {
      const base64 = formData.get(`image_${index}`) as string;
      const name = (formData.get(`image_${index}_name`) as string) || `image_${index}`;
      const mimeType = (formData.get(`image_${index}_mime`) as string) || 'image/jpeg';
      
      images.push({ base64, name, mimeType });
      index++;
    }

    // Get LLM provider
    const provider = getLLMProvider();
    if (!provider) {
      return NextResponse.json(
        { error: 'LLM provider not configured. Please set LLM_PROVIDER and corresponding API key in environment variables.' },
        { status: 500 }
      );
    }

    // Generate deck
    const rawDeck = await provider.generateDeck(prompt, images, stylePreset);

    // Validate response against schema
    let deck;
    try {
      // Log the raw deck structure before validation for debugging
      console.log('Raw deck before validation:', {
        title: (rawDeck as any)?.title,
        slideCount: (rawDeck as any)?.slides?.length,
        slideTypes: (rawDeck as any)?.slides?.map((s: any) => ({ id: s.id, type: s.type, layout: s.layout })),
      });
      
      deck = validateSlideDeck(rawDeck);
    } catch (validationError: unknown) {
      console.error('Validation error:', validationError);
      
      // Log the actual invalid data for debugging
      if (validationError instanceof Error && validationError.name === 'ZodError') {
        const zodError = validationError as z.ZodError;
        
        // Log detailed validation errors
        console.error('Validation issues:', zodError.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          received: issue.code === 'invalid_enum_value' ? (issue as any).options : undefined,
        })));
        
        // Log the actual invalid values
        zodError.issues.forEach(issue => {
          if (issue.code === 'invalid_enum_value') {
            const invalidValue = (rawDeck as any)?.slides?.[parseInt(issue.path[1] as string)]?.type;
            console.error(`Slide ${issue.path[1]} has invalid type: "${invalidValue}"`);
            console.error(`Valid types are: hero, content, features, pricing, testimonial, cta`);
          }
        });
        
        const errorMessages = zodError.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return NextResponse.json(
          { error: `Invalid deck structure: ${errorMessages}. The LLM must generate at least 8 slides with valid types.` },
          { status: 500 }
        );
      }
      throw validationError;
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error generating deck:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid deck structure returned from LLM. The presentation must have at least 8 slides.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}
