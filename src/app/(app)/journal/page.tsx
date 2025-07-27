
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Image as ImageIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTradeFlow, type Trade } from "@/components/add-trade-form";
import Image from "next/image";

const initialTrades: Trade[] = [
  {
    id: "1",
    accountId: "acc-1",
    pair: "EUR/USD",
    date: "2024-05-20",
    type: "buy",
    pnl: 150.75,
    setup: "Breakout",
    notes: "Followed plan perfectly.",
    confidence: 80,
    mentalState: "Focused and disciplined.",
    screenshot: "https://placehold.co/1200x800.png"
  },
  {
    id: "2",
    accountId: "acc-1",
    pair: "GBP/JPY",
    date: "2024-05-19",
    type: "sell",
    pnl: -75.2,
    setup: "Reversal",
    notes: "Exited too early.",
    confidence: 60,
    mentalState: "A bit anxious due to volatility."
  },
  {
    id: "3",
    accountId: "acc-2",
    pair: "AUD/CAD",
    date: "2024-05-18",
    type: "buy",
    pnl: 230.0,
    setup: "Continuation",
    notes: "Good risk management.",
    confidence: 90,
    mentalState: "Confident and in the zone.",
    screenshot: "https://placehold.co/1200x800.png"
  },
];

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isAddTradeDialogOpen, setAddTradeDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const handleAddTrade = (newTrade: Omit<Trade, 'id'>) => {
    console.log("New trade added:", newTrade);
    setTrades(prevTrades => [
        { ...newTrade, id: (prevTrades.length + 1).toString() },
        ...prevTrades
    ]);
    setAddTradeDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Trading Journal
          </h1>
          <p className="text-muted-foreground mt-2">
            Log your trades and reflect on your decisions.
          </p>
        </div>
        <Dialog open={isAddTradeDialogOpen} onOpenChange={setAddTradeDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Trade</DialogTitle>
              <DialogDescription>
                Follow the steps to log a new trade to your journal.
              </DialogDescription>
            </DialogHeader>
            <AddTradeFlow onSubmit={handleAddTrade} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency Pair</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead className="text-center">Chart</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.pair}</TableCell>
                  <TableCell>{trade.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={trade.type === "buy" ? "default" : "destructive"}
                      className={
                        trade.type === "buy"
                          ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                      }
                    >
                      {trade.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      trade.pnl > 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    ${trade.pnl.toFixed(2)}
                  </TableCell>
                  <TableCell>{trade.setup}</TableCell>
                   <TableCell className="text-center">
                    {trade.screenshot && (
                      <Button variant="ghost" size="icon" onClick={() => setViewingImage(trade.screenshot!)}>
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Dialog open={!!viewingImage} onOpenChange={(isOpen) => !isOpen && setViewingImage(null)}>
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
  );
}
