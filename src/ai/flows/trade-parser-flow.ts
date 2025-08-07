
'use server';
/**
 * @fileOverview An AI flow for parsing unstructured trade descriptions into structured data.
 *
 * - parseTrade - A function that handles the trade parsing process.
 * - TradeParseInput - The input type for the parseTrade function.
 * - TradeParseResult - The return type for the parseTrade function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TradeParseInputSchema = z.object({
  description: z.string().optional().describe('The user\'s natural language description of the trade.'),
  screenshotDataUri: z
    .string()
    .optional()
    .describe(
      "An optional screenshot of the trade chart, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TradeParseInput = z.infer<typeof TradeParseInputSchema>;

const TradeParseResultSchema = z.object({
  pair: z.string().describe("The currency pair for the trade, e.g., 'EUR/USD'."),
  type: z.enum(['buy', 'sell']).describe("The type of trade, must be either 'buy' or 'sell'."),
  setup: z.string().describe('The trading setup, e.g., "Breakout", "Reversal", "Continuation".'),
  rr: z.number().optional().describe("The risk/reward ratio of the trade, if mentioned. e.g., 2.5 for a 2.5R win, -1 for a 1R loss."),
  notes: z.string().optional().describe("Any additional notes or the original description provided by the user."),
  confidence: z.number().optional().describe("The user's confidence level, from 0 to 100, if mentioned."),
  mentalState: z.string().optional().describe("The user's mental state during the trade, if mentioned."),
});
export type TradeParseResult = z.infer<typeof TradeParseResultSchema>;

export async function parseTrade(input: TradeParseInput): Promise<TradeParseResult> {
  return tradeParserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tradeParserPrompt',
  input: { schema: TradeParseInputSchema },
  output: { schema: TradeParseResultSchema },
  prompt: `You are an expert at understanding and parsing trade journal entries. Your task is to extract structured data from a user's description of a trade.

The user has provided the following information:
{{#if description}}
- **Description:** "{{{description}}}"
{{/if}}
{{#if screenshotDataUri}}
- **Chart Screenshot:** {{media url=screenshotDataUri}}
{{/if}}

Analyze the text and the image (if provided) to fill in the following fields. You must make a best effort to determine each field.

- **pair:** Identify the currency pair (e.g., 'EUR/USD', 'GBP/JPY', 'XAU/USD', 'NAS100'). Standardize it to the common ticker format with a '/'.
- **type:** Determine if it was a 'buy' (long, longed) or 'sell' (short, shorted) trade. This must be one of 'buy' or 'sell'.
- **setup:** Extract the name of the trading setup or strategy (e.g., "Breakout", "Reversal", "Continuation", "ICT FVG").
- **rr:** If the user mentions a profit or loss in terms of "R" (e.g., "2R win", "made 2.5R", "lost 1R"), extract that number. A win should be positive, a loss should be negative. If not mentioned, do not include the field in the output.
- **notes:** Use the user's original description as the notes. If the user only provides an image, you can briefly describe what you see.
- **confidence:** If confidence is mentioned as a percentage, extract it.
- **mentalState:** Extract any mention of feelings or mental state (e.g., "anxious", "confident").

If you cannot determine a field, do your best to infer it or leave it out if it's truly not present. Do not invent data. Return the data in the specified JSON format.
`,
});

const tradeParserFlow = ai.defineFlow(
  {
    name: 'tradeParserFlow',
    inputSchema: TradeParseInputSchema,
    outputSchema: TradeParseResultSchema,
  },
  async (input) => {
    if (!input.description && !input.screenshotDataUri) {
        throw new Error("Either a description or a screenshot must be provided.");
    }
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid trade analysis. Please try again.');
    }
    // Make sure the original description is passed as notes if the AI forgets
    if (!output.notes && input.description) {
        output.notes = input.description;
    }
    
    // The model might return rr: null, which Zod dislikes for an optional number.
    // Explicitly set to undefined if it's not a valid number.
    if (output.rr === null || typeof output.rr !== 'number') {
        output.rr = undefined;
    }

    return output;
  }
);
