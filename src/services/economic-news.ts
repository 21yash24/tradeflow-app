
'use server';

import { z } from 'zod';
import { format, subDays } from 'date-fns';

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

    // Marketaux uses published_on. We will query for news over the date range.
    // Let's create a date range string for the API
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // To get a good range of news, let's format dates for the API
    const publishedOn = `[${format(fromDate, 'yyyy-MM-dd')} TO ${format(toDate, 'yyyy-MM-dd')}]`;

    const url = `https://api.marketaux.com/v1/news/all?group=top&language=en&published_on=${publishedOn}&api_token=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Marketaux API error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error(`Error body: ${errorBody}`);
            return [];
        }

        const data = await response.json();
        const parsedData = MarketauxResponseSchema.safeParse(data);

        if (!parsedData.success) {
            console.error("Failed to parse Marketaux response:", parsedData.error.toString());
            return [];
        }
        
        return parsedData.data
            .map(article => {
                // Map Article to EconomicEvent structure
                return {
                    date: new Date(article.published_at).toISOString(),
                    // Use source as country for lack of a better field
                    country: article.source.split('.')[0] || 'News', 
                    event: article.title,
                    // Marketaux doesn't provide impact, so we'll set a default
                    impact: 'Medium', 
                    // Marketaux news doesn't have these numeric fields
                    actual: null,
                    forecast: null,
                    previous: null,
                };
            })
            // Ensure we only return events within the requested date range
            .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= fromDate && eventDate <= toDate;
            });

    } catch (error) {
        console.error("Error fetching economic news from Marketaux:", error);
        return [];
    }
}
