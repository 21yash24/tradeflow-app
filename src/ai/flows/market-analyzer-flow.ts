
'use server';
/**
 * @fileOverview An AI agent for analyzing market chart images with user context.
 *
 * - analyzeMarket - A function that critiques a user-provided chart image and their answers.
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
    userBias: z.string().describe("The user's stated bias (e.g., bullish, bearish, neutral) before the analysis."),
    timeframe: z.string().describe("The user's trading timeframe for this analysis (e.g., intraday, swing, position)."),
    concerns: z.string().describe("The user's specific concerns or questions about the chart."),
});
export type MarketAnalysisInput = z.infer<typeof MarketAnalysisInputSchema>;


const MarketAnalysisSchema = z.object({
  potentialBiases: z.string().describe("Identifies potential trading biases a trader might feel looking at this chart (e.g., FOMO, fear, greed). It should also consider the user's stated bias and either confirm or challenge it based on the chart."),
  marketInsights: z.string().describe("Provides insights on the market structure, key levels (support/resistance), and potential scenarios based on the chart and the user's timeframe. Suggests what a disciplined trader might look for next, without giving direct buy/sell signals."),
  addressingConcerns: z.string().describe("Directly addresses the user's specific concerns or questions with clear, educational explanations based on the provided chart."),
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
    prompt: `You are an expert trading psychologist and market technician. Your task is to provide a detailed, constructive analysis of a provided market chart screenshot and the trader's commentary. Do not give financial advice. Your goal is to help the trader understand the market context and their own potential psychological reactions.

    Analyze the provided information based on the following criteria and provide your feedback in the specified format.

    **Trader's Context:**
    - Stated Bias: {{{userBias}}}
    - Trading Timeframe: {{{timeframe}}}
    - Specific Concerns/Questions: "{{{concerns}}}"

    **Chart to Analyze:**
    {{media url=photoDataUri}}

    **Your Analysis Tasks:**

    1.  **Market Insights:** Analyze the chart's structure based on the user's timeframe. Identify key support and resistance levels, trend direction, and any significant chart patterns. What are the potential bullish and bearish scenarios from here?
    2.  **Potential Biases:** Based on recent price action and the user's stated bias, what psychological biases might a trader be feeling? For example, is there a large green candle that could induce FOMO? Is their stated bias confirmed by the chart, or is it a potential trap? Be specific.
    3.  **Addressing Concerns:** Directly answer the trader's specific concerns. Provide clear, educational insights related to their questions.
    4.  **Disclaimer:** Provide a standard disclaimer that this analysis is for educational purposes only and is not financial advice.
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
