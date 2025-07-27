import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const trades = [
  {
    pair: "EUR/USD",
    date: "2024-05-20",
    type: "buy",
    pnl: 150.75,
    setup: "Breakout",
  },
  {
    pair: "GBP/JPY",
    date: "2024-05-19",
    type: "sell",
    pnl: -75.2,
    setup: "Reversal",
  },
  {
    pair: "AUD/CAD",
    date: "2024-05-18",
    type: "buy",
    pnl: 230.0,
    setup: "Continuation",
  },
];

export default function JournalPage() {
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
        <Button>
          <PlusCircle className="mr-2" />
          Add Trade
        </Button>
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{trade.pair}</TableCell>
                  <TableCell>{trade.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={trade.type === "buy" ? "default" : "destructive"}
                      className={
                        trade.type === "buy"
                          ? "bg-green-600/20 text-green-500 border-green-600/30 hover:bg-green-600/30"
                          : "bg-red-600/20 text-red-500 border-red-600/30 hover:bg-red-600/30"
                      }
                    >
                      {trade.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      trade.pnl > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    ${trade.pnl.toFixed(2)}
                  </TableCell>
                  <TableCell>{trade.setup}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
