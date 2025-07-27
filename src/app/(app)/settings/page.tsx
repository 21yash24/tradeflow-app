
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
import { type UserProfile } from "@/services/user-service";
import { Loader2, Upload } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            // Data to be saved in the Firestore 'users' collection document.
            // This is where we store the potentially long data URI for the photo.
            const firestoreDataToUpdate: Partial<UserProfile> = {
                displayName: profile.displayName,
                bio: profile.bio,
                photoURL: profile.photoURL,
            };

            // Update Firestore document. This is fine with the long data URI.
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, firestoreDataToUpdate);

            // Data for the core Firebase Auth user profile.
            // We ONLY update the displayName here. We DO NOT update the photoURL
            // to avoid the "URL too long" error.
            if (profile.displayName !== user.displayName) {
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
