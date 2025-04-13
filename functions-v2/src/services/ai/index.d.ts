
declare module 'ai' {
  // Déclarer les types nécessaires pour le module 'ai'
  export interface OpenAIRequestOptions {
    model: string;
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    temperature?: number;
    max_tokens?: number;
  }

  export interface OpenAIResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  }
}
