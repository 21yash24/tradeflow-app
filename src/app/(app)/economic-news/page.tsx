
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Wand2, Loader2, Info, BarChart2, Bell } from "lucide-react";
import { format, startOfWeek, endOfWeek, add, sub } from 'date-fns';
import React, { useState, useEffect, useMemo } from 'react';
import { getEconomicNews, type EconomicEvent } from '@/services/economic-news';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateMarketBriefing, MarketBriefing } from "@/ai/flows/market-briefing-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const getImpactColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
        case 'high': return 'bg-red-500 hover:bg-red-600';
        case 'medium': return 'bg-orange-500 hover:bg-orange-600';
        case 'low': return 'bg-yellow-500 hover:bg-yellow-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
    }
};

const groupEventsByDate = (events: EconomicEvent[]) => events.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = format(eventDate, 'EEEE, LLL d');
    if (!acc[key]) {
        acc[key] = [];
    }
    acc[key].push(event);
    return acc;
}, {} as Record<string, EconomicEvent[]>);


export default function EconomicNewsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [briefing, setBriefing] = useState<MarketBriefing | null>(null);

    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            const from = format(start, 'yyyy-MM-dd');
            const to = format(end, 'yyyy-MM-dd');
            const fetchedEvents = await getEconomicNews(from, to); 
            setEvents(fetchedEvents);
            setIsLoading(false);
        };
        fetchEvents();
    }, [start, end]);

    const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);
    const todayEvents = useMemo(() => {
        const todayStr = format(new Date(), 'EEEE, LLL d');
        return groupedEvents[todayStr] || [];
    }, [groupedEvents]);


    const handlePrevWeek = () => {
        setCurrentDate(sub(currentDate, { weeks: 1 }));
    };

    const handleNextWeek = () => {
        setCurrentDate(add(currentDate, { weeks: 1 }));
    };
    
    const handleGenerateBriefing = async () => {
        setIsGenerating(true);
        setBriefing(null);
        try {
            const result = await generateMarketBriefing({ events: todayEvents });
            setBriefing(result);
        } catch (error) {
            console.error("Error generating market briefing:", error);
        } finally {
            setIsGenerating(false);
        }
    }


    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Economic Calendar
                </h1>
                <p className="text-muted-foreground mt-2">
                    Stay ahead of market-moving events.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>AI Market Briefing</CardTitle>
                    <CardDescription>Get a summary of today's key events and their potential impact.</CardDescription>
                </CardHeader>
                <CardContent>
                     {briefing && (
                        <div className="space-y-4">
                            <Alert>
                                <Wand2 className="h-4 w-4" />
                                <AlertTitle className="font-semibold">Today's Outlook</AlertTitle>
                                <AlertDescription>
                                    {briefing.overallOutlook}
                                </AlertDescription>
                            </Alert>
                             <h4 className="font-semibold">Key Events Analysis</h4>
                            <div className="space-y-3">
                                {briefing.eventAnalyses.map((event, index) => (
                                    <div key={index} className="p-3 rounded-md border bg-muted/50 text-sm">
                                        <p className="font-semibold">{event.eventName}</p>
                                        <p className="text-muted-foreground">{event.analysis}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {isGenerating && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                            <Loader2 className="animate-spin h-5 w-5" />
                            <p>Generating your daily briefing...</p>
                        </div>
                    )}
                    {!briefing && !isGenerating && (
                        <Button onClick={handleGenerateBriefing} disabled={todayEvents.length === 0}>
                            {todayEvents.length > 0 ? (
                                <>
                                 <Wand2 className="mr-2 h-4 w-4" />
                                 Generate Today's Briefing
                                </>
                            ) : (
                                "No events scheduled for today."
                            )}
                           
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>This Week's Events</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handlePrevWeek} className="h-8 w-8">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h3 className="text-lg font-semibold text-foreground whitespace-nowrap">
                                {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
                            </h3>
                            <Button variant="outline" size="icon" onClick={handleNextWeek} className="h-8 w-8">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10">
                                <TableHead className="w-28">Time</TableHead>
                                <TableHead className="w-24">Currency</TableHead>
                                <TableHead className="w-24">Impact</TableHead>
                                <TableHead>Detail</TableHead>
                                <TableHead className="text-right">Actual</TableHead>
                                <TableHead className="text-right">Forecast</TableHead>
                                <TableHead className="text-right">Previous</TableHead>
                                <TableHead className="w-32 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        Loading economic events...
                                    </TableCell>
                                </TableRow>
                            ) : Object.keys(groupedEvents).length === 0 ? (
                                 <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No economic events for this week.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(groupedEvents).map(([date, dayEvents]) => (
                                <React.Fragment key={date}>
                                    <TableRow className="bg-muted/20">
                                        <TableCell colSpan={8} className="font-semibold py-2">
                                            {date}
                                        </TableCell>
                                    </TableRow>
                                    {dayEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            <TableCell>{format(new Date(event.date), 'p')}</TableCell>
                                            <TableCell className="font-medium">{event.country}</TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className={`w-12 h-4 rounded-full ${getImpactColor(event.impact)}`}></div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{event.impact} Impact</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>{event.event}</TableCell>
                                            <TableCell className="text-right">{event.actual ?? 'N/A'}</TableCell>
                                            <TableCell className="text-right">{event.forecast ?? 'N/A'}</TableCell>
                                            <TableCell className="text-right">{event.previous ?? 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><BarChart2 className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Bell className="h-4 w-4"/></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            )))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

