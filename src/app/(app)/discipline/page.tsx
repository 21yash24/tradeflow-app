
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Flame, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const checklistItems = [
    { id: 'review_plan', label: 'I reviewed my trading plan.' },
    { id: 'follow_rules', label: 'I followed my entry and exit rules without hesitation.' },
    { id: 'manage_risk', label: 'I applied proper risk management on every trade.' },
    { id: 'avoid_fomo', label: 'I avoided FOMO and revenge trading.' },
    { id: 'journal_trades', label: 'I logged all my trades in the journal.' },
    { id: 'review_day', label: 'I reviewed my performance and took notes for tomorrow.' },
];

type ChecklistState = Record<string, boolean>;

type DisciplineData = {
    lastCompletedDate?: string;
    streak: number;
    checklist: ChecklistState;
    notes: string;
}

const DisciplineTrackerPage = () => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DisciplineData>({
        streak: 0,
        checklist: {},
        notes: ''
    });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const docRef = user ? doc(db, 'discipline', `${user.uid}_${todayStr}`) : null;
    const streakRef = user ? doc(db, 'streaks', user.uid) : null;

    useEffect(() => {
        if (!user || !streakRef) return;
        
        const unsubscribe = onSnapshot(streakRef, (docSnap) => {
            if (docSnap.exists()) {
                const streakData = docSnap.data();
                const lastDate = streakData.lastCompletedDate ? new Date(streakData.lastCompletedDate) : new Date();
                const today = new Date();
                
                // Reset streak if user missed a day
                if (differenceInCalendarDays(today, lastDate) > 1) {
                    setData(prev => ({...prev, streak: 0}));
                } else {
                    setData(prev => ({...prev, streak: streakData.streak || 0}));
                }
            }
        });

        return () => unsubscribe();

    }, [user, streakRef]);

    useEffect(() => {
        if (!docRef) return;

        const fetchData = async () => {
            setIsLoading(true);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const docData = docSnap.data() as Omit<DisciplineData, 'streak'>;
                setData(prev => ({...prev, ...docData}));
            }
            setIsLoading(false);
        }
        fetchData();
    }, [docRef]);

    const handleChecklistChange = (id: string, checked: boolean) => {
        setData(prev => ({
            ...prev,
            checklist: { ...prev.checklist, [id]: checked }
        }));
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setData(prev => ({ ...prev, notes: e.target.value }));
    }

    const handleSaveChanges = async () => {
        if (!docRef) return;
        try {
            await setDoc(docRef, {
                checklist: data.checklist,
                notes: data.notes
            }, { merge: true });
            toast({ title: 'Progress Saved', description: 'Your checklist and notes have been saved for today.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not save your progress.', variant: 'destructive' });
        }
    }

    const handleCompleteDay = async () => {
        if (!user || !docRef || !streakRef) return;
        
        try {
            // Save today's final data
            await setDoc(docRef, {
                checklist: data.checklist,
                notes: data.notes,
                lastCompletedDate: todayStr,
            }, { merge: true });

            // Update streak
            const streakDoc = await getDoc(streakRef);
            let currentStreak = 0;
            if (streakDoc.exists()) {
                const lastDateStr = streakDoc.data().lastCompletedDate;
                if(lastDateStr) {
                    const lastDate = new Date(lastDateStr);
                    if (isYesterday(lastDate) || isToday(lastDate)) { // isToday check prevents double counting
                         currentStreak = streakDoc.data().streak;
                    }
                }
            }

            const newStreak = (streakDoc.data()?.lastCompletedDate === todayStr) ? currentStreak : currentStreak + 1;

            await setDoc(streakRef, {
                streak: newStreak,
                lastCompletedDate: todayStr
            });

            setData(prev => ({ ...prev, streak: newStreak, lastCompletedDate: todayStr }));

            toast({ title: 'Day Complete!', description: `Great work! Your streak is now ${newStreak}.` });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not complete the day.', variant: 'destructive' });
        }
    };
    
    const isCompletedForToday = data.lastCompletedDate === todayStr;
    const allChecked = checklistItems.every(item => data.checklist[item.id]);

    if(isLoading) {
         return (
             <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h3 className="text-xl font-semibold">Loading Discipline Tracker</h3>
            </div>
        )
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Discipline Tracker
                </h1>
                <p className="text-muted-foreground mt-2">
                    Consistency is key. Track your daily trading discipline.
                </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="flex flex-col items-center justify-center text-center p-6 bg-primary/10 border-primary/20">
                    <Flame className="h-12 w-12 text-primary" />
                    <p className="text-5xl font-bold mt-2">{data.streak}</p>
                    <p className="text-muted-foreground">Day Streak</p>
                </Card>
                 <Card className="flex flex-col items-center justify-center text-center p-6">
                    <TrendingUp className="h-12 w-12 text-accent" />
                    <p className="text-5xl font-bold mt-2">
                        {Object.values(data.checklist).filter(Boolean).length}/{checklistItems.length}
                    </p>
                    <p className="text-muted-foreground">Tasks Completed Today</p>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Today's Checklist: {format(new Date(), 'MMMM d, yyyy')}</CardTitle>
                    <CardDescription>Check off each item as you complete it throughout your trading day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {checklistItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox 
                                id={item.id} 
                                checked={data.checklist[item.id] || false}
                                onCheckedChange={(checked) => handleChecklistChange(item.id, !!checked)}
                                disabled={isCompletedForToday}
                            />
                            <Label 
                                htmlFor={item.id} 
                                className={cn("text-sm font-normal", data.checklist[item.id] && "line-through text-muted-foreground")}
                            >
                                {item.label}
                            </Label>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>End-of-Day Notes</CardTitle>
                    <CardDescription>Reflect on your discipline today. What can you improve tomorrow?</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="e.g., 'I held onto a losing trade for too long hoping it would turn around. I need to trust my stop-loss more.'"
                        className="min-h-[120px]"
                        value={data.notes}
                        onChange={handleNotesChange}
                        disabled={isCompletedForToday}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                {!isCompletedForToday && (
                    <>
                        <Button variant="outline" onClick={handleSaveChanges}>Save Progress</Button>
                        <Button onClick={handleCompleteDay} disabled={!allChecked}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Complete Day
                        </Button>
                    </>
                )}
                 {isCompletedForToday && (
                     <p className="text-green-500 font-semibold text-center w-full">You've completed your checklist for today. Great job!</p>
                )}
            </div>
        </div>
    )
}

export default DisciplineTrackerPage;
