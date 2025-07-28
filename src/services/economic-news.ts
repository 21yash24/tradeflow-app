
'use server';

import { z } from 'zod';
import { eachDayOfInterval, format, startOfWeek, endOfWeek, getDay } from 'date-fns';

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

// This service relies on high-quality mock data to ensure full functionality
// without requiring an external API key.
export async function getEconomicNews(from?: string, to?: string): Promise<EconomicEvent[]> {
  // The 'from' and 'to' params are kept for potential future integration with a live API.
  return getRealisticMockData();
}

// Generates a more structured and realistic set of mock data for a week.
function getRealisticMockData(): EconomicEvent[] {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const weekDays = eachDayOfInterval({ start, end });

    const weeklySchedule: Record<number, Omit<EconomicEvent, 'date'>[]> = {
        1: [ // Monday
            { country: 'CHF', event: 'Unemployment Rate', impact: 'Low', actual: 2.3, forecast: 2.3, previous: 2.2 },
            { country: 'EUR', event: 'Sentix Investor Confidence', impact: 'Low', actual: -10.5, forecast: -11.3, previous: -12.9 },
            { country: 'JPY', event: 'BoJ Gov Ueda Speaks', impact: 'Medium', actual: null, forecast: null, previous: null },
        ],
        2: [ // Tuesday
            { country: 'AUD', event: 'NAB Business Confidence', impact: 'Low', actual: 1, forecast: null, previous: -1 },
            { country: 'GBP', event: 'Claimant Count Change', impact: 'Medium', actual: 10.9, forecast: 10.2, previous: 8.9 },
            { country: 'USD', event: 'NFIB Small Business Index', impact: 'Low', actual: 89.4, forecast: 89.8, previous: 89.7 },
        ],
        3: [ // Wednesday
            { country: 'CNY', event: 'CPI y/y', impact: 'Medium', actual: 0.3, forecast: 0.2, previous: 0.1 },
            { country: 'GBP', event: 'GDP m/m', impact: 'Medium', actual: 0.6, forecast: 0.4, previous: 0.1 },
            { country: 'USD', event: 'Core CPI m/m', impact: 'High', actual: 0.3, forecast: 0.3, previous: 0.4 },
            { country: 'USD', event: 'FOMC Economic Projections', impact: 'High', actual: null, forecast: null, previous: null },
            { country: 'USD', event: 'FOMC Press Conference', impact: 'High', actual: null, forecast: null, previous: null },
        ],
        4: [ // Thursday
            { country: 'AUD', event: 'Employment Change', impact: 'High', actual: 39.7, forecast: 23.7, previous: -6.6 },
            { country: 'EUR', event: 'Industrial Production m/m', impact: 'Low', actual: 0.6, forecast: 0.2, previous: -1.0 },
            { country: 'USD', event: 'PPI m/m', impact: 'Medium', actual: 0.2, forecast: 0.3, previous: 0.5 },
            { country: 'USD', event: 'Unemployment Claims', impact: 'Medium', actual: 242, forecast: 225, previous: 229 },
        ],
        5: [ // Friday
            { country: 'NZD', event: 'BusinessNZ Manufacturing Index', impact: 'Low', actual: 48.9, forecast: null, previous: 48.9 },
            { country: 'JPY', event: 'BoJ Policy Rate', impact: 'High', actual: null, forecast: 0.10, previous: 0.10 },
            { country: 'JPY', event: 'BoJ Press Conference', impact: 'High', actual: null, forecast: null, previous: null },
            { country: 'EUR', event: 'ECB President Lagarde Speaks', impact: 'Medium', actual: null, forecast: null, previous: null },
            { country: 'USD', event: 'Prelim UoM Consumer Sentiment', impact: 'Medium', actual: 65.6, forecast: 72.1, previous: 69.1 },
        ],
        0: [], // Sunday - No events
        6: [], // Saturday - No events
    };
    
    const generatedEvents: EconomicEvent[] = [];
    const eventTimes = ['08:30', '09:00', '10:00', '13:30', '14:30', '15:00', '16:00', '21:00'];
    
    weekDays.forEach(day => {
        const dayOfWeek = getDay(day);
        const eventsForDay = weeklySchedule[dayOfWeek];

        if (eventsForDay) {
            eventsForDay.forEach((event, index) => {
                const timeStr = eventTimes[index % eventTimes.length];
                const [hour, minute] = timeStr.split(':');
                const eventDate = new Date(day);
                eventDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

                generatedEvents.push({
                    ...event,
                    date: eventDate.toISOString(),
                });
            });
        }
    });

    return generatedEvents;
}
