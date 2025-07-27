
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Target, Scale, Percent } from 'lucide-react';
import { add, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isEqual, isSameMonth, isToday, startOfMonth, startOfWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock data simulating trades
const trades = [
  { date: '2024-07-01', pnl: -221.71, trades: 2, pair: 'EUR/USD' },
  { date: '2024-07-02', pnl: 271.30, trades: 5, pair: 'GBP/JPY' },
  { date: '2024-07-03', pnl: 150.00, trades: 1, pair: 'EUR/USD' },
  { date: '2024-07-08', pnl: -50.25, trades: 1, pair: 'AUD/CAD' },
  { date: '2024-07-10', pnl: 591.58, trades: 4, pair: 'EUR/USD' },
  { date: '2024-07-14', pnl: 316.28, trades: 3, pair: 'USD/CHF' },
  { date: '2024-07-16', pnl: -225.46, trades: 2, pair: 'GBP/JPY' },
  { date: '2024-07-17', pnl: 444.54, trades: 2, pair: 'EUR/USD' },
  { date: '2024-07-21', pnl: 6.81, trades: 2, pair: 'AUD/CAD' },
  { date: '2024-07-22', pnl: 0.78, trades: 1, pair: 'USD/CHF' },
  { date: '2024-07-23', pnl: 549.04, trades: 3, pair: 'GBP/JPY' },
  { date: '2024-07-29', pnl: -120.90, trades: 2, pair: 'EUR/USD' },
];

const tradesByDay = trades.reduce((acc, trade) => {
    if (!acc[trade.date]) {
        acc[trade.date] = { pnl: 0, trades: 0 };
    }
    acc[trade.date].pnl += trade.pnl;
    acc[trade.date].trades += trade.trades;
    return acc;
}, {} as Record<string, { pnl: number, trades: number }>);

// --- Analytics Calculations ---
const totalTrades = trades.length;
const winningTrades = trades.filter(t => t.pnl > 0).length;
const losingTrades = trades.filter(t => t.pnl <= 0).length;
const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
const totalWon = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
const totalLost = trades.filter(t => t.pnl <= 0).reduce((sum, t) => Math.abs(sum + t.pnl), 0);
const avgWin = winningTrades > 0 ? totalWon / winningTrades : 0;
const avgLoss = losingTrades > 0 ? totalLost / losingTrades : 0;
const profitFactor = totalLost > 0 ? totalWon / totalLost : 0;

const cumulativePnlData = trades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, trade, index) => {
        const cumulativePnl = (acc[index - 1]?.cumulativePnl || 0) + trade.pnl;
        acc.push({ name: `Trade ${index + 1}`, cumulativePnl: parseFloat(cumulativePnl.toFixed(2)) });
        return acc;
    }, [] as { name: string; cumulativePnl: number }[]);

const pnlByPair = trades.reduce((acc, trade) => {
    if (!acc[trade.pair]) {
        acc[trade.pair] = { name: trade.pair, value: 0 };
    }
    acc[trade.pair].value += trade.pnl;
    return acc;
}, {} as Record<string, { name: string, value: number }>);

const pnlByPairData = Object.values(pnlByPair).map(d => ({...d, value: parseFloat(d.value.toFixed(2))}));


export default function AnalyticsPage() {
    const [currentDate, setCurrentDate] = useState(new Date('2024-07-01'));

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth),
        end: endOfWeek(lastDayOfMonth),
    });

    const getWeekNumber = (date: Date) => {
        return Math.ceil(date.getDate() / 7);
    }
    
    const weeklyData = Array.from({ length: 6 }).map((_, weekIndex) => {
        const start = add(startOfWeek(firstDayOfMonth), { weeks: weekIndex });
        if (!isSameMonth(start, firstDayOfMonth) && weekIndex > 0) return null;

        const end = endOfWeek(start);
        const weekTrades = trades.filter(t => {
            const tradeDate = parseISO(t.date);
            return tradeDate >= start && tradeDate <= end && isSameMonth(tradeDate, firstDayOfMonth);
        });
        
        const pnl = weekTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        const count = weekTrades.reduce((sum, trade) => sum + trade.trades, 0);

        if (count === 0 && !isSameMonth(start, firstDayOfMonth)) return null;

        return {
            week: getWeekNumber(add(start, {days: 3})), // get week number from a mid-week day
            pnl,
            count
        };
    }).filter(Boolean);


    const monthlyPnl = trades.filter(t => isSameMonth(parseISO(t.date), currentDate)).reduce((sum, day) => sum + day.pnl, 0);

    const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
    const prevMonth = () => setCurrentDate(add(currentDate, { months: -1 }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                An overview of your trading performance.
                </p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net P/L</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total profit and loss</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">{winningTrades} wins / {losingTrades} losses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                        <Scale className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profitFactor.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Gross profit / gross loss</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Win / Loss</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <span className="text-green-400">${avgWin.toFixed(2)}</span> / <span className="text-red-400">${avgLoss.toFixed(2)}</span>
                        </div>
                         <p className="text-xs text-muted-foreground">Average result per trade</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Cumulative P/L Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Cumulative P/L</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={cumulativePnlData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        borderColor: "hsl(var(--border))"
                                    }}
                                />
                                <Line type="monotone" dataKey="cumulativePnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                 {/* P/L by Pair Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>P/L by Pair</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Tooltip
                                     contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        borderColor: "hsl(var(--border))"
                                    }}
                                />
                                <Pie data={pnlByPairData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="hsl(var(--accent))" label={(entry) => entry.name}>
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar View */}
            <Card>
                <CardHeader>
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Trading Calendar</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h3 className="text-lg font-semibold text-foreground whitespace-nowrap">
                                {format(currentDate, 'MMMM yyyy')}
                            </h3>
                            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-semibold border-b">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-3 border-r last:border-r-0">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6">
                       {daysInMonth.map((day, index) => {
                           const dayStr = format(day, 'yyyy-MM-dd');
                           const data = tradesByDay[dayStr];
                           const isCurrentMonth = isSameMonth(day, currentDate);
                           
                           return (
                               <div key={dayStr} className={cn(
                                   "h-28 p-2 text-left border-r border-b",
                                   !isCurrentMonth ? "bg-card/20 text-muted-foreground/50" : "bg-card/50",
                                   (index + 1) % 7 === 0 && "border-r-0",
                                   index >= 35 && "border-b-0",
                                   isToday(day) && "ring-2 ring-primary ring-inset",
                                   data && data.pnl > 0 && "bg-green-800/20",
                                   data && data.pnl <= 0 && "bg-red-800/20",
                               )}>
                                   <div className={cn("text-sm", isCurrentMonth ? "font-medium" : "font-normal")}>
                                       {format(day, 'd')}
                                   </div>
                                   {data && isCurrentMonth && (
                                       <div className="mt-2">
                                           <p className={cn(
                                               "text-base font-bold",
                                               data.pnl >= 0 ? "text-green-400" : "text-red-400"
                                           )}>
                                               {data.pnl < 0 ? '-' : ''}${Math.abs(data.pnl).toFixed(2)}
                                           </p>
                                           <p className="text-xs text-muted-foreground">{data.trades} trades</p>
                                       </div>
                                   )}
                               </div>
                           )
                       })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
