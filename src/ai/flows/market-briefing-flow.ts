
'use server';
/**
 * @fileOverview An AI agent for generating daily market briefings.
 *
 * - generateMarketBriefing - A function that creates a market summary from economic events.
 * - MarketBriefingInput - The input type for the generateMarketBriefing function.
 * - MarketBriefing - The return type for the generateMarketBriefing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { EconomicEvent } from '@/services/economic-news';

const MarketBriefingInputSchema = z.object({
  events: z.array(
    z.object({
      date: z.string(),
      country: z.string(),
      event: z.string(),
      impact: z.string(),
      actual: z.number().nullable(),
      forecast: z.number().nullable(),
      previous: z.number().nullable(),
    })
  ).describe("A list of economic events for the day."),
});
export type MarketBriefingInput = z.infer<typeof MarketBriefingInputSchema>;

const MarketBriefingSchema = z.object({
  overallOutlook: z.string().describe("A one or two-sentence summary of the day's market outlook based on the scheduled events."),
  eventAnalyses: z.array(
    z.object({
      eventName: z.string().describe("The name of the economic event."),
      analysis: z.string().describe("A brief analysis of the event's potential impact on the market, considering its importance and the currency it affects."),
    })
  ).describe("A list of analyses for the most important events of the day."),
});
export type MarketBriefing = z.infer<typeof MarketBriefingSchema>;

export async function generateMarketBriefing(input: { events: EconomicEvent[] }): Promise<MarketBriefing> {
    // Manually construct the input for the prompt to include the stringified events
    const promptInput = {
        events: JSON.stringify(input.events, null, 2),
    };
    return generateMarketBriefingFlow(promptInput as any);
}


const prompt = ai.definePrompt({
    name: 'marketBriefingPrompt',
    input: { schema: z.object({ events: z.string() }) },
    output: { schema: MarketBriefingSchema },
    prompt: `You are a financial market analyst providing a daily briefing for a forex trader.

    Your task is to analyze the following list of scheduled economic events for the day and generate a concise, insightful summary.

    Focus on the events with 'High' or 'Medium' impact. For each of these key events, provide a brief analysis of its potential impact.
    
    Conclude with an overall outlook for the day, summarizing what traders should watch out for. Keep your tone professional, clear, and to the point.

    Today's Economic Events:
    {{{events}}}

    Provide your analysis based on these events.
    `,
});


const generateMarketBriefingFlow = ai.defineFlow(
    {
        name: 'generateMarketBriefingFlow',
        inputSchema: z.object({ events: z.string() }),
        outputSchema: MarketBriefingSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

    