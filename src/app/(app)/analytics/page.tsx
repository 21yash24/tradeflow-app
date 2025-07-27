
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Target, Scale, BrainCircuit, Loader2 } from 'lucide-react';
import { add, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { backtestStrategy, type BacktestResult } from '@/ai/flows/backtester-flow';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Trade } from '@/components/add-trade-form';


const accountIdToName: Record<string, string> = {
    "acc-1": "Primary Account ($10k)",
    "acc-2": "Prop Firm Challenge ($100k)",
    "acc-3": "Swing Account ($25k)"
};

// Mock data for accounts since we don't have an account management page yet
const mockAccounts = [
    { id: 'acc-1', name: 'Primary Account ($10k)' },
    { id: 'acc-2', name: 'Prop Firm Challenge ($100k)' },
    { id: 'acc-3', name: 'Swing Account ($25k)' },
];


const PerformanceDashboard = () => {
    const [user] = useAuthState(auth);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAccount, setSelectedAccount] = useState('acc-1');
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoadingTrades, setIsLoadingTrades] = useState(true);

     useEffect(() => {
        if (user) {
            setIsLoadingTrades(true);
            const q = query(
                collection(db, "trades"),
                where("userId", "==", user.uid),
                where("accountId", "==", selectedAccount)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tradesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Trade[];
                setTrades(tradesData);
                setIsLoadingTrades(false);
            });
            return () => unsubscribe();
        }
    }, [user, selectedAccount]);


     const analyticsData = useMemo(() => {
        if (isLoadingTrades) {
            return {
                 totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0,
                 avgWin: 0, avgLoss: 0, profitFactor: 0, cumulativePnlData: [], pnlByPairData: [], tradesByDay: {}
            }
        }

        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => t.pnl > 0).length;
        const losingTrades = trades.filter(t => t.pnl <= 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
        const totalWon = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
        const totalLost = trades.filter(t => t.pnl <= 0).reduce((sum, t) => Math.abs(t.pnl), 0);
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
                acc[trade.pair] = { name: trade.pair, pnl: 0 };
            }
            acc[trade.pair].pnl += trade.pnl;
            return acc;
        }, {} as Record<string, { name: string, pnl: number }>);
        
        const pnlByPairData = Object.values(pnlByPair)
            .map(d => ({...d, pnl: parseFloat(d.pnl.toFixed(2))}))
            .sort((a,b) => b.pnl - a.pnl);

        const tradesByDay = trades.reduce((acc, trade) => {
            const dateKey = format(parseISO(trade.date), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = { pnl: 0, trades: 0 };
            }
            acc[dateKey].pnl += trade.pnl;
            acc[dateKey].trades += 1;
            return acc;
        }, {} as Record<string, { pnl: number, trades: number }>);
        
        return {
            totalTrades, winningTrades, losingTrades, winRate, totalPnl,
            avgWin, avgLoss, profitFactor, cumulativePnlData, pnlByPairData, tradesByDay
        };

    }, [trades, isLoadingTrades]);
    
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth),
        end: endOfWeek(lastDayOfMonth),
    });

    const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
    const prevMonth = () => setCurrentDate(add(currentDate, { months: -1 }));

    if (isLoadingTrades) {
        return (
             <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h3 className="text-xl font-semibold">Loading Performance Data</h3>
                <p className="text-muted-foreground">Please wait while we fetch your trading records...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                            {mockAccounts.map(({ id, name }) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net P/L</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", analyticsData.totalPnl >= 0 ? 'text-accent' : 'text-red-400')}>
                            {analyticsData.totalPnl >= 0 ? '+' : '-'}${Math.abs(analyticsData.totalPnl).toFixed(2)}
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
                        <div className="text-2xl font-bold">{analyticsData.winRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">{analyticsData.winningTrades} wins / {analyticsData.losingTrades} losses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                        <Scale className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.profitFactor.toFixed(2)}</div>
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
                            <span className="text-accent">${analyticsData.avgWin.toFixed(2)}</span> / <span className="text-red-400">${analyticsData.avgLoss.toFixed(2)}</span>
                        </div>
                         <p className="text-xs text-muted-foreground">Average result per trade</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Cumulative P/L</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analyticsData.cumulativePnlData}>
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
                <Card>
                    <CardHeader>
                        <CardTitle>P/L by Pair</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData.pnlByPairData} layout="vertical" margin={{ left: -10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        borderColor: "hsl(var(--border))"
                                    }}
                                />
                                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                                     {analyticsData.pnlByPairData.map((entry, index) => (
                                        <div key={`cell-${index}`} className={cn(entry.pnl > 0 ? "fill-primary" : "fill-red-400")} />
                                     ))}
                                     <LabelList 
                                        dataKey="pnl" 
                                        position="right" 
                                        offset={8}
                                        className="fill-foreground font-medium"
                                        formatter={(value:number) => `$${value.toFixed(0)}`}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
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
                            <div key={day} className="py-2 md:py-3 border-r last:border-r-0 text-xs md:text-sm">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6">
                       {daysInMonth.map((day, index) => {
                           const dayStr = format(day, 'yyyy-MM-dd');
                           const data = analyticsData.tradesByDay[dayStr];
                           const isCurrentMonth = isSameMonth(day, currentDate);
                           
                           return (
                               <div key={dayStr} className={cn(
                                   "relative aspect-square p-1.5 text-left border-r border-b flex flex-col",
                                   !isCurrentMonth ? "bg-card/20 text-muted-foreground/50" : "bg-card/50",
                                   (index + 1) % 7 === 0 && "border-r-0",
                                   index >= 35 && "border-b-0",
                                   isToday(day) && "ring-2 ring-primary ring-inset",
                                   data && data.pnl > 0 && "bg-green-800/20",
                                   data && data.pnl <= 0 && "bg-red-800/20",
                               )}>
                                   <div className={cn("text-xs sm:text-sm", isCurrentMonth ? "font-medium" : "font-normal")}>
                                       {format(day, 'd')}
                                   </div>
                                   {data && isCurrentMonth && (
                                       <div className="mt-1 flex-grow flex flex-col justify-end">
                                           <p className={cn(
                                               "text-sm md:text-base font-bold",
                                               data.pnl >= 0 ? "text-accent" : "text-red-400"
                                           )}>
                                               {data.pnl < 0 ? '-' : ''}${Math.abs(data.pnl).toFixed(0)}
                                           </p>
                                           <p className="text-xs text-muted-foreground hidden sm:block">{data.trades} trades</p>
                                       </div>
                                   )}
                               </div>
                           )
                       })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const backtestFormSchema = z.object({
  strategy: z.string().min(10, { message: 'Please describe your strategy in more detail.' }),
  pair: z.string(),
  timeframe: z.string(),
  dateRange: z.string(),
});

const AiBacktester = () => {
    const [results, setResults] = useState<BacktestResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof backtestFormSchema>>({
        resolver: zodResolver(backtestFormSchema),
        defaultValues: {
            strategy: '',
            pair: 'EUR/USD',
            timeframe: '4H',
            dateRange: '1Y',
        },
    });

    const handleRunBacktest = async (values: z.infer<typeof backtestFormSchema>) => {
        setIsLoading(true);
        setResults(null);
        try {
            const result = await backtestStrategy(values);
            setResults(result);
        } catch (error) {
            console.error("Error running backtest:", error);
            // Optionally, show a toast notification here
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configure Backtest</CardTitle>
                    <CardDescription>Define a strategy in plain English and see how it would have performed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleRunBacktest)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="strategy"
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="strategy">Trading Strategy</Label>
                                    <Textarea 
                                        id="strategy" 
                                        placeholder="e.g., 'Buy when the 50 EMA crosses above the 200 EMA on the 4H chart. Sell when it crosses below.'" 
                                        className="min-h-[100px]" 
                                        {...field}
                                    />
                                     {form.formState.errors.strategy && <p className="text-sm font-medium text-destructive">{form.formState.errors.strategy.message}</p>}
                                </FormItem>
                            )}
                        />
                       
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="pair"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Currency Pair</Label>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                                                <SelectItem value="GBP/JPY">GBP/JPY</SelectItem>
                                                <SelectItem value="XAU/USD">XAU/USD</SelectItem>
                                                <SelectItem value="US30">US30</SelectItem>
                                                <SelectItem value="NAS100">NAS100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timeframe"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Timeframe</Label>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1H">1 Hour</SelectItem>
                                                <SelectItem value="4H">4 Hours</SelectItem>
                                                <SelectItem value="1D">Daily</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dateRange"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Date Range</Label>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="3M">Last 3 Months</SelectItem>
                                                <SelectItem value="6M">Last 6 Months</SelectItem>
                                                <SelectItem value="1Y">Last Year</SelectItem>
                                                <SelectItem value="3Y">Last 3 Years</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Backtest...</> : 'Run Backtest'}
                            </Button>
                        </div>
                    </form>
                    </Form>
                </CardContent>
            </Card>

            {isLoading && 
                <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg border border-dashed">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <h3 className="text-xl font-semibold">AI Backtest in Progress</h3>
                    <p className="text-muted-foreground">Please wait while our AI crunches the numbers and simulates your strategy...</p>
                </div>
            }

            {results && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Backtest Results</CardTitle>
                        <CardDescription>Summary of the strategy's performance over the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-muted/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Net P/L</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("text-2xl font-bold", results.netPnl >= 0 ? 'text-accent' : 'text-red-400')}>
                                         {results.netPnl >= 0 ? '+' : '-'}${Math.abs(results.netPnl).toFixed(2)}
                                    </div>
                                </CardContent>
                            </Card>
                             <Card className="bg-muted/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{results.winRate.toFixed(1)}%</div>
                                </CardContent>
                            </Card>
                             <Card className="bg-muted/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                                    <Scale className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{results.profitFactor.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                              <Card className="bg-muted/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{results.totalTrades}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator />
                        
                        <div>
                             <h4 className="font-semibold mb-4 text-center">Equity Curve</h4>
                             <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={results.equityCurve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Trades', position: 'insideBottom', offset: -5 }} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            borderColor: "hsl(var(--border))"
                                        }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>
    )
}

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                An overview of your trading performance and strategy backtesting.
                </p>
            </div>

            <Tabs defaultValue="performance">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="performance">
                        <TrendingUp className="mr-2" />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="ai-backtester">
                        <BrainCircuit className="mr-2" />
                        AI Backtester
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="performance" className="mt-6">
                   <PerformanceDashboard />
                </TabsContent>
                <TabsContent value="ai-backtester" className="mt-6">
                    <AiBacktester />
                </TabsContent>
            </Tabs>
        </div>
    );
}
