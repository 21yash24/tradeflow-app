
'use server';
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {googleCloud} from '@genkit-ai/google-cloud';

configureGenkit({
  plugins: [
    firebase(),
    googleAI({apiKey: process.env.GEMINI_API_KEY}),
    googleCloud(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const ai = genkit({
  model: 'googleai/gemini-1.5-flash-latest',
});
