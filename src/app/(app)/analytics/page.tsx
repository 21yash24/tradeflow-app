
'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { add, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isEqual, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock data simulating trades
const trades = [
  { date: '2024-07-01', pnl: -221.71, trades: 2 },
  { date: '2024-07-02', pnl: 271.30, trades: 5 },
  { date: '2024-07-10', pnl: 591.58, trades: 4 },
  { date: '2024-07-14', pnl: 316.28, trades: 3 },
  { date: '2024-07-16', pnl: -225.46, trades: 2 },
  { date: '2024-07-17', pnl: 444.54, trades: 2 },
  { date: '2024-07-21', pnl: 6.81, trades: 2 },
  { date: '2024-07-22', pnl: 0.78, trades: 1 },
  { date: '2024-07-23', pnl: 549.04, trades: 3 },
];

const tradesByDay = trades.reduce((acc, trade) => {
    acc[trade.date] = trade;
    return acc;
}, {} as Record<string, { pnl: number, trades: number }>);


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
            const tradeDate = new Date(t.date + 'T00:00:00');
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


    const monthlyPnl = Object.values(tradesByDay).reduce((sum, day) => sum + day.pnl, 0);

    const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
    const prevMonth = () => setCurrentDate(add(currentDate, { months: -1 }));
    const goToToday = () => setCurrentDate(new Date());

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-xl font-semibold text-foreground whitespace-nowrap">
                            {format(currentDate, 'MMM yyyy')}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                     <h3 className="text-lg font-bold text-foreground">
                        Monthly P/L: <span className={monthlyPnl >= 0 ? "text-green-400" : "text-red-400"}>${monthlyPnl.toFixed(2)}</span>
                    </h3>
                </div>
                <Button variant="outline" onClick={goToToday}>Today</Button>
            </div>
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-semibold border-b">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'].map(day => (
                            <div key={day} className="py-3 border-r">{day}</div>
                        ))}
                         <div className="py-3">Sa</div>
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6">
                       {daysInMonth.map((day, index) => {
                           const dayStr = format(day, 'yyyy-MM-dd');
                           const data = tradesByDay[dayStr];
                           const isCurrentMonth = isSameMonth(day, currentDate);

                           // Weekly summary for Saturday column
                           if (getDay(day) === 6) {
                               const weekIndex = Math.floor(index / 7);
                               const weekData = weeklyData[weekIndex];
                               if (!weekData) return <div key={dayStr} className="h-28 border-l bg-card/10"></div>;

                               return (
                                   <div key={dayStr} className={cn("h-28 p-2 text-left border-l", isCurrentMonth ? 'bg-card/30' : 'bg-card/10')}>
                                       <p className="text-xs font-bold">Week {weekData.week}</p>
                                       <p className={cn("text-lg font-bold", weekData.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                                           ${weekData.pnl.toFixed(2)}
                                       </p>
                                       <p className="text-xs text-muted-foreground">{weekData.count} trades</p>
                                   </div>
                               )
                           }
                           
                           return (
                               <div key={dayStr} className={cn(
                                   "h-28 p-2 text-left border-r border-b",
                                   !isCurrentMonth ? "bg-card/10 text-muted-foreground/50" : "",
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
                                               "text-lg font-bold",
                                               data.pnl > 0 ? "text-green-400" : "text-red-400"
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
