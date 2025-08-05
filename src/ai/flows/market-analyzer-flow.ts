
'use server';
/**
 * @fileOverview A market analysis AI agent.
 *
 * - analyzeMarket - A function that handles the market analysis process.
 * - MarketAnalysisInput - The input type for the analyzeMarket function.
 * - MarketAnalysis - The return type for the analyzeMarket function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MarketAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A screenshot of a trading chart, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userBias: z.string().optional().describe("The user's initial bias (e.g., Bullish, Bearish, Neutral). If not provided, assume Neutral."),
  timeframe: z.string().optional().describe("The trading timeframe (e.g., Intraday, Swing, Position). If not provided, try to infer from the chart."),
  concerns: z.string().optional().describe("The user's specific questions or concerns about the chart setup. If not provided, perform a general analysis."),
});
export type MarketAnalysisInput = z.infer<typeof MarketAnalysisInputSchema>;

const MarketAnalysisSchema = z.object({
  potentialBiases: z.string().describe("Analyze how the user's stated bias might be affecting their chart interpretation. Offer a neutral or contrarian viewpoint to challenge their assumptions."),
  marketInsights: z.string().describe("Provide an objective analysis of the chart. Identify key support/resistance levels, trend direction, relevant chart patterns, and indicator signals. Do not provide signals, but rather observations."),
  addressingConcerns: z.string().describe("Directly address the user's specific questions or concerns, providing explanations based on the chart data."),
  disclaimer: z.string().default("This AI analysis is for educational purposes only and is not financial advice. Always do your own research and manage risk appropriately."),
  keySupportLevels: z.array(z.string()).describe("A list of key support price levels identified from the chart. This must be an array of strings."),
  keyResistanceLevels: z.array(z.string()).describe("A list of key resistance price levels identified from the chart. This must be an array of strings."),
  identifiedPatterns: z.array(z.string()).describe("A list of any recognizable technical chart patterns (e.g., 'Head and Shoulders', 'Double Top'). This must be an array of strings."),
  overallSentiment: z.enum(['Bullish', 'Bearish', 'Neutral']).describe("The AI's overall sentiment based on the analysis. Must be one of 'Bullish', 'Bearish', or 'Neutral'."),
  actionableNextSteps: z.array(z.string()).describe("A list of concrete, actionable steps the trader could take next, such as setting alerts or waiting for specific confirmations. This must be an array of strings.")
});
export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;

const prompt = ai.definePrompt({
  name: 'marketAnalystPrompt',
  input: { schema: MarketAnalysisInputSchema },
  output: { schema: MarketAnalysisSchema },
  prompt: `You are an expert trading mentor, providing a "second opinion" on a user's chart analysis. Your goal is to offer objective insights and challenge potential biases without giving direct financial advice.

Analyze the provided chart screenshot and the user's commentary.

**User's Context:**
- **Initial Bias:** {{{userBias}}}
- **Trading Timeframe:** {{{timeframe}}}
- **Specific Concerns:** "{{{concerns}}}"

**Chart:**
{{media url=photoDataUri}}

Based on all this information, provide a structured analysis. You must return data in the specified JSON format.
- Identify key support and resistance levels as specific price points. These must be returned in the 'keySupportLevels' and 'keyResistanceLevels' arrays.
- Identify any classic chart patterns you see (e.g., 'Head and Shoulders'). This must be returned in the 'identifiedPatterns' array.
- Determine the overall sentiment from a neutral perspective. This must be returned in the 'overallSentiment' field.
- Provide a few concrete, actionable next steps for the trader to consider. This must be returned in the 'actionableNextSteps' array.
- Fill out all other fields as requested by the output schema.
`,
});

const analyzeMarketFlow = ai.defineFlow(
  {
    name: 'analyzeMarketFlow',
    inputSchema: MarketAnalysisInputSchema,
    outputSchema: MarketAnalysisSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid analysis. Please try again.');
    }
    return output;
  }
);


export const marketAnalysisTool = ai.defineTool(
    {
        name: 'marketAnalysisTool',
        description: 'Analyzes a trading chart image to provide market insights, identify patterns, and address user concerns.',
        inputSchema: MarketAnalysisInputSchema,
        outputSchema: MarketAnalysisSchema,
    },
    async (input) => {
        return await analyzeMarketFlow(input);
    }
);
