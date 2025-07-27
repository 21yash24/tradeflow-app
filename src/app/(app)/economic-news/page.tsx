
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const events: Record<string, { impact: 'high' | 'medium' | 'low'; title: string; currency: string }[]> = {
    "2024-07-25": [
        { impact: 'high', title: 'US GDP Growth Rate QoQ Adv', currency: 'USD' },
        { impact: 'medium', title: 'US Durable Goods Orders MoM', currency: 'USD' },
    ],
    "2024-07-26": [
        { impact: 'high', title: 'US Core PCE Price Index MoM', currency: 'USD' },
        { impact: 'medium', title: 'ECB Press Conference', currency: 'EUR' },
    ],
    "2024-07-30": [
        { impact: 'low', title: 'Japan Unemployment Rate', currency: 'JPY' },
    ],
    "2024-07-31": [
        { impact: 'high', title: 'FOMC Statement & Federal Funds Rate', currency: 'USD' },
        { impact: 'high', title: 'US Non-Farm Payrolls (NFP)', currency: 'USD' },
    ],
    "2024-08-01": [
        { impact: 'high', title: 'Bank of England Interest Rate Decision', currency: 'GBP' },
    ],
     "2024-08-14": [
        { impact: 'high', title: 'US Consumer Price Index (CPI) YoY', currency: 'USD' },
    ]
};

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
        case 'high': return 'bg-destructive/80 border-destructive hover:bg-destructive/90';
        case 'medium': return 'bg-orange-500/80 border-orange-500 hover:bg-orange-500/90';
        case 'low': return 'bg-yellow-500/80 border-yellow-500 hover:bg-yellow-500/90';
    }
}

export default function EconomicNewsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  
  const selectedDateString = date ? date.toISOString().split('T')[0] : '';
  const selectedEvents = events[selectedDateString] || [];

  const handleAlertClick = (eventTitle: string) => {
    toast({
        title: "Alert Set!",
        description: `You will be notified about ${eventTitle}.`,
    })
  }

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
        <Card className="lg:col-span-1 flex justify-center items-start pt-6">
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
                        borderColor: 'hsl(var(--primary))',
                        borderWidth: '2px',
                        borderRadius: '9999px',
                    }
                }}
            />
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Events for {date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'today'}</CardTitle>
                <CardDescription>Major financial announcements and data releases.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {selectedEvents.length > 0 ? selectedEvents.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card/50 transition-all hover:bg-muted/50">
                            <div className="flex flex-col">
                                <p className="font-semibold">{event.title}</p>
                                <p className="text-sm text-muted-foreground">{event.currency}</p>
                            </div>
                           <div className="flex items-center gap-2">
                             <Badge className={getImpactColor(event.impact)}>{event.impact}</Badge>
                             <Button variant="ghost" size="icon" onClick={() => handleAlertClick(event.title)}>
                                <Bell className="h-5 w-5" />
                             </Button>
                           </div>
                        </div>
                    )) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No significant events scheduled for this date.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
