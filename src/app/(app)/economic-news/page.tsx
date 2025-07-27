
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const events: Record<string, { impact: 'high' | 'medium' | 'low'; title: string }[]> = {
    "2024-07-25": [
        { impact: 'high', title: 'US GDP Growth Rate QoQ Adv' },
        { impact: 'medium', title: 'US Durable Goods Orders MoM' },
    ],
    "2024-07-26": [
        { impact: 'high', title: 'US Core PCE Price Index MoM' },
    ],
    "2024-07-31": [
        { impact: 'high', title: 'FOMC Statement & Federal Funds Rate' },
    ]
};

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
        case 'high': return 'bg-destructive/80 border-destructive';
        case 'medium': return 'bg-orange-500/80 border-orange-500';
        case 'low': return 'bg-yellow-500/80 border-yellow-500';
    }
}

export default function EconomicNewsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const selectedDateString = date ? date.toISOString().split('T')[0] : '';
  const selectedEvents = events[selectedDateString] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Economic News
        </h1>
        <p className="text-muted-foreground mt-2">
          Stay informed about market-moving economic events.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex justify-center items-start">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0"
                modifiers={{
                    // @ts-ignore
                    event: Object.keys(events).map(d => new Date(d + 'T00:00:00'))
                }}
                 modifiersStyles={{
                    event: {
                        border: '2px solid hsl(var(--primary))',
                        borderRadius: '9999px',
                    }
                }}
            />
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Events for {date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'today'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {selectedEvents.length > 0 ? selectedEvents.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <p className="font-medium">{event.title}</p>
                            <Badge className={getImpactColor(event.impact)}>{event.impact}</Badge>
                        </div>
                    )) : (
                        <p className="text-muted-foreground">No significant events for this date.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
