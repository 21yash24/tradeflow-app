'use server';

/**
 * @fileOverview Provides sentiment analysis for news articles related to tracked currency pairs.
 *
 * - analyzeNewsSentiment - Analyzes the sentiment of a given news article.
 * - NewsSentimentInput - The input type for the analyzeNewsSentiment function.
 * - NewsSentimentOutput - The return type for the analyzeNewsSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NewsSentimentInputSchema = z.object({
  articleHeadline: z.string().describe('The headline of the news article.'),
  articleBody: z.string().describe('The body of the news article.'),
  currencyPair: z.string().describe('The currency pair the article is related to (e.g., EUR/USD).'),
});
export type NewsSentimentInput = z.infer<typeof NewsSentimentInputSchema>;

const NewsSentimentOutputSchema = z.object({
  overallSentiment: z
    .string()
    .describe(
      'The overall sentiment of the article (positive, negative, or neutral) towards the currency pair.'
    ),
  sentimentScore: z
    .number()
    .describe('A numerical score indicating the sentiment strength (e.g., -1 to 1).'),
  summary: z.string().describe('A brief summary of the article and its potential impact.'),
});
export type NewsSentimentOutput = z.infer<typeof NewsSentimentOutputSchema>;

export async function analyzeNewsSentiment(
  input: NewsSentimentInput
): Promise<NewsSentimentOutput> {
  return newsSentimentAnalysisFlow(input);
}

const newsSentimentPrompt = ai.definePrompt({
  name: 'newsSentimentPrompt',
  input: {schema: NewsSentimentInputSchema},
  output: {schema: NewsSentimentOutputSchema},
  prompt: `You are an AI assistant that analyzes financial news articles and determines their sentiment towards specific currency pairs.

Analyze the following news article and provide:
1. overallSentiment: Determine if the article has a positive, negative, or neutral sentiment toward the currency pair.
2. sentimentScore: Assign a numerical score from -1 (very negative) to 1 (very positive) indicating sentiment strength.
3. summary: Briefly summarize the article and explain its potential impact on the specified currency pair.

Currency Pair: {{{currencyPair}}}
Article Headline: {{{articleHeadline}}}
Article Body: {{{articleBody}}}

Ensure your response is concise and focused on the sentiment analysis.
`,
});

const newsSentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'newsSentimentAnalysisFlow',
    inputSchema: NewsSentimentInputSchema,
    outputSchema: NewsSentimentOutputSchema,
  },
  async input => {
    const {output} = await newsSentimentPrompt(input);
    return output!;
  }
);
