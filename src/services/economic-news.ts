
'use server';

import { z } from 'zod';
import { eachDayOfInterval, format, startOfWeek, endOfWeek } from 'date-fns';

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

// This service will now primarily rely on high-quality mock data 
// to ensure functionality without requiring an API key.
export async function getEconomicNews(from?: string, to?: string): Promise<EconomicEvent[]> {
  // We can ignore the 'from' and 'to' and just generate a consistent set
  // of mock data for the current week to simulate a live service.
  return getMockData();
}

function getMockData(): EconomicEvent[] {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const weekDays = eachDayOfInterval({ start, end });

    const mockEvents: Omit<EconomicEvent, 'date'>[] = [
        // High Impact
        { country: 'USD', event: 'Consumer Price Index (CPI) m/m', impact: 'High', actual: 0.4, forecast: 0.3, previous: 0.2 },
        { country: 'EUR', event: 'ECB Press Conference', impact: 'High', actual: null, forecast: null, previous: null },
        { country: 'USD', event: 'Non-Farm Employment Change', impact: 'High', actual: 275, forecast: 198, previous: 229 },
        { country: 'GBP', event: 'Official Bank Rate', impact: 'High', actual: 5.25, forecast: 5.25, previous: 5.25 },
        { country: 'JPY', event: 'BoJ Press Conference', impact: 'High', actual: null, forecast: null, previous: null },
        // Medium Impact
        { country: 'CAD', event: 'BOC Rate Statement', impact: 'Medium', actual: null, forecast: null, previous: null },
        { country: 'AUD', event: 'RBA Rate Statement', impact: 'Medium', actual: null, forecast: null, previous: null },
        { country: 'USD', event: 'Retail Sales m/m', impact: 'Medium', actual: 0.6, forecast: 0.8, previous: -1.1 },
        { country: 'CNY', event: 'Manufacturing PMI', impact: 'Medium', actual: 50.8, forecast: 50.1, previous: 49.1 },
        { country: 'CHF', event: 'SNB Press Conference', impact: 'Medium', actual: null, forecast: null, previous: null },
        // Low Impact
        { country: 'NZD', event: 'Building Consents m/m', impact: 'Low', actual: -1.9, forecast: null, previous: 0.7 },
        { country: 'USD', event: 'JOLTS Job Openings', impact: 'Low', actual: 8.75, forecast: 8.76, previous: 8.74 },
    ];
    
    const generatedEvents: EconomicEvent[] = [];
    
    weekDays.forEach(day => {
        // Add 2-3 events per day to make it look realistic
        const eventsForDay = Math.floor(Math.random() * 2) + 2; // 2 or 3 events
        for (let i = 0; i < eventsForDay; i++) {
             const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
             const randomHour = Math.floor(Math.random() * 12) + 6; // 6 AM to 5 PM
             const randomMinute = Math.random() > 0.5 ? 30 : 0;
             const eventDate = new Date(day.setHours(randomHour, randomMinute, 0, 0));
             
             // Avoid adding duplicate event for the same day
             if (!generatedEvents.some(e => e.event === randomEvent.event && format(new Date(e.date), 'yyyy-MM-dd') === format(eventDate, 'yyyy-MM-dd'))) {
                generatedEvents.push({
                    ...randomEvent,
                    date: eventDate.toISOString(),
                });
             }
        }
    });

    return generatedEvents;
}
