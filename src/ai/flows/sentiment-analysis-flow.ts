
'use server';
/**
 * @fileOverview An AI agent for analyzing market sentiment from news articles.
 *
 * - analyzeSentiment - A function that analyzes a news article for market sentiment.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysis - The return type for the analyzeSentiment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SentimentAnalysisInputSchema = z.object({
  articleUrl: z.string().url().describe("The URL of the news article to analyze."),
  trackedPairs: z.array(z.string()).describe("A list of currency pairs the user is tracking."),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;


const PairSentimentSchema = z.object({
    pair: z.string().describe("The currency pair."),
    sentiment: z.enum(["Bullish", "Bearish", "Neutral"]).describe("The sentiment for this specific pair."),
    reasoning: z.string().describe("A brief explanation for the sentiment rating for this pair."),
});

const SentimentAnalysisSchema = z.object({
  overallSentiment: z.enum(["Positive", "Negative", "Neutral", "Mixed"]).describe("The overall sentiment of the article."),
  summary: z.string().describe("A one-sentence summary of the article's key takeaway for a trader."),
  pairSentiments: z.array(PairSentimentSchema).describe("An array of sentiment analyses for each tracked currency pair."),
});
export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;


export async function analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysis> {
    return analyzeSentimentFlow(input);
}


const prompt = ai.definePrompt({
    name: 'sentimentAnalysisPrompt',
    input: { schema: SentimentAnalysisInputSchema },
    output: { schema: SentimentAnalysisSchema },
    prompt: `You are a forex market sentiment analysis AI. Your task is to read a news article and determine its likely impact on various currency pairs.
    
    You CANNOT access the article URL directly. I will provide a summary of the content. Based on this summary, you must perform the analysis.
    
    **Simulated Article Summary for URL '{{articleUrl}}':** 
    "The latest US Non-Farm Payroll report was released, showing a significant increase in jobs added, far exceeding economists' forecasts. The unemployment rate also dropped unexpectedly. This strong labor market data suggests the Federal Reserve may hold off on cutting interest rates in the near term, strengthening the US Dollar."

    **User's Tracked Pairs:**
    {{#each trackedPairs}}
    - {{{this}}}
    {{/each}}

    Analyze the simulated article summary and provide the following:
    1.  **Overall Sentiment**: Is the news generally positive, negative, neutral, or mixed for the financial markets?
    2.  **Summary**: A one-sentence key takeaway for a trader.
    3.  **Pair Sentiments**: For each of the user's tracked pairs, determine if the news is Bullish, Bearish, or Neutral for that specific pair and provide a brief reasoning. For example, strong USD data would be Bearish for EUR/USD but Bullish for USD/CHF.
    
    Produce the output in the specified JSON format.
    `,
});


const analyzeSentimentFlow = ai.defineFlow(
    {
        name: 'analyzeSentimentFlow',
        inputSchema: SentimentAnalysisInputSchema,
        outputSchema: SentimentAnalysisSchema,
    },
    async (input) => {
        // In a real application, you would fetch and parse the articleUrl here.
        // For this prototype, the content is simulated within the prompt itself.
        const { output } = await prompt(input);
        return output!;
    }
);
