
'use server';

import { z } from 'zod';
import { format } from 'date-fns';

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
    time: z.string().optional(),
});

const FinnhubResponseSchema = z.object({
    economicCalendar: z.array(FinnhubEventSchema),
});


export async function getEconomicNews(from: string, to: string): Promise<EconomicEvent[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
        console.error("Finnhub API key is not configured.");
        return [];
    }

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Finnhub API error: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const parsedData = FinnhubResponseSchema.safeParse(data);

        if (!parsedData.success) {
            console.error("Failed to parse Finnhub response:", parsedData.error);
            return [];
        }
        
        return parsedData.data.economicCalendar
            .filter(e => e.time && e.event && e.country && e.impact) // Filter out events with missing essential data
            .map(event => ({
                date: new Date(event.time!).toISOString(), // Assuming time is in a format Date can parse
                country: event.country!,
                event: event.event!,
                impact: event.impact!,
                actual: event.actual ?? null,
                forecast: event.estimate ?? null,
                previous: event.prev ?? null,
            }));

    } catch (error) {
        console.error("Error fetching economic news from Finnhub:", error);
        return [];
    }
}
