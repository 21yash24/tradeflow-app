
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Target, Scale, BrainCircuit, Loader2, PlusCircle, Trash2, Wallet, Edit, FileText, Image as ImageIcon, ArrowRight, Lightbulb, ShieldCheck, Upload, AlertCircle, Send } from 'lucide-react';
import { add, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from '@/components/ui/form';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Trade } from '@/components/add-trade-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type Account = {
    id: string;
    name: string;
    balance: number;
    riskPerTrade?: number;
    userId: string;
    createdAt: any;
}

const accountFormSchema = z.object({
    name: z.string().min(2, { message: "Account name must be at least 2 characters." }),
    balance: z.coerce.number().positive({ message: "Starting balance must be a positive number." }),
    riskPerTrade: z.coerce.number().positive({ message: "Risk amount must be a positive number." }).optional(),
})

const ManageAccountsDialog = ({ accounts, onAccountCreated }: { accounts: Account[], onAccountCreated: () => void }) => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const form = useHookForm<z.infer<typeof accountFormSchema>>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: { name: "", balance: 10000, riskPerTrade: undefined },
    });

    useEffect(() => {
        if(editingAccount) {
            form.reset(editingAccount);
        } else {
            form.reset({ name: "", balance: 10000, riskPerTrade: undefined });
        }
    }, [editingAccount, form]);
    
    const handleAccountSubmit = async (values: z.infer<typeof accountFormSchema>) => {
        if (!user) return;
        setIsSubmitting(true);
        
        try {
            const dataToSave = {
                ...values,
                riskPerTrade: values.riskPerTrade || null, // Store null if empty
            }

            if (editingAccount) {
                // Update existing account
                const accountRef = doc(db, "accounts", editingAccount.id);
                await updateDoc(accountRef, dataToSave);
                toast({ title: "Account Updated", description: `Account "${values.name}" has been updated.` });
            } else {
                // Create new account
                 await addDoc(collection(db, "accounts"), {
                    ...dataToSave,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Account Created!", description: `Account "${values.name}" has been added.` });
            }
            form.reset({ name: "", balance: 10000, riskPerTrade: undefined });
            setEditingAccount(null);
            onAccountCreated();
        } catch (error) {
            console.error("Error submitting account:", error);
            toast({ title: "Error", description: `Could not save account.`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDeleteAccount = async (accountId: string) => {
        if (window.confirm("Are you sure you want to delete this account? This will not delete its trades but they will be unassigned.")) {
            try {
                await deleteDoc(doc(db, "accounts", accountId));
                toast({ title: "Account Deleted", description: "The account has been removed." });
            } catch (error) {
                 console.error("Error deleting account:", error);
                 toast({ title: "Error", description: "Could not delete account.", variant: "destructive" });
            }
        }
    };

    return (
        <Dialog onOpenChange={(isOpen) => !isOpen && setEditingAccount(null)}>
            <DialogTrigger asChild>
                <Button variant="outline"><Wallet className="mr-2 h-4 w-4"/> Manage Accounts</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Trading Accounts</DialogTitle>
                    <DialogDescription>Create, edit, or delete your trading accounts.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Existing Accounts</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {accounts.length > 0 ? accounts.map(acc => (
                            <div key={acc.id} className="flex justify-between items-center bg-muted p-2 rounded-md">
                                <div>
                                    <p className="font-medium">{acc.name}</p>
                                    <p className="text-sm text-muted-foreground">Balance: ${acc.balance.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center">
                                     <Button variant="ghost" size="icon" onClick={() => setEditingAccount(acc)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(acc.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No accounts found. Create one below.</p>
                        )}
                    </div>
                    
                     <h3 className="font-semibold text-lg">{editingAccount ? "Edit Account" : "Create New Account"}</h3>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAccountSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        
                                        <FormControl>
                                            <Input placeholder="e.g., Prop Firm Challenge" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="balance"
                                render={({ field }) => (
                                    <FormItem>
                                        
                                        <FormControl>
                                            <Input type="number" placeholder="Starting Balance" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="riskPerTrade"
                                render={({ field }) => (
                                    <FormItem>
                                        
                                        <FormControl>
                                            <Input type="number" placeholder="Risk Amount Per Trade ($)" value={field.value ?? ''} {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Optional. If empty, P/L will be calculated as 1% of the balance per R.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                {editingAccount && <Button variant="ghost" type="button" onClick={() => setEditingAccount(null)}>Cancel</Button>}
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : editingAccount ? <Edit className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    {editingAccount ? 'Save Changes' : 'Create Account'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const PerformanceDashboard = () => {
    const [user] = useAuthState(auth);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);
    const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

     useEffect(() => {
        if (user) {
            const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const accountsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Account[];
                setAccounts(accountsData);
                if (!selectedAccount && accountsData.length > 0) {
                    setSelectedAccount(accountsData[0].id);
                }
                 if(accountsData.length === 0) {
                    setIsLoading(false);
                }
            });
            return () => unsubscribe();
        } else {
             setIsLoading(false);
        }
    }, [user, selectedAccount]);

     useEffect(() => {
        if (user) {
            setIsLoading(true);
            const q = query(
                collection(db, "trades"),
                where("userId", "==", user.uid),
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tradesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Trade[];
                setTrades(tradesData.filter(trade => !trade.deleted)); // Filter out soft-deleted trades
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setTrades([]);
            setIsLoading(false);
        }
    }, [user]);

    const calculatePnl = useCallback((trade: Trade, account: Account) => {
        const riskAmount = account.riskPerTrade || (account.balance * 0.01);
        const rr = trade.rrDetails?.[account.id] ?? trade.rr;
        return riskAmount * (rr || 0);
    }, []);

     const analyticsData = useMemo(() => {
        if (isLoading || !selectedAccount) {
            return {
                 totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0,
                 avgWin: 0, avgLoss: 0, profitFactor: 0, cumulativePnlData: [], pnlByPairData: [], tradesByDay: {}
            }
        }
        
        const accountTrades = trades.filter(trade => trade.accountIds && trade.accountIds.includes(selectedAccount));
        const currentAccount = accounts.find(acc => acc.id === selectedAccount);
        if (!currentAccount) return {
             totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0,
             avgWin: 0, avgLoss: 0, profitFactor: 0, cumulativePnlData: [], pnlByPairData: [], tradesByDay: {}
        };

        const totalTrades = accountTrades.length;
        const winningTrades = accountTrades.filter(t => calculatePnl(t, currentAccount) > 0).length;
        const losingTrades = accountTrades.filter(t => calculatePnl(t, currentAccount) <= 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        const totalPnl = accountTrades.reduce((sum, t) => sum + calculatePnl(t, currentAccount), 0);
        const totalWon = accountTrades.filter(t => calculatePnl(t, currentAccount) > 0).reduce((sum, t) => sum + calculatePnl(t, currentAccount), 0);
        const totalLost = accountTrades.filter(t => calculatePnl(t, currentAccount) <= 0).reduce((sum, t) => Math.abs(calculatePnl(t, currentAccount)), 0);
        
        const avgWin = winningTrades > 0 ? totalWon / winningTrades : 0;
        const avgLoss = losingTrades > 0 ? totalLost / losingTrades : 0;
        const profitFactor = totalLost > 0 ? totalWon / totalLost : 0;

        const cumulativePnlData = accountTrades
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .reduce((acc, trade, index) => {
                const pnl = calculatePnl(trade, currentAccount);
                const cumulativePnl = (acc[index - 1]?.cumulativePnl || 0) + pnl;
                acc.push({ name: `Trade ${index + 1}`, cumulativePnl: parseFloat(cumulativePnl.toFixed(2)) });
                return acc;
            }, [] as { name: string; cumulativePnl: number }[]);

        const pnlByPair = accountTrades.reduce((acc, trade) => {
            const pnl = calculatePnl(trade, currentAccount);
            if (!acc[trade.pair]) {
                acc[trade.pair] = { name: trade.pair, pnl: 0 };
            }
            acc[trade.pair].pnl += pnl;
            return acc;
        }, {} as Record<string, { name: string, pnl: number }>);
        
        const pnlByPairData = Object.values(pnlByPair)
            .map(d => ({...d, pnl: parseFloat(d.pnl.toFixed(2))}))
            .sort((a,b) => b.pnl - a.pnl);

        const tradesByDay = accountTrades.reduce((acc, trade) => {
            const dateKey = format(parseISO(trade.date), 'yyyy-MM-dd');
            const pnl = calculatePnl(trade, currentAccount);
            if (!acc[dateKey]) {
                acc[dateKey] = { pnl: 0, trades: 0 };
            }
            acc[dateKey].pnl += pnl;
            acc[dateKey].trades += 1;
            return acc;
        }, {} as Record<string, { pnl: number, trades: number }>);
        
        return {
            totalTrades, winningTrades, losingTrades, winRate, totalPnl,
            avgWin, avgLoss, profitFactor, cumulativePnlData, pnlByPairData, tradesByDay
        };

    }, [trades, isLoading, selectedAccount, accounts, calculatePnl]);
    
    const accountsWithPnl = useMemo(() => {
        return accounts.map(account => {
            const accountTrades = trades.filter(trade => trade.accountIds && trade.accountIds.includes(account.id));
            const totalPnl = accountTrades.reduce((sum, trade) => sum + calculatePnl(trade, account), 0);
            return {
                ...account,
                totalPnl,
                currentBalance: account.balance + totalPnl,
            };
        });
    }, [accounts, trades, calculatePnl]);


    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(firstDayOfMonth),
        end: endOfWeek(lastDayOfMonth),
    });

    const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
    const prevMonth = () => setCurrentDate(add(currentDate, { months: -1 }));

    const handleDayClick = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const accountTrades = trades.filter(trade => trade.accountIds && selectedAccount && trade.accountIds.includes(selectedAccount));
        const dayTrades = accountTrades.filter(trade => format(parseISO(trade.date), 'yyyy-MM-dd') === dayStr);

        if (dayTrades.length > 0) {
            setSelectedDayTrades(dayTrades);
            setIsDayDetailOpen(true);
        }
    };


    if (isLoading) {
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
                {accountsWithPnl.length > 0 && selectedAccount ? (
                     <Select value={selectedAccount} onValueChange={(val) => setSelectedAccount(val)}>
                        <SelectTrigger className="w-full sm:w-[380px]">
                            <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accountsWithPnl.map(({ id, name, balance, currentBalance, totalPnl }) => (
                                <SelectItem key={id} value={id}>
                                    <div className='flex justify-between items-center w-full'>
                                        <span>{name}</span>
                                        <div className='flex items-center gap-2 text-xs'>
                                            <span>${balance.toLocaleString()}</span>
                                            <ArrowRight size={12}/>
                                            <span className={cn(totalPnl > 0 ? 'text-green-500' : 'text-red-500')}>${currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Card className="w-full text-center p-4 bg-muted/50">
                        <p className="text-muted-foreground">No accounts found. Create one to start tracking.</p>
                    </Card>
                )}
                 <ManageAccountsDialog accounts={accounts} onAccountCreated={() => {}}/>
                </div>
            
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net P/L</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", analyticsData.totalPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
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
                        <div className="text-xl sm:text-2xl font-bold">
                            <span className="text-green-500">${analyticsData.avgWin.toFixed(2)}</span> / <span className="text-red-500">${analyticsData.avgLoss.toFixed(2)}</span>
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
                            <RadialBarChart 
                                data={analyticsData.pnlByPairData} 
                                innerRadius="30%" 
                                outerRadius="100%"
                                startAngle={90}
                                endAngle={-270}
                            >
                                <RadialBar
                                    background
                                    dataKey='pnl'
                                >
                                     <LabelList 
                                        position="insideStart" 
                                        dataKey="name"
                                        className="fill-background dark:fill-primary-foreground text-xs"
                                        />
                                    {analyticsData.pnlByPairData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl > 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                                    ))}
                                </RadialBar>
                                 <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border border-border p-2 rounded-md shadow-lg">
                                                    <p className="font-semibold">{`${payload[0].payload.name}`}</p>
                                                    <p className="text-sm">{`P/L: $${payload[0].value}`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </RadialBarChart>
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
                               <div key={dayStr}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                   "relative aspect-square p-1.5 text-left border-r border-b flex flex-col",
                                   !isCurrentMonth ? "bg-card/20 text-muted-foreground/50" : "bg-card/50",
                                   (index + 1) % 7 === 0 && "border-r-0",
                                   index >= 35 && "border-b-0",
                                   isToday(day) && "ring-2 ring-primary ring-inset",
                                   data && data.pnl > 0 && "bg-green-800/20",
                                   data && data.pnl <= 0 && "bg-red-800/20",
                                   data && isCurrentMonth && 'cursor-pointer hover:bg-muted transition-colors'
                               )}>
                                   <div className={cn("text-xs sm:text-sm", isCurrentMonth ? "font-medium" : "font-normal")}>
                                       {format(day, 'd')}
                                   </div>
                                   {data && isCurrentMonth && (
                                       <div className="mt-1 flex-grow flex flex-col justify-end">
                                           <p className={cn(
                                               "text-sm md:text-base font-bold",
                                               data.pnl >= 0 ? "text-green-500" : "text-red-500"
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

            <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Trades for {selectedDayTrades.length > 0 ? format(parseISO(selectedDayTrades[0].date), 'MMMM d, yyyy') : ''}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {selectedDayTrades.map(trade => {
                             const currentAccount = selectedAccount ? accounts.find(acc => acc.id === selectedAccount) : null;
                             const pnl = currentAccount ? calculatePnl(trade, currentAccount) : 0;
                             const rr = currentAccount ? (trade.rrDetails?.[currentAccount.id] ?? trade.rr) : 0;
                            return (
                                <Card key={trade.id} className="p-4">
                                     <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{trade.pair}</h4>
                                                 <Badge
                                                    variant={trade.type === "buy" ? "default" : "destructive"}
                                                    className={cn("h-5", trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500')}
                                                >
                                                    {trade.type}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{trade.setup}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className={cn("font-bold", pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                             </p>
                                            <p className="text-sm text-muted-foreground">{rr.toFixed(2)}R</p>
                                        </div>
                                     </div>
                                     {trade.notes && (
                                         <div className="mt-2 space-y-1">
                                             <h5 className="font-semibold flex items-center gap-2 text-sm"><FileText size={14}/> Notes</h5>
                                             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border whitespace-pre-wrap">{trade.notes}</p>
                                         </div>
                                     )}
                                     {trade.screenshot && (
                                        <div className="mt-2 space-y-1">
                                            <h5 className="font-semibold flex items-center gap-2 text-sm"><ImageIcon size={14}/> Chart</h5>
                                            <div
                                                className="relative w-full h-48 rounded-md border overflow-hidden cursor-pointer group"
                                                onClick={() => {
                                                    setViewingImage(trade.screenshot!);
                                                    setIsDayDetailOpen(false);
                                                }}
                                            >
                                                <Image src={trade.screenshot} alt="Trade Screenshot" layout="fill" objectFit="cover" />
                                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-semibold">Click to enlarge</p>
                                                </div>
                                            </div>
                                        </div>
                                     )}
                                </Card>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={!!viewingImage} onOpenChange={(isOpen) => {
                 if (!isOpen) {
                    setViewingImage(null);
                    setIsDayDetailOpen(true);
                 }
            }}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Trade Screenshot</DialogTitle>
                    </DialogHeader>
                    {viewingImage && (
                        <div className="mt-4">
                            <Image src={viewingImage} alt="Trade Screenshot" width={1200} height={800} className="rounded-md" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
                An overview of your trading performance and strategy analysis.
                </p>
            </div>

            <PerformanceDashboard />

        </div>
    );
}
