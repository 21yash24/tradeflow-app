
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Filter, BarChart2, Folder, Bell } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

const events = [
    { day: 'Mon', date: 'Jul 28', time: '3:30pm', currency: 'GBP', impact: 'low', detail: 'CBI Realized Sales', actual: '-28', forecast: '-46', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '4:31am', currency: 'GBP', impact: 'low', detail: 'BRC Shop Price Index y/y', actual: '0.2%', forecast: '0.4%', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '12:30pm', currency: 'EUR', impact: 'low', detail: 'Spanish Flash GDP q/q', actual: '0.6%', forecast: '0.6%', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '2:00pm', currency: 'GBP', impact: 'low', detail: 'M4 Money Supply m/m', actual: '0.3%', forecast: '0.2%', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '2:00pm', currency: 'GBP', impact: 'low', detail: 'Mortgage Approvals', actual: '63K', forecast: '63K', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '6:00pm', currency: 'USD', impact: 'medium', detail: 'Goods Trade Balance', actual: '-98.3B', forecast: '-96.4B', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '6:30pm', currency: 'USD', impact: 'low', detail: 'HPI m/m', actual: '-0.1%', forecast: '-0.4%', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '6:30pm', currency: 'USD', impact: 'medium', detail: 'S&P/CS Composite-20 HPI y/y', actual: '2.9%', forecast: '3.4%', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '7:30pm', currency: 'USD', impact: 'high', detail: 'JOLTS Job Openings', actual: '7.49M', forecast: '7.77M', previous: '' },
    { day: 'Tue', date: 'Jul 29', time: '7:30pm', currency: 'USD', impact: 'high', detail: 'CB Consumer Confidence', actual: '95.9', forecast: '93.0', previous: '' },
    { day: 'Wed', date: 'Jul 30', time: '2:00am', currency: 'USD', impact: 'low', detail: 'API Weekly Statistical Bulletin', actual: '', forecast: '', previous: '' },
    { day: 'Wed', date: 'Jul 30', time: '6:30am', currency: 'NZD', impact: 'low', detail: 'ANZ Business Confidence', actual: '46.3', forecast: '', previous: '' },
    { day: 'Wed', date: 'Jul 30', time: '7:00am', currency: 'AUD', impact: 'high', detail: 'CPI q/q', actual: '0.8%', forecast: '0.9%', previous: '' },
];

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
        case 'high': return 'bg-red-500';
        case 'medium': return 'bg-orange-500';
        case 'low': return 'bg-yellow-500';
    }
}

const eventsByDay = events.reduce((acc, event) => {
    const key = `${event.day} ${event.date}`;
    if (!acc[key]) {
        acc[key] = [];
    }
    acc[key].push(event);
    return acc;
}, {} as Record<string, typeof events>);


export default function EconomicNewsPage() {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 });

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
                                <TableHead className="w-28">Date</TableHead>
                                <TableHead className="w-24">Time</TableHead>
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
                            {Object.entries(eventsByDay).map(([day, dayEvents]) => (
                                <React.Fragment key={day}>
                                    <TableRow className="bg-muted/20">
                                        <TableCell colSpan={9} className="font-semibold py-2">
                                            {day}
                                        </TableCell>
                                    </TableRow>
                                    {dayEvents.map((event, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            <TableCell></TableCell>
                                            <TableCell>{event.time}</TableCell>
                                            <TableCell className="font-medium">{event.currency}</TableCell>
                                            <TableCell>
                                                <Badge className={`w-12 h-4 ${getImpactColor(event.impact as any)}`}></Badge>
                                            </TableCell>
                                            <TableCell>{event.detail}</TableCell>
                                            <TableCell className="text-right">{event.actual}</TableCell>
                                            <TableCell className="text-right">{event.forecast}</TableCell>
                                            <TableCell className="text-right">{event.previous}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Folder className="h-4 w-4"/></Button>
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

// Dummy React import to satisfy the linter
import React from 'react';
