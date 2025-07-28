
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
import { CalendarIcon, Upload, Loader2 } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Slider } from "./ui/slider";
import { useState, useRef, useEffect } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import type { ChecklistItem, UserProfile } from "@/services/user-service";

type Account = {
    id: string;
    name: string;
    balance: number;
    userId: string;
    createdAt: any;
}

const formSchema = z.object({
  accountId: z.string().min(1, "Account is required."),
  pair: z.string().min(1, "Currency pair is required."),
  date: z.date({ required_error: "A date is required." }),
  type: z.enum(["buy", "sell"]),
  pnl: z.coerce.number(),
  rr: z.coerce.number().describe('The risk/reward ratio or loss outcome.'),
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
  initialData?: Omit<Trade, 'id' | 'userId' | 'date'> & { date: Date };
};


function PreTradeChecklist({ onContinue, isEditMode }: { onContinue: () => void, isEditMode: boolean }) {
    const [user] = useAuthState(auth);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as UserProfile;
                    if (data.preTradeChecklist && data.preTradeChecklist.length > 0) {
                        setChecklistItems(data.preTradeChecklist);
                    }
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user]);
    
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    const getGrade = () => {
        if(checklistItems.length === 0) return { grade: 'N/A', color: 'text-muted-foreground' };
        const ratio = checkedCount / checklistItems.length;
        if (ratio >= 0.8) return { grade: 'A+', color: 'text-green-400' };
        if (ratio >= 0.6) return { grade: 'B', color: 'text-blue-400' };
        if (ratio >= 0.4) return { grade: 'C', color: 'text-yellow-400' };
        return { grade: 'D', color: 'text-red-400' };
    }

    const { grade, color } = getGrade();
    
    const handleCheckboxChange = (id: string, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [id]: checked }));
    }

    if (isLoading) {
         return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    // Skip checklist if in edit mode
    if (isEditMode) {
        onContinue();
        return null;
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
            
            {checklistItems.length > 0 ? checklistItems.map((item, index) => (
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
            )) : (
                <p className="text-muted-foreground text-center py-4">No pre-trade checklist items found. You can add them in Settings.</p>
            )}
            <div className="mt-6 flex justify-end">
                <Button onClick={onContinue}>
                    Continue
                </Button>
            </div>
        </div>
    );
}


function AddTradeForm({ onSubmit, onBack, initialData }: AddTradeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user] = useAuthState(auth);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        ...initialData,
        // In edit mode, pnl is already set, rr can be inferred or defaulted
        rr: initialData.rr ?? (initialData.pnl > 0 ? 1 : -1),
    } : {
      accountId: "",
      pair: "",
      type: "buy",
      pnl: 0,
      rr: 2, // Default to a 1:2 R:R
      setup: "",
      notes: "",
      confidence: 50,
      mentalState: "",
      screenshot: ""
    },
  });

   useEffect(() => {
        if (user) {
            const q = query(collection(db, "accounts"), where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const accountsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Account[];
                setAccounts(accountsData);
                if (accountsData.length > 0 && !form.getValues("accountId")) {
                    form.setValue("accountId", accountsData[0].id);
                }
                setIsLoadingAccounts(false);
            });
            return () => unsubscribe();
        } else {
             setIsLoadingAccounts(false);
        }
    }, [user, form]);


  const screenshotValue = form.watch("screenshot");
  const selectedAccountId = form.watch("accountId");
  const selectedRR = form.watch("rr");

  useEffect(() => {
    if (isEditMode) return; // Don't auto-calculate PNL when editing
    
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (!account) return;
    
    const riskAmount = account.balance * 0.01; // 1% risk
    let calculatedPnl = 0;
    
    calculatedPnl = riskAmount * selectedRR;

    form.setValue("pnl", parseFloat(calculatedPnl.toFixed(2)));

  }, [selectedAccountId, selectedRR, accounts, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const submissionData = {
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
    };
    onSubmit(submissionData as any);
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

  const isEditMode = !!initialData;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Trading Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                    <SelectTrigger disabled={isLoadingAccounts}>
                        <SelectValue placeholder={isLoadingAccounts ? "Loading accounts..." : "Select an account"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {accounts.map(acc => (
                             <SelectItem key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          name="rr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outcome (R-Multiple)</FormLabel>
                <FormControl>
                    <Input 
                        type="number" 
                        step="0.1"
                        placeholder="e.g., 2.5 or -1" 
                        {...field} 
                        disabled={isEditMode}
                        onChange={event => field.onChange(event.target.value === '' ? '' : parseFloat(event.target.value))}
                    />
                </FormControl>
                <FormDescription>
                    Enter your profit or loss as an R-multiple. (e.g., 2 for a 2R win, -1 for a 1R loss)
                </FormDescription>
                {isEditMode && <FormDescription>P/L cannot be changed in edit mode.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        
        <FormField
            control={form.control}
            name="pnl"
            render={({ field }) => (
                <FormItem className="hidden">
                    <FormLabel>P/L ($)</FormLabel>
                    <FormControl>
                        <Input type="number" readOnly {...field} />
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
                  defaultValue={[field.value || 50]}
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
            {!isEditMode && <Button type="button" variant="ghost" onClick={onBack}>Back</Button>}
            <Button type="submit">
                {isEditMode ? 'Save Changes' : 'Add Trade'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

export function AddTradeFlow({ 
    onSubmit, 
    initialData,
    onDone,
}: { 
    onSubmit: (values: Omit<Trade, 'id' | 'userId'>) => void,
    initialData?: Omit<Trade, 'id' | 'userId' | 'date'> & { date: Date },
    onDone: () => void,
}) {
    const [step, setStep] = useState(initialData ? 2 : 1);

    if (step === 1) {
        return <PreTradeChecklist onContinue={() => setStep(2)} isEditMode={!!initialData} />;
    }

    return <AddTradeForm 
                onSubmit={onSubmit} 
                onBack={() => setStep(1)} 
                initialData={initialData} 
            />;
}

    