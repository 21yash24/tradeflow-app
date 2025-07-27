
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Image as ImageIcon, FileText, Wand2, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { analyzeTrade, TradeAnalysis } from "@/ai/flows/trade-analyst-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialTrades: Trade[] = [
  {
    id: "1",
    accountId: "acc-1",
    pair: "EUR/USD",
    date: "2024-05-20",
    type: "buy",
    pnl: 150.75,
    setup: "Breakout",
    notes: "Followed plan perfectly. Entry was at the break of the consolidation zone after the London open. There was clear momentum, and the price hit TP1 within 30 minutes. Moved SL to break-even and let the rest run.",
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
    notes: "Exited too early. The initial move went against me, and I panicked, closing the position manually before it hit my SL. The trade eventually would have been a small winner. Need to trust my analysis and stop-loss placement.",
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
    notes: "Good risk management. Waited for a pullback to the 50 EMA on the 1-hour chart, which aligned with a key support level. Entry was confirmed by a bullish engulfing candle. Excellent execution.",
    confidence: 90,
    mentalState: "Confident and in the zone.",
    screenshot: "https://placehold.co/1200x800.png"
  },
];

const accountIdToName: Record<string, string> = {
    "acc-1": "Primary Account ($10k)",
    "acc-2": "Prop Firm Challenge ($100k)",
    "acc-3": "Swing Account ($25k)"
};

function TradeAnalysisResult({ analysis }: { analysis: TradeAnalysis }) {
    return (
        <div className="space-y-4 text-sm">
            <Alert variant="default" className="border-yellow-400/50">
                 <Wand2 className="h-4 w-4 text-yellow-400" />
                <AlertTitle className="text-yellow-400">AI Analysis</AlertTitle>
                <AlertDescription>
                    {analysis.summary}
                </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-green-900/20 border-green-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-green-400">What Went Well</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{analysis.whatWentWell}</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/20 border-red-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-red-400">What to Improve</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{analysis.whatToImprove}</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Potential Biases</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{analysis.potentialBiases}</p>
                </CardContent>
            </Card>

        </div>
    )
}

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isAddTradeDialogOpen, setAddTradeDialogOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TradeAnalysis | null>(null);

  const handleAddTrade = (newTrade: Omit<Trade, 'id'>) => {
    console.log("New trade added:", newTrade);
    setTrades(prevTrades => [
        { ...newTrade, id: (prevTrades.length + 1).toString() },
        ...prevTrades
    ]);
    setAddTradeDialogOpen(false);
  };

  const handleAnalyzeTrade = async () => {
    if (!viewingTrade) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
        const result = await analyzeTrade({
            pair: viewingTrade.pair,
            type: viewingTrade.type,
            pnl: viewingTrade.pnl,
            notes: viewingTrade.notes || "",
            mentalState: viewingTrade.mentalState || "",
        });
        setAnalysisResult(result);
    } catch (error) {
        console.error("Error analyzing trade:", error);
        // You might want to show a toast notification here
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleCloseDetails = () => {
    setViewingTrade(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  }

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
                    <Button variant="ghost" size="sm" onClick={() => setViewingTrade(trade)}>
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

       <Dialog open={!!viewingTrade} onOpenChange={(isOpen) => !isOpen && handleCloseDetails()}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Trade Details</DialogTitle>
                <DialogDescription>
                    A complete overview of your trade on {viewingTrade?.pair} from {viewingTrade?.date}.
                </DialogDescription>
            </DialogHeader>
            {viewingTrade && (
                 <div className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Account</p>
                            <p className="font-medium">{accountIdToName[viewingTrade.accountId] || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Setup</p>
                            <p className="font-medium">{viewingTrade.setup}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium capitalize">{viewingTrade.type}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-muted-foreground">P/L</p>
                            <p className={`font-medium ${viewingTrade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${viewingTrade.pnl.toFixed(2)}
                            </p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-muted-foreground">Confidence</p>
                            <p className="font-medium">{viewingTrade.confidence}%</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-muted-foreground">Mental State</p>
                            <p className="font-medium">{viewingTrade.mentalState}</p>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                         <h4 className="font-semibold flex items-center gap-2"><FileText size={16} /> Notes</h4>
                         <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">
                            {viewingTrade.notes || "No notes were added for this trade."}
                         </p>
                    </div>

                    {viewingTrade.screenshot && (
                        <div className="space-y-2">
                             <h4 className="font-semibold flex items-center gap-2"><ImageIcon size={16} /> Screenshot</h4>
                             <div className="relative w-full h-64 rounded-md border overflow-hidden cursor-pointer" onClick={() => { setViewingImage(viewingTrade.screenshot!); setViewingTrade(null);}}>
                                <Image src={viewingTrade.screenshot} alt="Trade Screenshot" layout="fill" objectFit="cover" />
                             </div>
                        </div>
                    )}
                    
                    <Separator />

                    <div>
                        {analysisResult && <TradeAnalysisResult analysis={analysisResult} />}
                        
                        {isAnalyzing && (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                                <Loader2 className="animate-spin h-5 w-5" />
                                <p>Analyzing your trade...</p>
                            </div>
                        )}

                        {!analysisResult && !isAnalyzing && (
                            <Button onClick={handleAnalyzeTrade} className="w-full">
                                <Wand2 className="mr-2 h-4 w-4" />
                                Analyze with AI
                            </Button>
                        )}
                    </div>

                 </div>
            )}
        </DialogContent>
       </Dialog>
    </div>
  );
}
