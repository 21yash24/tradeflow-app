
'use server';
/**
 * @fileOverview An AI agent for analyzing market chart images.
 *
 * - analyzeMarket - A function that critiques a user-provided chart image.
 * - MarketAnalysisInput - The input type for the analyzeMarket function.
 * - MarketAnalysis - The return type for the analyzeMarket function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MarketAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A screenshot of a market chart, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type MarketAnalysisInput = z.infer<typeof MarketAnalysisInputSchema>;


const MarketAnalysisSchema = z.object({
  potentialBiases: z.string().describe("Identifies potential trading biases a trader might feel looking at this chart (e.g., FOMO, fear, greed). Be specific about what in the chart might trigger these biases."),
  marketInsights: z.string().describe("Provides insights on the market structure, key levels (support/resistance), and potential scenarios. Suggests what a disciplined trader might look for next, without giving direct buy/sell signals."),
  disclaimer: z.string().describe("A standard disclaimer stating this is not financial advice and is for educational purposes only."),
});
export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;


export async function analyzeMarket(input: MarketAnalysisInput): Promise<MarketAnalysis> {
    return marketAnalyzerFlow(input);
}


const prompt = ai.definePrompt({
    name: 'marketAnalyzerPrompt',
    input: { schema: MarketAnalysisInputSchema },
    output: { schema: MarketAnalysisSchema },
    prompt: `You are an expert trading psychologist and market technician. Your task is to provide a detailed, constructive analysis of a provided market chart screenshot. Do not give financial advice. Your goal is to help the trader understand the market context and their own potential psychological reactions.

    Analyze the provided chart image based on the following criteria and provide your feedback in the specified format.

    1.  **Market Insights:** Analyze the chart's structure. Identify key support and resistance levels, trend direction, and any significant chart patterns. What are the potential bullish and bearish scenarios from here?
    2.  **Potential Biases:** Based on the recent price action, what psychological biases might a trader be feeling? For example, is there a large green candle that could induce FOMO (Fear Of Missing Out)? Is there a sharp drop that might cause panic selling? Be specific.
    3.  **Disclaimer:** Provide a standard disclaimer that this analysis is for educational purposes only and is not financial advice.

    Chart to analyze:
    {{media url=photoDataUri}}
    `,
});


const marketAnalyzerFlow = ai.defineFlow(
    {
        name: 'marketAnalyzerFlow',
        inputSchema: MarketAnalysisInputSchema,
        outputSchema: MarketAnalysisSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

    