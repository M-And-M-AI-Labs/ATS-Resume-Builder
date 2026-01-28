/**
 * LLM Factory
 * Returns the configured LLM adapter
 */

import { LLMAdapter } from './adapter';
import { OpenAIAdapter } from './openai-adapter';
import { GroqAdapter } from './groq-adapter';

let adapter: LLMAdapter | null = null;

export function getLLMAdapter(): LLMAdapter {
  if (!adapter) {
    const provider = process.env.LLM_PROVIDER || 'groq';
    
    switch (provider.toLowerCase()) {
      case 'openai':
        adapter = new OpenAIAdapter();
        break;
      case 'groq':
        adapter = new GroqAdapter();
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: 'openai', 'groq'`);
    }
  }
  
  return adapter;
}

