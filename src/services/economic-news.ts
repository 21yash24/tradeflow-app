
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

const API_KEY = process.env.FMP_API_KEY;
const API_URL = 'https://financialmodelingprep.com/api/v3/economic_calendar';

export async function getEconomicNews(): Promise<EconomicEvent[]> {
  if (!API_KEY) {
    console.error("FMP API key is not set. Returning mock data.");
    return getMockData();
  }

  try {
    const response = await fetch(`${API_URL}?apikey=${API_KEY}`);
    if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
        return getMockData();
    }
    const data = await response.json();
    const validatedData = z.array(EconomicEventSchema).safeParse(data);
    
    if (validatedData.success) {
        return validatedData.data;
    } else {
        console.error("Failed to validate economic news data:", validatedData.error);
        return getMockData();
    }
  } catch (error) {
    console.error("Error fetching economic news:", error);
    return getMockData();
  }
}

function getMockData(): EconomicEvent[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    return [
    {
      date: new Date(today.setHours(8, 30, 0, 0)).toISOString(),
      country: 'USD',
      event: 'Core PCE Price Index m/m',
      impact: 'High',
      actual: 0.2,
      forecast: 0.3,
      previous: 0.3,
    },
    {
      date: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
      country: 'USD',
      event: 'Michigan Consumer Sentiment',
      impact: 'Medium',
      actual: 65.6,
      forecast: 66,
      previous: 69.1,
    },
    {
      date: new Date(tomorrow.setHours(4, 30, 0, 0)).toISOString(),
      country: 'GBP',
      event: 'GDP m/m',
      impact: 'High',
      actual: null,
      forecast: 0.1,
      previous: 0.7,
    },
    {
      date: new Date(dayAfter.setHours(14, 0, 0, 0)).toISOString(),
      country: 'ALL',
      event: 'OPEC-JMMC Meetings',
      impact: 'Medium',
      actual: null,
      forecast: null,
      previous: null,
    },
  ];
}
