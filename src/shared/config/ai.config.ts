import { registerAs } from '@nestjs/config';

export interface AIConfig {
  openai: {
    apiKey: string;
    modelName: string;
    temperature: number;
  };
}

export default registerAs<AIConfig>('ai', () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return {
    openai: {
      apiKey,
      modelName: process.env.OPENAI_MODEL_NAME || 'gpt-5-mini',
      temperature: process.env.OPENAI_TEMPERATURE
        ? parseFloat(process.env.OPENAI_TEMPERATURE)
        : 0.7,
    },
  };
});
