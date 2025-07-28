
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Wand2, Loader2, Info, Bell, Sparkles, Newspaper, Flag } from "lucide-react";
import { format, startOfWeek, endOfWeek, add, sub } from 'date-fns';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getEconomicNews, type EconomicEvent } from '@/services/economic-news';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateMarketBriefing, MarketBriefing } from "@/ai/flows/market-briefing-flow";
import { analyzeSentiment, SentimentAnalysis } from "@/ai/flows/sentiment-analysis-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const getImpactPill = (impact: string) => {
    switch (impact?.toLowerCase()) {
        case 'high': return { text: "High", className: "bg-red-500/10 text-red-400 border-red-500/20" };
        case 'medium': return { text: "Medium", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" };
        case 'low': return { text: "Low", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };
        default: return { text: "None", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
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

const DailyBriefing = ({ events, onBriefingGenerated }: { events: EconomicEvent[], onBriefingGenerated: (briefing: MarketBriefing) => void }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateMarketBriefing({ events });
            onBriefingGenerated(result);
        } catch (error) {
            console.error("Error generating daily briefing:", error);
            toast({ title: 'Error', description: 'Failed to generate briefing.', variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <Button onClick={handleGenerate} disabled={isGenerating || events.length === 0} size="sm" variant="outline">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            AI Daily Briefing
        </Button>
    )
}

const EventCard = React.memo(({ event, onAnalyze }: { event: EconomicEvent, onAnalyze: (event: EconomicEvent) => void }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { toast } = useToast();
    const impactPill = getImpactPill(event.impact);
    
    const handleAnalyzeClick = async () => {
        setIsAnalyzing(true);
        await onAnalyze(event);
        setIsAnalyzing(false);
    };

    return (
        <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{format(new Date(event.date), 'p')}</span>
                        <Badge variant="outline" className={cn("text-xs", impactPill.className)}>{impactPill.text}</Badge>
                         <div className="flex items-center gap-1 text-sm">
                            <Flag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{event.country}</span>
                        </div>
                    </div>
                    <p className="font-semibold mt-1">{event.event}</p>
                </div>
                <div className="flex items-center gap-1 self-start sm:self-center">
                    <TooltipProvider>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleAnalyzeClick} disabled={isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                                 </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Analyze Sentiment</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon"><Bell className="h-4 w-4"/></Button></TooltipTrigger>
                            <TooltipContent><p>Set Alert</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
             <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Actual</p>
                    <p className="font-semibold">{event.actual ?? 'N/A'}</p>
                </div>
                <div className="p-2 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Forecast</p>
                    <p className="font-semibold">{event.forecast ?? 'N/A'}</p>
                </div>
                <div className="p-2 rounded-md bg-muted/40">
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <p className="font-semibold">{event.previous ?? 'N/A'}</p>
                </div>
            </div>
        </div>
    );
});
EventCard.displayName = 'EventCard';


export default function EconomicNewsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [analysisResult, setAnalysisResult] = useState<{ event: EconomicEvent, analysis: SentimentAnalysis } | null>(null);
    const [briefings, setBriefings] = useState<Record<string, MarketBriefing>>({});
    const { toast } = useToast();

    const { start, end } = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
        return { start, end };
    }, [currentDate]);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setBriefings({});
            setAnalysisResult(null);
            const from = format(start, 'yyyy-MM-dd');
            const to = format(end, 'yyyy-MM-dd');
            const fetchedEvents = await getEconomicNews(from, to);
            setEvents(fetchedEvents);
            setIsLoading(false);
        };
        fetchEvents();
    }, [start, end]);

    const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);
    
    const handlePrevWeek = () => setCurrentDate(sub(currentDate, { weeks: 1 }));
    const handleNextWeek = () => setCurrentDate(add(currentDate, { weeks: 1 }));
    
    const handleAnalyzeSentiment = useCallback(async (event: EconomicEvent) => {
        setAnalysisResult(null);
        // This is a placeholder as we don't have real article URLs
        const mockArticleUrl = `https://www.google.com/search?q=${encodeURIComponent(event.event)}`;
        try {
            const result = await analyzeSentiment({
                 articleUrl: mockArticleUrl,
                 trackedPairs: ["EUR/USD", "GBP/JPY", "USD/CHF"]
            });
            setAnalysisResult({ event, analysis: result });
            toast({ title: 'Sentiment Analysis Complete', description: `Analysis for "${event.event}" is ready.`});
        } catch (error) {
            console.error("Error analyzing sentiment:", error);
            toast({ title: 'Error', description: 'Failed to analyze sentiment.', variant: "destructive" });
        }
    }, [toast]);

    const handleBriefingGenerated = useCallback((dateKey: string, briefing: MarketBriefing) => {
        setBriefings(prev => ({...prev, [dateKey]: briefing}));
    }, []);

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Economic Calendar
                </h1>
                <p className="text-muted-foreground mt-2">
                    Stay ahead of market-moving events with AI-powered analysis.
                </p>
            </div>

            {analysisResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles size={20}/> AI Sentiment Analysis</CardTitle>
                        <CardDescription>Analysis for: {analysisResult.event.event}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Alert>
                            <AlertTitle className="font-semibold">Overall Sentiment: {analysisResult.analysis.overallSentiment}</AlertTitle>
                            <AlertDescription>{analysisResult.analysis.summary}</AlertDescription>
                        </Alert>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            {analysisResult.analysis.pairSentiments.map(ps => (
                                <Card key={ps.pair} className="p-4 bg-muted/40">
                                    <p className="font-semibold">{ps.pair}</p>
                                    <p className="text-sm">Sentiment: <span className="font-medium">{ps.sentiment}</span></p>
                                    <p className="text-sm text-muted-foreground mt-1">{ps.reasoning}</p>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>This Week's Events</CardTitle>
                             <CardDescription>
                                {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-5 w-5" /></Button>
                            <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-5 w-5" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        </div>
                    ) : Object.keys(groupedEvents).length === 0 ? (
                         <div className="text-center py-12 text-muted-foreground">
                            <Newspaper className="mx-auto h-10 w-10 mb-4" />
                            <h3 className="font-semibold text-lg">No economic events found for this week.</h3>
                        </div>
                    ) : (
                        Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
                            <div key={dateKey}>
                                <div className="flex justify-between items-center mb-3 pb-2 border-b">
                                    <h3 className="font-semibold text-lg">{dateKey}</h3>
                                    <DailyBriefing 
                                        events={dayEvents} 
                                        onBriefingGenerated={(briefing) => handleBriefingGenerated(dateKey, briefing)}
                                    />
                                </div>
                                {briefings[dateKey] && (
                                     <Alert className="mb-4">
                                        <Wand2 className="h-4 w-4" />
                                        <AlertTitle className="font-semibold">AI Outlook</AlertTitle>
                                        <AlertDescription>{briefings[dateKey].overallOutlook}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-3">
                                    {dayEvents
                                        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map((event) => (
                                            <EventCard key={`${event.date}-${event.event}`} event={event} onAnalyze={handleAnalyzeSentiment} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
