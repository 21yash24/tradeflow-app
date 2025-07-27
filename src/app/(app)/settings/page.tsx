
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { type UserProfile, type ChecklistItem } from "@/services/user-service";
import { Loader2, Upload, Trash2, PlusCircle } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

function ChecklistManager({ title, description, items, setItems }: { title: string, description: string, items: ChecklistItem[], setItems: (items: ChecklistItem[]) => void }) {
    
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
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
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
    const [user] = useAuthState(auth);
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setProfile(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({...prev, photoURL: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth.currentUser) return;
        
        setIsSaving(true);
        try {
            const firestoreDataToUpdate: Partial<UserProfile> = {
                displayName: profile.displayName,
                bio: profile.bio,
                photoURL: profile.photoURL,
                preTradeChecklist: profile.preTradeChecklist,
                disciplineChecklist: profile.disciplineChecklist,
            };

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, firestoreDataToUpdate);

            if (profile.displayName !== auth.currentUser.displayName) {
                 await updateProfile(auth.currentUser, {
                    displayName: profile.displayName,
                 });
            }

            toast({
                title: "Profile Updated",
                description: "Your profile has been saved successfully.",
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: "Could not save your profile.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
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
                Manage your public profile and checklist settings.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Public Details</CardTitle>
                    <CardDescription>This information will be displayed on your profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Avatar</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={profile.photoURL || `https://placehold.co/150x150.png`} data-ai-hint="profile avatar" />
                                <AvatarFallback>{profile.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={profile.displayName || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" placeholder="Tell us a little about your trading style." value={profile.bio || ''} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>

            <ChecklistManager 
                title="Pre-Trade Checklist"
                description="Customize the checklist that appears before you log a trade."
                items={profile.preTradeChecklist || []}
                setItems={(items) => setProfile(p => ({...p, preTradeChecklist: items}))}
            />

            <ChecklistManager 
                title="Daily Discipline Checklist"
                description="Customize your daily habit tracker."
                items={profile.disciplineChecklist || []}
                setItems={(items) => setProfile(p => ({...p, disciplineChecklist: items}))}
            />


            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    </div>
  );
}
