
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const checklistItems = [
    { id: 'check1', label: 'Market conditions align with my strategy.' },
    { id: 'check2', label: 'The risk/reward ratio is favorable (e.g., 1:2 or better).' },
    { id: 'check3', label: 'I have a clear entry signal.' },
    { id: 'check4', label: 'I have a pre-defined stop-loss level.' },
    { id: 'check5', label: 'I have a pre-defined take-profit level.' },
    { id: 'check6', label: 'I am not emotionally influenced by previous trades.' },
]

export default function DisciplinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Discipline Tracker
        </h1>
        <p className="text-muted-foreground mt-2">
          Maintain discipline and stick to your trading plan.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pre-Trade Checklist</CardTitle>
          <CardDescription>
            Ensure you follow your rules before entering any trade.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {checklistItems.map((item, index) => (
                    <div key={item.id}>
                        <div className="flex items-center space-x-3">
                            <Checkbox id={item.id} />
                            <Label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {item.label}
                            </Label>
                        </div>
                        {index < checklistItems.length - 1 && <Separator className="mt-4" />}
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <Button>Confirm Checklist</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
