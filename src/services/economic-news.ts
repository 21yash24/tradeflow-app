'use server';

import { z } from 'zod';

const EconomicEventSchema = z.object({
  date: z.string(),
  country: z.string(),
  event: z.string(),
  impact: z.string(),
  actual: z.number().nullable(),
  forecast: z.number().nullable(),
  previous: z.number().nullable(),
});

export type EconomicEvent = z.infer<typeof EconomicEventSchema>;

const FinnhubEventSchema = z.object({
    actual: z.number().nullable().optional(),
    country: z.string().optional(),
    estimate: z.number().nullable().optional(),
    event: z.string().optional(),
    impact: z.string().optional(),
    prev: z.number().nullable().optional(),
    time: z.string().optional(), // '14:00'
    date: z.string().optional(), // '2024-07-29'
});

const FinnhubResponseSchema = z.array(FinnhubEventSchema);


export async function getEconomicNews(from: string, to: string): Promise<EconomicEvent[]> {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey) {
        console.error("Finnhub API key is not configured.");
        return [];
    }

    const url = `https://finnhub.io/api/v1/forex/economic?from=${from}&to=${to}&token=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error(`Error body: ${errorBody}`);
            return [];
        }

        const data = await response.json();
        const parsedData = FinnhubResponseSchema.safeParse(data);

        if (!parsedData.success) {
            console.error("Failed to parse Finnhub response:", parsedData.error);
            return [];
        }
        
        return parsedData.data
            .filter(e => e.date && e.time && e.event && e.country && e.impact)
            .map(event => {
                const dateTimeString = `${event.date}T${event.time}:00Z`;
                return {
                    date: new Date(dateTimeString).toISOString(),
                    country: event.country!,
                    event: event.event!,
                    impact: event.impact!,
                    actual: event.actual ?? null,
                    forecast: event.estimate ?? null,
                    previous: event.prev ?? null,
                };
            });

    } catch (error) {
        console.error("Error fetching economic news from Finnhub:", error);
        return [];
    }
}