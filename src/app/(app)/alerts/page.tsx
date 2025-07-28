
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Loader2, Trash2, Bell, BellOff, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type PriceAlert = {
    id: string;
    userId: string;
    pair: string;
    threshold: number;
    direction: 'above' | 'below';
    notes?: string;
    active: boolean;
    triggered: boolean;
    createdAt: any;
    triggeredAt?: any;
};

const alertFormSchema = z.object({
  pair: z.string().min(3, "Pair is required.").toUpperCase(),
  threshold: z.coerce.number().positive("Price must be positive."),
  direction: z.enum(['above', 'below']),
  notes: z.string().optional(),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

const AlertForm = ({ onSubmit, onDone, initialData }: { onSubmit: (values: AlertFormValues) => Promise<void>; onDone: () => void; initialData?: Partial<PriceAlert> }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<AlertFormValues>({
        resolver: zodResolver(alertFormSchema),
        defaultValues: initialData ? {
            pair: initialData.pair,
            threshold: initialData.threshold,
            direction: initialData.direction,
            notes: initialData.notes
        } : {
            pair: "EURUSD",
            direction: "above",
            threshold: '' as any,
            notes: "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset(initialData);
        }
    }, [initialData, form]);


    const handleSubmit = async (values: AlertFormValues) => {
        setIsSubmitting(true);
        await onSubmit(values);
        setIsSubmitting(false);
        onDone();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="pair"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Currency Pair</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., EURUSD, XAUUSD" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="threshold"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price Threshold</FormLabel>
                            <FormControl>
                                <Input type="number" step="any" placeholder="e.g., 1.08500" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Direction</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Alert me when price is..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="above">Above</SelectItem>
                                    <SelectItem value="below">Below</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., 'Key resistance level, look for shorts.'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : initialData ? <Pencil className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        {initialData ? 'Save Changes' : 'Create Alert'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const AlertCard = ({ alert, onUpdate, onDelete, onEdit }: { alert: PriceAlert; onUpdate: (id: string, data: Partial<PriceAlert>) => void; onDelete: (id: string) => void; onEdit: (alert: PriceAlert) => void; }) => {
    return (
        <Card className={cn("transition-all", !alert.active && "bg-muted/50", alert.triggered && "border-primary")}>
            <CardContent className="p-4 flex justify-between items-center">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{alert.pair}</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                            {alert.direction === 'above' ? <ArrowUp className="h-4 w-4 mr-1 text-green-500"/> : <ArrowDown className="h-4 w-4 mr-1 text-red-500" />}
                            <span>{alert.threshold}</span>
                        </div>
                    </div>
                     {alert.notes && <p className="text-sm text-muted-foreground">{alert.notes}</p>}
                     <p className="text-xs text-muted-foreground pt-1">
                        {alert.triggered && alert.triggeredAt?.toDate ? `Triggered on ${format(alert.triggeredAt.toDate(), 'PPp')}` : (alert.createdAt?.toDate ? `Created on ${format(alert.createdAt.toDate(), 'PPp')}` : 'Creating...')}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" onClick={() => onUpdate(alert.id, { active: !alert.active })}>
                        {alert.active ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                        <span className="sr-only">{alert.active ? 'Disable' : 'Enable'}</span>
                    </Button>
                     <Button variant="ghost" size="icon" onClick={() => onEdit(alert)}>
                        <Pencil className="h-5 w-5" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(alert.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AlertsPage() {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            const q = query(
                collection(db, 'alerts'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const alertsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PriceAlert[];
                setAlerts(alertsData);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching alerts:", error);
                toast({ title: 'Error', description: 'Could not fetch alerts.', variant: 'destructive' });
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user, toast]);

    const handleOpenDialog = (alert: PriceAlert | null = null) => {
        setEditingAlert(alert);
        setIsDialogOpen(true);
    };

    const handleAlertSubmit = async (values: AlertFormValues) => {
        if (!user) return;

        if (editingAlert) {
            // Update existing alert
            const alertRef = doc(db, 'alerts', editingAlert.id);
            try {
                await updateDoc(alertRef, values);
                toast({ title: 'Alert Updated', description: 'Your alert has been successfully updated.' });
            } catch (error) {
                console.error('Error updating alert:', error);
                toast({ title: 'Error', description: 'Could not update alert.', variant: 'destructive' });
            }
        } else {
            // Create new alert
            try {
                await addDoc(collection(db, 'alerts'), {
                    ...values,
                    userId: user.uid,
                    active: true,
                    triggered: false,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Alert Created', description: `You will be notified when ${values.pair} goes ${values.direction} ${values.threshold}.` });
            } catch (error) {
                console.error('Error creating alert:', error);
                toast({ title: 'Error', description: 'Could not create alert.', variant: 'destructive' });
            }
        }
    };


    const handleUpdateAlertStatus = async (id: string, data: Partial<PriceAlert>) => {
        const alertRef = doc(db, 'alerts', id);
        try {
            await updateDoc(alertRef, data);
            toast({ title: 'Alert Updated', description: `The alert has been ${data.active ? 'enabled' : 'disabled'}.` });
        } catch (error) {
            console.error('Error updating alert:', error);
            toast({ title: 'Error', description: 'Could not update the alert.', variant: 'destructive' });
        }
    };
    
    const handleDeleteAlert = async (id: string) => {
        if (window.confirm("Are you sure you want to permanently delete this alert?")) {
            try {
                await deleteDoc(doc(db, 'alerts', id));
                toast({ title: 'Alert Deleted' });
            } catch (error) {
                console.error('Error deleting alert:', error);
                toast({ title: 'Error', description: 'Could not delete the alert.', variant: 'destructive' });
            }
        }
    };

    const activeAlerts = alerts.filter(a => !a.triggered);
    const triggeredAlerts = alerts.filter(a => a.triggered);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Price Alerts
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Never miss a trading opportunity. Set alerts for key price levels.
                    </p>
                </div>
                 <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2" />
                    Create Alert
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAlert ? 'Edit Price Alert' : 'Create a New Price Alert'}</DialogTitle>
                        <DialogDescription>
                            {editingAlert ? 'Modify the details of your alert.' : 'Get notified when a currency pair reaches your target price.'}
                        </DialogDescription>
                    </DialogHeader>
                    <AlertForm 
                        onSubmit={handleAlertSubmit} 
                        onDone={() => setIsDialogOpen(false)}
                        initialData={editingAlert || undefined}
                    />
                </DialogContent>
            </Dialog>
            
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="triggered">Triggered</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-6">
                     <div className="space-y-4">
                        {isLoading ? (
                             <div className="flex justify-center items-center py-12">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </div>
                        ) : activeAlerts.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Bell size={48} className="mx-auto mb-4" />
                                <h3 className="text-xl font-semibold">No Active Alerts</h3>
                                <p>Click "Create Alert" to get started.</p>
                            </div>
                        ) : (
                            activeAlerts.map(alert => (
                                <AlertCard key={alert.id} alert={alert} onUpdate={handleUpdateAlertStatus} onDelete={handleDeleteAlert} onEdit={handleOpenDialog}/>
                            ))
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="triggered" className="mt-6">
                     <div className="space-y-4">
                        {isLoading ? (
                             <div className="flex justify-center items-center py-12">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </div>
                        ) : triggeredAlerts.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <BellOff size={48} className="mx-auto mb-4" />
                                <h3 className="text-xl font-semibold">No Triggered Alerts</h3>
                                <p>Your triggered alert history will appear here.</p>
                            </div>
                        ) : (
                            triggeredAlerts.map(alert => (
                                <AlertCard key={alert.id} alert={alert} onUpdate={handleUpdateAlertStatus} onDelete={handleDeleteAlert} onEdit={handleOpenDialog} />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
