
'use server';
/**
 * @fileOverview An AI agent for analyzing and refining trading strategies.
 *
 * - analyzeStrategy - A function that critiques a user-defined strategy.
 * - StrategyAnalysisInput - The input type for the analyzeStrategy function.
 * - StrategyAnalysis - The return type for the analyzeStrategy function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StrategyAnalysisInputSchema = z.object({
  strategy: z.string().describe('The user-defined trading strategy in plain English.'),
  pair: z.string().describe('The currency pair the strategy is intended for.'),
  timeframe: z.string().describe('The chart timeframe (e.g., 4H, 1D).'),
});
export type StrategyAnalysisInput = z.infer<typeof StrategyAnalysisInputSchema>;


const StrategyAnalysisSchema = z.object({
  clarityAndCompleteness: z.string().describe("Critique on how clear and complete the strategy is. Are the entry, exit, and risk management rules well-defined?"),
  potentialRisks: z.string().describe("Analysis of potential risks or weaknesses. In what market conditions might this strategy fail? (e.g., high volatility, ranging markets)."),
  suggestedImprovements: z.string().describe("Specific, actionable suggestions for improving the strategy. This could include adding indicators, filters, or refining rules."),
  summary: z.string().describe("A one-sentence summary of the AI's overall assessment of the strategy."),
});
export type StrategyAnalysis = z.infer<typeof StrategyAnalysisSchema>;


export async function analyzeStrategy(input: StrategyAnalysisInput): Promise<StrategyAnalysis> {
    return strategyAnalystFlow(input);
}


const prompt = ai.definePrompt({
    name: 'strategyAnalystPrompt',
    input: { schema: StrategyAnalysisInputSchema },
    output: { schema: StrategyAnalysisSchema },
    prompt: `You are an expert trading mentor and quantitative analyst. Your task is to provide a detailed, constructive critique of a user's trading strategy. Do not give financial advice, but focus on improving the strategy's logic, clarity, and robustness.

    User's Strategy Details:
    - Strategy: "{{strategy}}"
    - Pair: {{{pair}}}
    - Timeframe: {{{timeframe}}}

    Analyze the strategy based on the following criteria and provide your feedback in the specified format. Be critical but supportive. Point out vagueness and suggest concrete rules.
    `,
});


const strategyAnalystFlow = ai.defineFlow(
    {
        name: 'strategyAnalystFlow',
        inputSchema: StrategyAnalysisInputSchema,
        outputSchema: StrategyAnalysisSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
