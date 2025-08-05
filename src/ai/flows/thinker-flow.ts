
'use server';
/**
 * @fileOverview A conversational AI agent for trading analysis.
 *
 * - thinker - A function that orchestrates analysis based on user prompts.
 * - thinkerTool - The main flow that uses other tools to answer questions.
 * - ThinkerInput - The input type for the thinker function.
 * - ThinkerOutput - The return type for the thinker function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { marketAnalysisTool, type MarketAnalysis } from './market-analyzer-flow';
import { tradeAnalysisTool, type TradeAnalysis } from './trade-analyst-flow';

const ThinkerInputSchema = z.object({
  prompt: z.string().describe('The user\'s request or question.'),
  photoDataUri: z.string().optional().describe(
      "A photo of a trading chart, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type ThinkerInput = z.infer<typeof ThinkerInputSchema>;

const ThinkerOutputSchema = z.object({
  answer: z.string().describe('A direct, conversational answer to the user\'s prompt.'),
  marketAnalysis: z.nullable(z.custom<MarketAnalysis>()).describe('The result of a market analysis, if performed.'),
  tradeAnalysis: z.nullable(z.custom<TradeAnalysis>()).describe('The result of a trade analysis, if performed.'),
});
export type ThinkerOutput = z.infer<typeof ThinkerOutputSchema>;

export async function thinker(input: ThinkerInput): Promise<ThinkerOutput> {
  return thinkerTool(input);
}

const thinkerTool = ai.defineFlow(
  {
    name: 'thinkerTool',
    inputSchema: ThinkerInputSchema,
    outputSchema: ThinkerOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
      prompt: `You are a friendly and conversational AI trading assistant.
      
      The user's prompt is: "${input.prompt}"
      
      ${input.photoDataUri ? 'The user has also provided this chart image: {{media url=photoDataUri}}' : ''}

      Your task is to understand the user's intent and provide a helpful response.
      - If the user asks for chart analysis or has questions about a market setup, you MUST use the 'marketAnalysisTool'.
      - If the user wants to review a past trade (discussing P/L, emotions, or notes), you MUST use the 'tradeAnalysisTool'.
      - For anything else related to trading psychology, discipline, or general questions, provide a helpful, conversational answer directly.
      - If you use a tool, present the output of that tool. Your main answer should just be a short summary or acknowledgment. For example "Here is the market analysis you requested:".
      - If the user provides an image but does not explicitly ask to analyze it, you should ask them if they want you to analyze it.
      `,
      input: { photoDataUri: input.photoDataUri },
      tools: [marketAnalysisTool, tradeAnalysisTool],
      output: {
        schema: ThinkerOutputSchema
      }
    });

    return llmResponse.output() || { answer: "I'm sorry, I couldn't process that request.", marketAnalysis: null, tradeAnalysis: null };
  }
);

