
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Flame, CheckCircle2, TrendingUp, Loader2, History, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday, differenceInCalendarDays, parseISO } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ChecklistItem, UserProfile } from '@/services/user-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type DisciplineData = {
    id: string; // Document ID: `${user.uid}_${date}`
    lastCompletedDate?: string;
    streak: number;
    checklist: ChecklistState;
    notes: string;
    userId?: string; 
    date?: string; 
}

type ChecklistState = Record<string, boolean>;

const DisciplineTrackerPage = () => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [data, setData] = useState<Partial<DisciplineData>>({
        streak: 0,
        checklist: {},
        notes: ''
    });
    const [history, setHistory] = useState<DisciplineData[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const docRef = user ? doc(db, 'discipline', `${user.uid}_${todayStr}`) : null;
    const streakRef = user ? doc(db, 'streaks', user.uid) : null;
    
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubUser = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as UserProfile;
                    if (data.disciplineChecklist && data.disciplineChecklist.length > 0) {
                        setChecklistItems(data.disciplineChecklist);
                    }
                }
            });
            return () => unsubUser();
        }
    }, [user]);

    // Effect for fetching today's data and streak
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        let isSubscribed = true;
        let unsubStreak: (() => void) | undefined;
        let unsubDiscipline: (() => void) | undefined;

        const fetchData = () => {
             if (!streakRef || !docRef) return;
             
             unsubStreak = onSnapshot(streakRef, (docSnap) => {
                if (!isSubscribed) return;
                if (docSnap.exists()) {
                    const streakData = docSnap.data();
                    const lastDate = streakData.lastCompletedDate ? new Date(streakData.lastCompletedDate) : new Date();
                    const today = new Date();
                    
                    if (differenceInCalendarDays(today, lastDate) > 1) {
                        setData(prev => ({...prev, streak: 0}));
                    } else {
                        setData(prev => ({...prev, streak: streakData.streak || 0}));
                    }
                }
             });

            unsubDiscipline = onSnapshot(docRef, (docSnap) => {
                if (!isSubscribed) return;
                if (docSnap.exists()) {
                     const docData = docSnap.data() as Omit<DisciplineData, 'streak'>;
                     setData(prev => ({...prev, ...docData}));
                }
                setIsLoading(false);
            }, (error) => {
                 console.error("Error fetching discipline data:", error);
                 setIsLoading(false);
            });
        };

        fetchData();

        return () => {
            isSubscribed = false;
            if (unsubStreak) unsubStreak();
            if (unsubDiscipline) unsubDiscipline();
        };

    }, [user, todayStr]);

    // Effect for fetching historical data
    useEffect(() => {
        if (!user) {
            setIsLoadingHistory(false);
            return;
        }
        setIsLoadingHistory(true);
        const q = query(
            collection(db, "discipline"),
            where("userId", "==", user.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id }) as DisciplineData)
                .sort((a, b) => {
                    if (a.date && b.date) {
                        // Sort descending (newest first)
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }
                    return 0;
                });
            setHistory(historyData);
            setIsLoadingHistory(false);
        });
        return () => unsubscribe();
    }, [user]);

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
        if (!docRef || !user) return;
        try {
            await setDoc(docRef, {
                userId: user.uid,
                date: todayStr,
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
            await setDoc(docRef, {
                userId: user.uid,
                date: todayStr,
                checklist: data.checklist,
                notes: data.notes,
                lastCompletedDate: todayStr,
            }, { merge: true });

            const streakDoc = await getDoc(streakRef);
            let currentStreak = 0;
            if (streakDoc.exists()) {
                const lastDateStr = streakDoc.data().lastCompletedDate;
                if(lastDateStr) {
                    const lastDate = new Date(lastDateStr);
                    if (isYesterday(lastDate) || isToday(lastDate)) { 
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
    
    const handleDeleteHistory = async (docId: string) => {
        if (window.confirm("Are you sure you want to delete this historical entry? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'discipline', docId));
                toast({ title: 'Entry Deleted', description: 'The historical log has been removed.' });
            } catch (error) {
                console.error("Error deleting history entry:", error);
                toast({ title: 'Error', description: 'Failed to delete the entry.', variant: 'destructive' });
            }
        }
    }

    const isCompletedForToday = data.lastCompletedDate === todayStr;
    const allChecked = checklistItems.length > 0 && checklistItems.every(item => data.checklist?.[item.id]);

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
                        {Object.values(data.checklist || {}).filter(Boolean).length}/{checklistItems.length}
                    </p>
                    <p className="text-muted-foreground">Tasks Completed Today</p>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Today's Checklist: {format(new Date(), 'MMMM d, yyyy')}</CardTitle>
                    <CardDescription>Check off each item as you complete it. Customize your list in Settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {checklistItems.length > 0 ? checklistItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox 
                                id={item.id} 
                                checked={data.checklist?.[item.id] || false}
                                onCheckedChange={(checked) => handleChecklistChange(item.id, !!checked)}
                                disabled={isCompletedForToday}
                            />
                            <Label 
                                htmlFor={item.id} 
                                className={cn("text-sm font-normal", (data.checklist?.[item.id] && !isCompletedForToday) && "line-through text-muted-foreground", isCompletedForToday && "text-muted-foreground")}
                            >
                                {item.label}
                            </Label>
                        </div>
                    )) : (
                        <p className="text-muted-foreground text-center py-4">No discipline checklist items found. You can add them in Settings.</p>
                    )}
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
                        <Button variant="outline" onClick={handleSaveChanges}>Save Changes</Button>
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-6 w-6" /> Discipline History</CardTitle>
                    <CardDescription>Review your performance from previous days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead className="w-[150px]">Completion</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingHistory ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No history found. Complete a day to start your log.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map(log => {
                                    const completedCount = Object.values(log.checklist || {}).filter(Boolean).length;
                                    const totalCount = checklistItems.length;
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.date ? format(parseISO(log.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={completedCount === totalCount && totalCount > 0 ? "default" : "secondary"}>
                                                    {completedCount} / {totalCount} tasks
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{log.notes || 'No notes.'}</TableCell>
                                            <TableCell className="text-right">
                                                {log.date !== todayStr && (
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteHistory(log.id)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Delete Entry</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                    </TooltipProvider>
                </CardContent>
            </Card>
        </div>
    )
}

export default DisciplineTrackerPage;
