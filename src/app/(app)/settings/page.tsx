
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { type UserProfile, updateUserProfile } from "@/services/user-service";
import { Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";

export default function SettingsPage() {
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setProfile(doc.data());
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSaving(true);
        try {
            const profileDataToUpdate: Partial<UserProfile> = {
                displayName: profile.displayName,
                bio: profile.bio,
                photoURL: profile.photoURL,
            };

            await updateUserProfile(user.uid, profileDataToUpdate);

            // Also update the auth profile if displayName or photoURL changed
            if (profile.displayName !== user.displayName || profile.photoURL !== user.photoURL) {
                 await updateProfile(auth.currentUser!, {
                    displayName: profile.displayName,
                    photoURL: profile.photoURL
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
                Edit Profile
            </h1>
            <p className="text-muted-foreground mt-2">
                Manage your public profile information.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Public Details</CardTitle>
                    <CardDescription>This information will be displayed on your profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={profile.displayName || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="photoURL">Avatar URL</Label>
                        <Input id="photoURL" type="url" placeholder="https://example.com/image.png" value={profile.photoURL || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" placeholder="Tell us a little about your trading style." value={profile.bio || ''} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>

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

    