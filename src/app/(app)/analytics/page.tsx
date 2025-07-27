
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const pnlData = [
  { name: 'Jan', pnl: 400 },
  { name: 'Feb', pnl: 300 },
  { name: 'Mar', pnl: 500 },
  { name: 'Apr', pnl: -200 },
  { name: 'May', pnl: 600 },
  { name: 'Jun', pnl: 800 },
];

const winLossData = [
    { name: 'Wins', value: 75, fill: 'hsl(var(--chart-1))' },
    { name: 'Losses', value: 25, fill: 'hsl(var(--destructive))' },
];


export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Performance Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize your trading performance and identify patterns.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Win/Loss Ratio</CardTitle>
                <CardDescription>A breakdown of your winning and losing trades.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={winLossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {winLossData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Cumulative P/L</CardTitle>
                <CardDescription>Your profit and loss over time.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{pnl: {label: 'P/L', color: 'hsl(var(--chart-1))'}}} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pnlData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
                            <Line type="monotone" dataKey="pnl" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
