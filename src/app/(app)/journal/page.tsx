
'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Image as ImageIcon, FileText, Wand2, Loader2, Trash2, Edit } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { AddTradeFlow, type Trade, type AddTradeFormValues } from "@/components/add-trade-form";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { analyzeTrade, TradeAnalysis } from "@/ai/flows/trade-analyst-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { parseISO, format } from "date-fns";

type Account = {
    id: string;
    name: string;
    balance: number;
}

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
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [isTradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TradeAnalysis | null>(null);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch user's accounts
      const accountsQuery = query(collection(db, "accounts"), where("userId", "==", user.uid));
      const unsubAccounts = onSnapshot(accountsQuery, (snapshot) => {
        const accountsData: Record<string, Account> = {};
        snapshot.forEach(doc => {
            accountsData[doc.id] = { ...doc.data(), id: doc.id } as Account;
        });
        setAccounts(accountsData);
      });

      // Fetch user's trades
      const tradesQuery = query(
        collection(db, "trades"),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
      const unsubTrades = onSnapshot(tradesQuery, (snapshot) => {
        const tradesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Trade[];
        setTrades(tradesData);
        setIsLoadingTrades(false);
      }, (error) => {
          console.error("Error fetching trades:", error);
          setIsLoadingTrades(false);
      });

      return () => {
        unsubAccounts();
        unsubTrades();
      };
    } else {
        setIsLoadingTrades(false);
    }
  }, [user]);

  const handleOpenAddDialog = () => {
      setEditingTrade(null);
      setTradeDialogOpen(true);
  }
  
  const handleOpenEditDialog = useCallback((trade: Trade) => {
      setViewingTrade(null);
      const tradeWithDate = {
          ...trade,
          date: parseISO(trade.date),
          accountIds: [trade.accountId],
      }
      setEditingTrade(tradeWithDate as any);
      setTradeDialogOpen(true);
  }, []);

  const handleTradeSubmit = async (values: AddTradeFormValues) => {
    if (!user) return;
    
    // This is for editing an existing trade
    if (editingTrade) {
        const tradeRef = doc(db, "trades", editingTrade.id);
        const accountId = values.accountIds[0];
        const account = accounts[accountId];
        if (!account) {
            toast({ title: "Error", description: "Selected account not found.", variant: "destructive" });
            return;
        }

        const riskAmount = account.balance * 0.01;
        const calculatedPnl = riskAmount * values.rr;

        try {
            await updateDoc(tradeRef, {
                ...values,
                pnl: parseFloat(calculatedPnl.toFixed(2)),
                accountId: accountId, // Keep it as a single accountId for updates
                userId: user.uid,
                date: format(values.date, 'yyyy-MM-dd'),
            });
            toast({ title: "Trade Updated", description: "Your changes have been saved." });
        } catch (error) {
            console.error("Error updating trade:", error);
            toast({ title: "Error", description: "Could not update your trade.", variant: "destructive" });
        }
    } else { // This is for adding one or more new trades
        const batch = writeBatch(db);
        
        values.accountIds.forEach(accountId => {
            const account = accounts[accountId];
            if (!account) return;

            const riskAmount = account.balance * 0.01;
            const calculatedPnl = riskAmount * values.rr;

            const newTradeDocRef = doc(collection(db, "trades"));

            const newTradeData = {
                ...values,
                userId: user.uid,
                accountId: accountId, // The specific account for this trade doc
                pnl: parseFloat(calculatedPnl.toFixed(2)),
                date: format(values.date, 'yyyy-MM-dd'),
            };
            delete (newTradeData as any).accountIds; // Don't save the array to the doc

            batch.set(newTradeDocRef, newTradeData);
        });

        try {
            await batch.commit();
            toast({
                title: "Trade(s) Logged",
                description: `Successfully saved ${values.accountIds.length} trade(s) to your journal.`,
            });
        } catch (error) {
             console.error("Error saving trades to Firestore:", error);
             toast({
                title: "Error",
                description: "There was a problem saving your trades. Please try again.",
                variant: "destructive",
            });
        }
    }
    setTradeDialogOpen(false);
    setEditingTrade(null);
  };
  
  const handleCloseDetails = useCallback(() => {
    setViewingTrade(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  }, []);

  const handleDeleteTrade = async (tradeId: string) => {
    if (window.confirm("Are you sure you want to delete this trade? This action cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "trades", tradeId));
            toast({ title: "Trade Deleted", description: "The trade has been removed from your journal."});
            handleCloseDetails();
        } catch (error) {
            console.error("Error deleting trade:", error);
            toast({ title: "Error", description: "Could not delete trade.", variant: "destructive"});
        }
    }
  }

  const handleAnalyzeTrade = async () => {
    if (!viewingTrade) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
        const result = await analyzeTrade({
            pair: viewingTrade.pair,
            type: viewingTrade.type as 'buy' | 'sell',
            pnl: viewingTrade.pnl,
            notes: viewingTrade.notes || "",
            mentalState: viewingTrade.mentalState || "",
        });
        setAnalysisResult(result);
    } catch (error) {
        console.error("Error analyzing trade:", error);
    } finally {
        setIsAnalyzing(false);
    }
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
        <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2" />
            Add Trade
        </Button>
      </div>

       <Dialog open={isTradeDialogOpen} onOpenChange={(isOpen) => {
           if (!isOpen) {
               setEditingTrade(null);
           }
           setTradeDialogOpen(isOpen);
       }}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
              <DialogDescription>
                {editingTrade ? 'Update the details of your trade.' : 'Log a new trade. You can select multiple accounts.'}
              </DialogDescription>
            </DialogHeader>
            <AddTradeFlow 
                onSubmit={handleTradeSubmit} 
                initialData={editingTrade || undefined}
                accounts={Object.values(accounts)}
                onDone={() => {
                    setTradeDialogOpen(false);
                    setEditingTrade(null);
                }}
            />
          </DialogContent>
        </Dialog>

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
              {isLoadingTrades ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                     <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : trades.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                       No trades logged yet. Click "Add Trade" to start.
                   </TableCell>
                </TableRow>
              ) : trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.pair}</TableCell>
                  <TableCell>{format(parseISO(trade.date), 'MMM d, yyyy')}</TableCell>
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
                    A complete overview of your trade on {viewingTrade?.pair} from {viewingTrade && format(parseISO(viewingTrade.date), 'MMM d, yyyy')}.
                </DialogDescription>
            </DialogHeader>
            {viewingTrade && (
                <>
                 <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Account</p>
                            <p className="font-medium">{accounts[viewingTrade.accountId]?.name || 'N/A'}</p>
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
                            <p className={`font-medium ${viewingTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                         <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border whitespace-pre-wrap">
                            {viewingTrade.notes || "No notes were added for this trade."}
                         </p>
                    </div>

                    {viewingTrade.screenshot && (
                        <div className="space-y-2">
                             <h4 className="font-semibold flex items-center gap-2"><ImageIcon size={16} /> Screenshot</h4>
                             <div className="relative w-full h-64 rounded-md border overflow-hidden cursor-pointer group" onClick={() => { setViewingImage(viewingTrade.screenshot!); setViewingTrade(null);}}>
                                <Image src={viewingTrade.screenshot} alt="Trade Screenshot" layout="fill" objectFit="cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white font-semibold">Click to enlarge</p>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    <Separator />

                    <div className="space-y-4">
                        {analysisResult && <TradeAnalysisResult analysis={analysisResult} />}
                        
                        {isAnalyzing && (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                                <Loader2 className="animate-spin h-5 w-5" />
                                <p>Analyzing your trade...</p>
                            </div>
                        )}
                         {!analysisResult && !isAnalyzing && (
                            <div className="flex justify-center">
                                 <Button onClick={handleAnalyzeTrade} className="w-full max-w-xs">
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Analyze with AI
                                </Button>
                            </div>
                        )}
                    </div>
                 </div>
                 <DialogFooter className="pt-4 mt-4 border-t">
                     <div className="flex w-full justify-start items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEditDialog(viewingTrade)}>
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit Trade</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteTrade(viewingTrade.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Trade</span>
                        </Button>
                    </div>
                </DialogFooter>
                </>
            )}
        </DialogContent>
       </Dialog>
    </div>
  );
}

