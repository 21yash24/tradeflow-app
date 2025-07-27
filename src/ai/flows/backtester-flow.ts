
'use server';
/**
 * @fileOverview An AI agent for backtesting trading strategies.
 *
 * - backtestStrategy - A function that simulates a backtest based on a user-defined strategy.
 * - BacktestStrategyInput - The input type for the backtestStrategy function.
 * - BacktestResult - The return type for the backtestStrategy function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BacktestStrategyInputSchema = z.object({
  strategy: z.string().describe('The user-defined trading strategy in plain English.'),
  pair: z.string().describe('The currency pair to backtest on.'),
  timeframe: z.string().describe('The chart timeframe (e.g., 4H, 1D).'),
  dateRange: z.string().describe('The historical date range for the backtest (e.g., Last Year).'),
});
export type BacktestStrategyInput = z.infer<typeof BacktestStrategyInputSchema>;

const EquityCurvePointSchema = z.object({
    name: z.string().describe("The trade number or date."),
    value: z.number().describe("The equity value at this point."),
});

const BacktestResultSchema = z.object({
  netPnl: z.number().describe("The final net profit or loss of the backtest."),
  winRate: z.number().describe("The percentage of winning trades."),
  profitFactor: z.number().describe("The ratio of gross profit to gross loss."),
  totalTrades: z.number().describe("The total number of trades executed."),
  equityCurve: z.array(EquityCurvePointSchema).describe("An array of points representing the equity curve over time."),
});
export type BacktestResult = z.infer<typeof BacktestResultSchema>;


export async function backtestStrategy(input: BacktestStrategyInput): Promise<BacktestResult> {
    return backtestStrategyFlow(input);
}


const prompt = ai.definePrompt({
    name: 'backtestStrategyPrompt',
    input: { schema: BacktestStrategyInputSchema },
    output: { schema: BacktestResultSchema },
    prompt: `You are a quantitative analyst AI. Your task is to simulate a backtest for a given trading strategy. 
    
    You CANNOT access real historical data. You must generate realistic, plausible results based on the strategy's description.
    
    The user's strategy is: "{{strategy}}"
    - Pair: {{{pair}}}
    - Timeframe: {{{timeframe}}}
    - Date Range: {{{dateRange}}}

    Based on the complexity and common performance of such a strategy, generate a plausible backtest result. For example, simple strategies like a basic EMA crossover might have a lower win rate and profit factor, while more complex strategies might have better (but still realistic) metrics.
    
    Generate an equity curve with at least 10 data points, starting from a baseline of $10,000.
    
    Produce the output in the format specified.
    `,
});


const backtestStrategyFlow = ai.defineFlow(
    {
        name: 'backtestStrategyFlow',
        inputSchema: BacktestStrategyInputSchema,
        outputSchema: BacktestResultSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
