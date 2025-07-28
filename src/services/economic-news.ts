
'use server';

import { z } from 'zod';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

const EconomicEventSchema = z.object({
  date: z.string(),
  country: z.string(),
  event: z.string(),
  impact: z.string(), // Will be set to 'Medium' for all news articles for now
  actual: z.number().nullable(),
  forecast: z.number().nullable(),
  previous: z.number().nullable(),
});

export type EconomicEvent = z.infer<typeof EconomicEventSchema>;

const MarketauxArticleSchema = z.object({
    uuid: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    url: z.string().url(),
    image_url: z.string().url().nullable(),
    published_at: z.string(),
    source: z.string(),
    language: z.string(),
    group_name: z.string().optional(),
    country: z.string().optional(),
});

const MarketauxResponseSchema = z.object({
    meta: z.object({
        found: z.number(),
        returned: z.number(),
        limit: z.number(),
        page: z.number()
    }),
    data: z.array(MarketauxArticleSchema)
});


export async function getEconomicNews(from: string, to: string): Promise<EconomicEvent[]> {
    const apiKey = process.env.NEXT_PUBLIC_MARKETAUX_API_KEY;
    if (!apiKey) {
        console.error("Marketaux API key is not configured.");
        return [];
    }

    const allEvents: EconomicEvent[] = [];
    
    try {
        const daysToFetch = eachDayOfInterval({
            start: parseISO(from),
            end: parseISO(to)
        });

        for (const day of daysToFetch) {
            const formattedDate = format(day, 'yyyy-MM-dd');
            const url = `https://api.marketaux.com/v1/news/all?group=top&language=en&published_on=${formattedDate}&api_token=${apiKey}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Marketaux API error for date ${formattedDate}: ${response.status} ${response.statusText}`);
                const errorBody = await response.text();
                console.error(`Error body: ${errorBody}`);
                continue; // Continue to the next day
            }

            const data = await response.json();
            const parsedData = MarketauxResponseSchema.safeParse(data);

            if (!parsedData.success) {
                console.error(`Failed to parse Marketaux response for date ${formattedDate}:`, parsedData.error.toString());
                continue; // Continue to the next day
            }
            
            const dailyEvents = parsedData.data.map(article => ({
                date: new Date(article.published_at).toISOString(),
                country: article.source.split('.')[0] || 'News',
                event: article.title,
                impact: 'Medium',
                actual: null,
                forecast: null,
                previous: null,
            }));

            allEvents.push(...dailyEvents);
        }
        
        return allEvents;

    } catch (error) {
        console.error("Error fetching economic news from Marketaux:", error);
        return [];
    }
}
