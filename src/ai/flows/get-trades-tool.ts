
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getUserTrades } from '@/services/trade-service';

/**
 * @fileOverview A tool for fetching a user's trading history.
 *
 * - getTradesTool - A Genkit tool that retrieves trades for a given user.
 */

export const getTradesTool = ai.defineTool(
  {
    name: 'getTradesTool',
    description: 'Retrieves a list of the user\'s most recent trades from their journal.',
    inputSchema: z.object({
        userId: z.string().describe("The user's unique ID to fetch trades for."),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    if (!input.userId) {
      throw new Error("User ID is required to fetch trades.");
    }
    const trades = await getUserTrades(input.userId);

    // Return a simplified summary to the LLM to avoid overwhelming it with data
    if (trades.length === 0) {
        return "The user has not logged any trades yet.";
    }
    
    const tradeSummary = trades.map(t => ({
        pair: t.pair,
        date: t.date,
        type: t.type,
        rr: t.rr,
        setup: t.setup,
        notes: t.notes?.substring(0, 100) // Truncate notes
    }));

    return `Here is a summary of the user's recent trades: ${JSON.stringify(tradeSummary, null, 2)}`;
  }
);
