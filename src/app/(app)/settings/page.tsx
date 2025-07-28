
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, messaging } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { type UserProfile, type ChecklistItem } from "@/services/user-service";
import { Loader2, Trash2, PlusCircle, ListChecks, Sun, Moon, LogOut, BellRing, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from 'firebase/auth';
import { useRouter } from "next/navigation";
import { getToken } from "firebase/messaging";


const defaultPreTradeChecklist: ChecklistItem[] = [
    { id: 'check1', label: 'Market conditions align with my strategy.' },
    { id: 'check2', label: 'The risk/reward ratio is favorable (e.g., 1:2 or better).' },
    { id: 'check3', label: 'I have a clear entry signal.' },
    { id: 'check4', label: 'I have a pre-defined stop-loss level.' },
    { id: 'check5', label: 'I have a pre-defined take-profit level.' },
    { id: 'check6', label: 'I am not emotionally influenced by previous trades.' },
];

const defaultDisciplineChecklist: ChecklistItem[] = [
    { id: 'review_plan', label: 'I reviewed my trading plan.' },
    { id: 'follow_rules', label: 'I followed my entry and exit rules without hesitation.' },
    { id: 'manage_risk', label: 'I applied proper risk management on every trade.' },
    { id: 'avoid_fomo', label: 'I avoided FOMO and revenge trading.' },
    { id: 'journal_trades', label: 'I logged all my trades in the journal.' },
    { id: 'review_day', label: 'I reviewed my performance and took notes for tomorrow.' },
];

function ChecklistManager({ title, description, items, setItems, onReset }: { title: string, description: string, items: ChecklistItem[], setItems: (items: ChecklistItem[]) => void, onReset: () => void }) {
    
    const handleItemChange = (id: string, newLabel: string) => {
        setItems(items.map(item => item.id === id ? { ...item, label: newLabel } : item));
    }

    const handleAddItem = () => {
        const newItem: ChecklistItem = { id: `item-${Date.now()}`, label: '' };
        setItems([...items, newItem]);
    }
    
    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Button onClick={onReset} variant="ghost" size="sm" type="button">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset to Default
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-2">
                            <Input 
                                value={item.label}
                                onChange={(e) => handleItemChange(item.id, e.target.value)}
                                placeholder="Enter checklist item..."
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} type="button">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <Button onClick={handleAddItem} variant="outline" size="sm" type="button">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </CardContent>
        </Card>
    )
}


export default function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { setTheme } = useTheme();
    const [user] = useAuthState(auth);
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setProfile({
                        ...data,
                        preTradeChecklist: data.preTradeChecklist || defaultPreTradeChecklist,
                        disciplineChecklist: data.disciplineChecklist || defaultDisciplineChecklist,
                    });
                } else {
                     setProfile({
                        preTradeChecklist: defaultPreTradeChecklist,
                        disciplineChecklist: defaultDisciplineChecklist,
                    });
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const handleChecklistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSaving(true);
        try {
            const firestoreDataToUpdate: Partial<UserProfile> = {
                preTradeChecklist: profile.preTradeChecklist,
                disciplineChecklist: profile.disciplineChecklist,
            };

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, firestoreDataToUpdate);
            
            toast({
                title: "Checklists Saved",
                description: "Your checklist settings have been saved successfully.",
            });
        } catch (error) {
            console.error("Error updating checklists:", error);
            toast({
                title: "Error",
                description: "Could not save your checklists.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnableNotifications = async () => {
        if (!messaging || !user) {
            toast({
                title: "Error",
                description: "Push notifications are not supported on this browser.",
                variant: "destructive",
            });
            return;
        }

        setIsEnablingNotifications(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // IMPORTANT: Replace this with your actual VAPID key from Firebase Console
                // Project settings > Cloud Messaging > Web configuration > Generate key pair
                const vapidKey = "YOUR_VAPID_KEY_HERE"; 
                if (vapidKey === "YOUR_VAPID_KEY_HERE") {
                    console.warn("Please replace 'YOUR_VAPID_KEY_HERE' with your actual Firebase VAPID key in src/app/(app)/settings/page.tsx");
                     toast({ title: "Configuration Needed", description: "VAPID key not set. See browser console.", variant: "destructive" });
                     setIsEnablingNotifications(false);
                     return;
                }

                const fcmToken = await getToken(messaging, { vapidKey }); 
                 if (fcmToken) {
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, {
                        fcmTokens: arrayUnion(fcmToken)
                    });
                    toast({ title: "Notifications Enabled", description: "You will now receive push notifications on this device." });
                } else {
                    throw new Error("Could not retrieve FCM token.");
                }
            } else {
                 toast({ title: "Permission Denied", description: "You have blocked push notifications.", variant: "destructive" });
            }
        } catch(error) {
            console.error("Error enabling notifications:", error);
            toast({ title: "Error", description: "Could not enable push notifications. Check browser console for details.", variant: "destructive" });
        } finally {
            setIsEnablingNotifications(false);
        }
    }
    
    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Settings
            </h1>
            <p className="text-muted-foreground mt-2">
                Manage your application settings and account.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4"/>Light</Button>
                    <Button variant="outline" onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4"/>Dark</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Enable push notifications to receive price alerts on your device.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={handleEnableNotifications} disabled={isEnablingNotifications}>
                    {isEnablingNotifications ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
                    Enable Push Notifications
                </Button>
            </CardContent>
        </Card>

        <form onSubmit={handleChecklistSubmit}>
            <div className="space-y-6">
                <ChecklistManager 
                    title="Pre-Trade Checklist"
                    description="Customize the checklist that appears before you log a trade."
                    items={profile.preTradeChecklist || []}
                    setItems={(items) => setProfile(p => ({...p, preTradeChecklist: items}))}
                    onReset={() => setProfile(p => ({...p, preTradeChecklist: defaultPreTradeChecklist}))}
                />
                <ChecklistManager 
                    title="Daily Discipline Checklist"
                    description="Customize your daily habit tracker."
                    items={profile.disciplineChecklist || []}
                    setItems={(items) => setProfile(p => ({...p, disciplineChecklist: items}))}
                    onReset={() => setProfile(p => ({...p, disciplineChecklist: defaultDisciplineChecklist}))}
                />
            </div>
            <div className="flex justify-end mt-4">
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                    Save Checklists
                </Button>
            </div>
        </form>

        <Card>
             <CardHeader>
                <CardTitle>About TradeFlow</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground">TradeFlow is your personal trading journal and analytics copilot, designed to help you become a more disciplined and data-driven trader. Track your trades, analyze your performance, and master your psychology.</p>
             </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Version 1.0.0</p>
             </CardFooter>
        </Card>

         <Card>
             <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
             </CardHeader>
             <CardContent>
                 <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                 </Button>
             </CardContent>
        </Card>

    </div>
  );
}

    