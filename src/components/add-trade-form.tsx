

'use client';

import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarIcon, Upload, Loader2, Check } from "lucide-react";
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
import { doc, onSnapshot } from "firebase/firestore";
import type { ChecklistItem, UserProfile } from "@/services/user-service";

type Account = {
    id: string;
    name: string;
    balance: number;
    userId: string;
    createdAt: any;
}

const rrSchema = z.object({
  accountId: z.string(),
  rr: z.coerce.number(),
});

const checklistItemWithStateSchema = z.object({
    id: z.string(),
    label: z.string(),
    checked: z.boolean(),
});

const formSchema = z.object({
  pair: z.string().min(1, "Currency pair is required."),
  date: z.date({ required_error: "A date is required." }),
  type: z.enum(["buy", "sell"]),
  setups: z.string().min(1, "Trading setup is required."),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(100).default(50),
  mentalState: z.string().optional(),
  screenshot: z.string().optional(),
  rrValues: z.array(rrSchema).min(1, "At least one account's R:R must be set."),
  preTradeChecklist: z.array(checklistItemWithStateSchema).optional(),
  setupGrade: z.string().optional(),
});


export type AddTradeFormValues = Omit<z.infer<typeof formSchema>, 'rrValues'> & {
    accountIds: string[];
    rr: number; // For backward compatibility and single-account trades
    rrDetails?: Record<string, number>; // For multi-account trades
};


export type Trade = AddTradeFormValues & { 
    id: string; 
    userId: string; 
    deleted?: boolean;
    setup: string; // Renamed from setups
};


type AddTradeFormProps = {
  onSubmit: (values: AddTradeFormValues) => void;
  onBack: () => void;
  initialData?: Omit<Trade, 'id' | 'userId' | 'date'> & { date: Date };
  accounts: Account[];
  checklistData?: {
    items: (ChecklistItem & { checked: boolean })[];
    grade: string;
  } | null;
};

type ChecklistItemWithState = ChecklistItem & { checked: boolean };


function PreTradeChecklist({ onContinue, isEditMode }: { onContinue: (data: { items: ChecklistItemWithState[], grade: string}) => void, isEditMode: boolean }) {
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

    const handleContinueClick = () => {
        const itemsWithState = checklistItems.map(item => ({
            ...item,
            checked: !!checkedItems[item.id]
        }));
        onContinue({ items: itemsWithState, grade });
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
        onContinue({ items: [], grade: 'N/A' });
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
                <Button onClick={handleContinueClick}>
                    Continue
                </Button>
            </div>
        </div>
    );
}


function AddTradeForm({ onSubmit, onBack, initialData, accounts, checklistData }: AddTradeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!initialData;
  const [applyAllRr, setApplyAllRr] = useState('');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pair: initialData?.pair || "",
      date: initialData?.date || new Date(),
      type: initialData?.type || "buy",
      setups: initialData?.setup || "",
      notes: initialData?.notes || "",
      confidence: initialData?.confidence || 50,
      mentalState: initialData?.mentalState || "",
      screenshot: initialData?.screenshot || "",
      rrValues: initialData?.accountIds?.map(id => ({
          accountId: id,
          rr: initialData.rrDetails?.[id] ?? initialData.rr
      })) || (accounts.length > 0 ? [{ accountId: accounts[0].id, rr: 2 }] : []),
      preTradeChecklist: initialData?.preTradeChecklist || checklistData?.items,
      setupGrade: initialData?.setupGrade || checklistData?.grade,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
      control: form.control,
      name: "rrValues",
      keyName: "keyId"
  });

  const screenshotValue = form.watch("screenshot");
  const selectedAccountIds = form.watch('rrValues').map(v => v.accountId);

  const handleAccountsChange = (accountId: string, checked: boolean) => {
    const currentRrValues = form.getValues('rrValues');
    if (checked) {
        if (!currentRrValues.some(val => val.accountId === accountId)) {
            append({ accountId, rr: 2 });
        }
    } else {
        const indexToRemove = currentRrValues.findIndex(val => val.accountId === accountId);
        if (indexToRemove !== -1) {
            remove(indexToRemove);
        }
    }
  };

  const handleApplyAllRr = () => {
    const rrNum = parseFloat(applyAllRr);
    if (!isNaN(rrNum)) {
        fields.forEach((field, index) => {
            update(index, { ...field, rr: rrNum });
        });
    }
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const accountIds = values.rrValues.map(v => v.accountId);
    const rrDetails = values.rrValues.reduce((acc, curr) => {
        acc[curr.accountId] = curr.rr;
        return acc;
    }, {} as Record<string, number>);

    // For backward compatibility and single-account logic, store a primary rr value
    const rr = values.rrValues.length > 0 ? values.rrValues[0].rr : 0;
    
    const finalValues: AddTradeFormValues = {
        pair: values.pair,
        date: values.date,
        type: values.type,
        setup: values.setups,
        notes: values.notes,
        confidence: values.confidence,
        mentalState: values.mentalState,
        screenshot: values.screenshot,
        accountIds: accountIds,
        rrDetails: rrDetails,
        rr: rr,
        preTradeChecklist: values.preTradeChecklist,
        setupGrade: values.setupGrade,
    };
    
    onSubmit(finalValues);
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
        <FormItem>
            <FormLabel>Trading Account(s)</FormLabel>
            <div className="space-y-2 rounded-md border p-4">
                {accounts.length > 0 ? accounts.map(account => (
                   <FormItem key={account.id} className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox
                                checked={selectedAccountIds.includes(account.id)}
                                onCheckedChange={(checked) => handleAccountsChange(account.id, !!checked)}
                            />
                        </FormControl>
                        <FormLabel className="font-normal">
                            {account.name} (${account.balance.toLocaleString()})
                        </FormLabel>
                    </FormItem>
                )) : (
                    <p className="text-sm text-muted-foreground">No accounts found. Please create one in the Analytics tab.</p>
                )}
            </div>
            <FormMessage>{form.formState.errors.rrValues?.root?.message}</FormMessage>
        </FormItem>
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
         <div className="space-y-4 rounded-md border p-4">
            <FormLabel>Outcome (R-Multiple)</FormLabel>
            {fields.map((field, index) => {
                 const account = accounts.find(acc => acc.id === field.accountId);
                 return (
                    <FormField
                        key={field.keyId}
                        control={form.control}
                        name={`rrValues.${index}.rr`}
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel className="font-normal text-muted-foreground">{account?.name || 'Unknown Account'}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.1"
                                        placeholder="e.g., 2.5 or -1" 
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                 )
            })}
             {fields.length > 1 && (
                <div className="flex items-center gap-2 pt-2">
                    <Input 
                        type="number"
                        placeholder="Apply to all..."
                        className="h-9"
                        value={applyAllRr}
                        onChange={e => setApplyAllRr(e.target.value)}
                    />
                    <Button type="button" variant="secondary" onClick={handleApplyAllRr} size="sm">
                        Apply to All
                    </Button>
                </div>
            )}
             <FormDescription>
                Enter profit/loss as an R-multiple. (e.g., 2 for 2R win, -1 for 1R loss)
            </FormDescription>
        </div>


        <FormField
          control={form.control}
          name="setups"
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
    accounts,
    onDone,
}: { 
    onSubmit: (values: AddTradeFormValues) => void,
    initialData?: Omit<Trade, 'id' | 'userId' | 'date' | 'setups'> & { date: Date, setup: string },
    accounts: Account[],
    onDone: () => void,
}) {
    const [step, setStep] = useState(initialData ? 2 : 1);
    const [checklistData, setChecklistData] = useState<{
        items: ChecklistItemWithState[];
        grade: string;
    } | null>(null);

    const handleChecklistContinue = (data: { items: ChecklistItemWithState[], grade: string}) => {
        setChecklistData(data);
        setStep(2);
    }

    if (step === 1) {
        return <PreTradeChecklist onContinue={handleChecklistContinue} isEditMode={!!initialData} />;
    }

    return <AddTradeForm 
                onSubmit={onSubmit} 
                onBack={() => setStep(1)} 
                initialData={initialData} 
                accounts={accounts}
                checklistData={checklistData}
            />;
}
