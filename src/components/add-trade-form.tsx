
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, CheckCircle2, Upload } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Slider } from "./ui/slider";
import { useState, useRef } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import Image from "next/image";

const formSchema = z.object({
  accountId: z.string().min(1, "Account is required."),
  pair: z.string().min(1, "Currency pair is required."),
  date: z.date({ required_error: "A date is required." }),
  type: z.enum(["buy", "sell"]),
  pnl: z.coerce.number(),
  setup: z.string().min(1, "Trading setup is required."),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(100).default(50),
  mentalState: z.string().optional(),
  screenshot: z.string().optional(),
});

// We infer the type from the schema and add the id
export type Trade = z.infer<typeof formSchema> & { id: string; userId: string; };

type AddTradeFormProps = {
  onSubmit: (values: Omit<Trade, 'id' | 'userId'>) => void;
  onBack: () => void;
};

const checklistItems = [
    { id: 'check1', label: 'Market conditions align with my strategy.' },
    { id: 'check2', label: 'The risk/reward ratio is favorable (e.g., 1:2 or better).' },
    { id: 'check3', label: 'I have a clear entry signal.' },
    { id: 'check4', label: 'I have a pre-defined stop-loss level.' },
    { id: 'check5', label: 'I have a pre-defined take-profit level.' },
    { id: 'check6', label: 'I am not emotionally influenced by previous trades.' },
];


function PreTradeChecklist({ onContinue }: { onContinue: () => void }) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    const getGrade = () => {
        if (checkedCount >= 5) return { grade: 'A+', color: 'text-green-400' };
        if (checkedCount === 4) return { grade: 'B', color: 'text-blue-400' };
        if (checkedCount === 3) return { grade: 'C', color: 'text-yellow-400' };
        return { grade: 'D', color: 'text-red-400' };
    }

    const { grade, color } = getGrade();
    
    const handleCheckboxChange = (id: string, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [id]: checked }));
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium">Pre-Trade Checklist</h3>
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">Setup Grade</p>
                    <p className={cn("text-2xl font-bold", color)}>{grade}</p>
                 </div>
            </div>
            
            {checklistItems.map((item, index) => (
                <div key={item.id}>
                    <div className="flex items-center space-x-3">
                        <Checkbox 
                            id={item.id} 
                            checked={checkedItems[item.id] || false}
                            onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                        />
                        <Label htmlFor={item.id} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {item.label}
                        </Label>
                    </div>
                    {index < checklistItems.length - 1 && <Separator className="mt-4" />}
                </div>
            ))}
            <div className="mt-6 flex justify-end">
                <Button onClick={onContinue}>
                    Continue
                </Button>
            </div>
        </div>
    );
}


function AddTradeForm({ onSubmit, onBack }: AddTradeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: "acc-1",
      pair: "",
      type: "buy",
      pnl: 0,
      setup: "",
      notes: "",
      confidence: 50,
      mentalState: "",
      screenshot: ""
    },
  });

  const screenshotValue = form.watch("screenshot");

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
        ...values,
        date: format(values.date, 'yyyy-MM-dd')
    });
    form.reset();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("screenshot", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="acc-1">Primary Account ($10k)</SelectItem>
                        <SelectItem value="acc-2">Prop Firm Challenge ($100k)</SelectItem>
                        <SelectItem value="acc-3">Swing Account ($25k)</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="pair"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Pair</FormLabel>
              <FormControl>
                <Input placeholder="e.g., EUR/USD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trade type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pnl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>P/L ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 150.75" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="setup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setup</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Breakout, Reversal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="confidence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confidence ({field.value}%)</FormLabel>
              <FormControl>
                <Slider
                  defaultValue={[50]}
                  max={100}
                  step={1}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mentalState"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feelings / Mental State</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How were you feeling? (e.g., Anxious, confident, tired...)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about the trade..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="screenshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade Screenshot</FormLabel>
              <FormControl>
                 <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </FormControl>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                 <Upload className="mr-2 h-4 w-4" />
                 Upload Image
              </Button>
              {screenshotValue && (
                <div className="mt-4 relative w-full h-48">
                  <Image src={screenshotValue} alt="Screenshot preview" layout="fill" objectFit="contain" className="rounded-md border" />
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
            <Button type="submit">
                Add Trade
            </Button>
        </div>
      </form>
    </Form>
  );
}

export function AddTradeFlow({ onSubmit }: { onSubmit: (values: Omit<Trade, 'id' | 'userId'>) => void }) {
    const [step, setStep] = useState(1);

    if (step === 1) {
        return <PreTradeChecklist onContinue={() => setStep(2)} />;
    }

    return <AddTradeForm onSubmit={onSubmit} onBack={() => setStep(1)} />;
}
