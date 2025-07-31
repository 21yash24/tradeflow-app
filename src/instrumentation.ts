// src/instrumentation.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export function register() {
  genkit({
    plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    model: 'googleai/gemini-2.0-flash',
  });
}
