
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Filter, BarChart2, Folder, Bell, Info } from "lucide-react";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import React from 'react';
import { getEconomicNews, type EconomicEvent } from '@/services/economic-news';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const getImpactColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
        case 'high': return 'bg-red-500 hover:bg-red-600';
        case 'medium': return 'bg-orange-500 hover:bg-orange-600';
        case 'low': return 'bg-yellow-500 hover:bg-yellow-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
    }
};

const eventsByDate = (events: EconomicEvent[]) => events.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const key = format(eventDate, 'EEEE, LLL d');
    if (!acc[key]) {
        acc[key] = [];
    }
    acc[key].push(event);
    return acc;
}, {} as Record<string, EconomicEvent[]>);


export default async function EconomicNewsPage() {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 });
    
    const fetchedEvents = await getEconomicNews();
    const groupedEvents = eventsByDate(fetchedEvents);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-muted/30">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h3 className="text-md font-semibold text-foreground whitespace-nowrap">
                            This Week: {format(start, 'LLL d')} - {format(end, 'LLL d')}
                        </h3>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm"><Search className="mr-2 h-4 w-4"/>Search Events</Button>
                        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Filter</Button>
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
                            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                                <React.Fragment key={date}>
                                    <TableRow className="bg-muted/20">
                                        <TableCell colSpan={8} className="font-semibold py-2">
                                            {date}
                                        </TableCell>
                                    </TableRow>
                                    {dayEvents.map((event, index) => (
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
