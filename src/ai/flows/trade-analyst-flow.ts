
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * @fileOverview A trade analysis AI agent.
 * 
 * - analyzeTrade - A function that handles the trade analysis process.
 * - TradeAnalysisInput - The input type for the analyzeTrade function.
 * - TradeAnalysis - The return type for the analyzeTrade function.
 */

const TradeAnalysisInputSchema = z.object({
    pair: z.string().describe('The currency pair that was traded.'),
    type: z.enum(['buy', 'sell']).describe('Whether the trade was a buy or a sell.'),
    pnl: z.number().describe('The profit or loss from the trade.'),
    notes: z.string().describe('The journal notes written by the trader about the trade.'),
    mentalState: z.string().describe('The mental state or feelings of the trader during the trade.'),
});
export type TradeAnalysisInput = z.infer<typeof TradeAnalysisInputSchema>;

const TradeAnalysisSchema = z.object({
  summary: z.string().describe('A one-sentence summary of the analysis.'),
  whatWentWell: z.string().describe('An analysis of what the trader did well in this trade based on their notes.'),
  whatToImprove: z.string().describe('An analysis of what the trader could improve upon for future trades.'),
  potentialBiases: z.string().describe('Identifies potential trading biases like FOMO, revenge trading, or confirmation bias based on the notes and outcome.'),
});
export type TradeAnalysis = z.infer<typeof TradeAnalysisSchema>;

const prompt = ai.definePrompt({
    name: 'tradeAnalystPrompt',
    input: { schema: TradeAnalysisInputSchema },
    output: { schema: TradeAnalysisSchema },
    prompt: `You are an expert trading psychologist and performance coach. 
    
    A user has submitted a trade from their journal for your review. Your task is to analyze their notes, mental state, and the trade outcome to provide constructive, insightful feedback. 
    
    Adopt a supportive and educational tone. Focus on helping the trader recognize patterns, improve their process, and manage their psychology. Do not give financial advice.

    Here is the trade data:
    - Currency Pair: {{{pair}}}
    - Trade Type: {{{type}}}
    - Profit/Loss: \${{{pnl}}}
    - Trader's Notes: "{{{notes}}}"
    - Trader's Mental State: "{{{mentalState}}}"

    Based on this information, provide a concise analysis covering the following points.
    `,
});


const analyzeTradeFlow = ai.defineFlow(
    {
        name: 'analyzeTradeFlow',
        inputSchema: TradeAnalysisInputSchema,
        outputSchema: TradeAnalysisSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);


export const tradeAnalysisTool = ai.defineTool(
    {
        name: 'tradeAnalysisTool',
        description: 'Reviews a user\'s past trade based on their notes, P/L, and mental state to provide psychological and performance feedback.',
        inputSchema: TradeAnalysisInputSchema,
        outputSchema: TradeAnalysisSchema,
    },
    async (input) => {
        return await analyzeTradeFlow(input);
    }
);
