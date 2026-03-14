/**
 * Base Agent class with retry logic, error handling, and logging
 * Provides common functionality for all specialized agents
 */

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  prompt: string;
  images?: Array<{
    base64: string;
    name: string;
    mimeType: string;
    type?: 'image' | 'pdf';
  }>;
  stylePreset?: {
    theme: any;
  };
  [key: string]: any;
}

export abstract class BaseAgent<TInput, TOutput> {
  protected name: string;
  protected maxRetries: number;
  protected retryDelay: number;

  constructor(name: string, maxRetries: number = 3, retryDelay: number = 1000) {
    this.name = name;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Execute the agent with retry logic
   */
  async execute(input: TInput, context?: AgentContext): Promise<AgentResult<TOutput>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.log(`[${this.name}] Attempt ${attempt}/${this.maxRetries}`);
        const result = await this.run(input, context);
        
        if (result.success) {
          this.log(`[${this.name}] Success on attempt ${attempt}`);
          return result;
        }

        // If result indicates failure but no exception, log and retry
        if (result.error) {
          this.log(`[${this.name}] Error: ${result.error}`);
          lastError = new Error(result.error);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log(`[${this.name}] Exception on attempt ${attempt}: ${lastError.message}`);
      }

      // Wait before retrying (exponential backoff)
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        this.log(`[${this.name}] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError?.message || `Failed after ${this.maxRetries} attempts`,
      metadata: {
        attempts: this.maxRetries,
        lastError: lastError?.message,
      },
    };
  }

  /**
   * Abstract method to be implemented by each agent
   */
  protected abstract run(input: TInput, context?: AgentContext): Promise<AgentResult<TOutput>>;

  /**
   * Logging utility
   */
  protected log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a success result
   */
  protected success(data: TOutput, metadata?: Record<string, any>): AgentResult<TOutput> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Create a failure result
   */
  protected failure(error: string, metadata?: Record<string, any>): AgentResult<TOutput> {
    return {
      success: false,
      error,
      metadata,
    };
  }
}
