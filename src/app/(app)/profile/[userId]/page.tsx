
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Bookmark, MessageCircle, Repeat, Heart, Edit, Loader2, MoreHorizontal, Trash2, Image as ImageIcon } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc, writeBatch, increment, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { followUser, unfollowUser, type UserProfile } from '@/services/user-service';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from 'firebase/auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type Post = {
    id: string;
    authorId: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string | null;
    content: string;
    imageUrl?: string;
    createdAt: any;
    likeCount: number;
    commentCount: number;
    likedBy?: string[];
};

const EditProfileDialog = ({ userProfile }: { userProfile: UserProfile }) => {
    const { toast } = useToast();
    const [currentUser] = useAuthState(auth);
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    const [displayName, setDisplayName] = useState(userProfile.displayName);
    const [bio, setBio] = useState(userProfile.bio);
    const [photoURL, setPhotoURL] = useState(userProfile.photoURL);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [skills, setSkills] = useState(userProfile.skills?.join(', ') || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoURL(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !auth.currentUser) return;
        setIsSaving(true);
        
        try {
            let finalPhotoURL = userProfile.photoURL;

            if (imageFile && photoURL?.startsWith('data:')) {
                const storageRef = ref(storage, `avatars/${currentUser.uid}`);
                await uploadString(storageRef, photoURL, 'data_url');
                finalPhotoURL = await getDownloadURL(storageRef);
            }

            const firestoreDataToUpdate: Partial<UserProfile> = {
                displayName,
                bio,
                photoURL: finalPhotoURL,
                skills: skills.split(',').map(s => s.trim()).filter(Boolean),
            };

            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, firestoreDataToUpdate);
            
            if (displayName !== auth.currentUser.displayName || finalPhotoURL !== auth.currentUser.photoURL) {
                 await updateProfile(auth.currentUser, { displayName, photoURL: finalPhotoURL });
            }

            toast({ title: "Profile Updated" });
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="flex-1"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit your profile</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Avatar</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={photoURL || `https://placehold.co/150x150.png`} />
                                <AvatarFallback>{displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName || ''} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" placeholder="Tell us about your trading style." value={bio || ''} onChange={(e) => setBio(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills / Tags</Label>
                        <Input id="skills" placeholder="e.g., Python, Forex, Swing Trading" value={skills} onChange={(e) => setSkills(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Separate skills with a comma.</p>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const UserStat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const CommunityPost = React.memo(({ post }: { post: Post }) => {
    const postDate = post.createdAt?.toDate();
    const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'just now';
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const isAuthor = user?.uid === post.authorId;
    
    const handleDelete = async (postId: string) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                toast({ title: "Post Deleted" });
            } catch (error) {
                toast({ title: "Error deleting post", variant: "destructive" });
            }
        }
    };

    return (
        <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                     <Link href={`/profile/${post.authorId}`}>
                        <Avatar>
                            <AvatarImage src={post.authorAvatar || `https://placehold.co/100x100.png`} />
                            <AvatarFallback>{post.authorName?.substring(0, 2) || 'U'}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="w-full">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline">{post.authorName}</Link>
                                <span className="text-sm text-muted-foreground">@{post.authorHandle}</span>
                                <span className="text-sm text-muted-foreground">· {timeAgo}</span>
                            </div>
                            {isAuthor && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-5 w-5" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{post.content}</p>
                        {post.imageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden border">
                                <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                            </div>
                        )}
                        <div className="mt-4 flex justify-between items-center text-muted-foreground max-w-xs">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-blue-500">
                               <MessageCircle size={18} /><span>{post.commentCount}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-green-500">
                               <Repeat size={18} /><span>0</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-red-500">
                               <Heart size={18} /><span>{post.likeCount}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
CommunityPost.displayName = 'CommunityPost';


const PostSkeleton = () => (
    <Card className="mb-4">
        <CardContent className="p-4">
            <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const ProfileHeaderSkeleton = () => (
     <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
        <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4" />
        <div className="flex-grow space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-sm" />
             <Skeleton className="h-4 w-full max-w-xs" />
            <div className="flex gap-6 sm:gap-8 my-4">
                <div className="text-center space-y-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-12" /></div>
                <div className="text-center space-y-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
                <div className="text-center space-y-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
            </div>
             <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
      </div>
)

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const [currentUser] = useAuthState(auth);
    const { toast } = useToast();

    const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
        setIsLoading(true);

        const userUnsub = onSnapshot(doc(db, 'users', userId), (doc) => {
            if(doc.exists()){ setProfileUser({ ...doc.data(), uid: doc.id } as UserProfile); }
            setIsLoading(false);
        });

        const postsUnsub = onSnapshot(query(collection(db, "posts"), where("authorId", "==", userId), orderBy("createdAt", "desc")), (snapshot) => {
            setUserPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Post));
        });

        let isFollowingUnsub = () => {};
        if (currentUser) {
            isFollowingUnsub = onSnapshot(doc(db, 'users', currentUser.uid, 'following', userId), (doc) => {
                setIsFollowing(doc.exists());
            });
        }
        return () => { userUnsub(); postsUnsub(); isFollowingUnsub(); };
    }, [userId, currentUser]);

    const handleFollow = async () => {
        if (!currentUser) { toast({ title: 'Please log in to follow users.', variant: 'destructive'}); return; };
        await followUser(db, currentUser.uid, userId);
        toast({ title: "Followed" });
    };

    const handleUnfollow = async () => {
        if (!currentUser) return;
        await unfollowUser(db, currentUser.uid, userId);
        toast({ title: "Unfollowed" });
    };

    const isCurrentUserProfile = currentUser?.uid === userId;

    return (
        <div className="space-y-6">
        {isLoading ? <ProfileHeaderSkeleton /> : profileUser && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50">
                <AvatarImage src={profileUser.photoURL || `https://placehold.co/150x150.png`} />
                <AvatarFallback>{profileUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold font-headline">{profileUser.displayName || "Trader"}</h2>
                    <p className="text-muted-foreground mt-1">{profileUser.bio}</p>
                    {profileUser.skills && profileUser.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {profileUser.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                    )}
                    <div className="flex gap-6 sm:gap-8 my-4">
                        <UserStat value={userPosts.length} label="posts" />
                        <UserStat value={profileUser.followersCount || 0} label="followers" />
                        <UserStat value={profileUser.followingCount || 0} label="following" />
                    </div>
                    <div className="flex gap-2 mt-4">
                        {isCurrentUserProfile ? (
                            <EditProfileDialog userProfile={profileUser} />
                        ) : (
                            <>
                                {isFollowing ? (
                                    <Button variant="outline" className="flex-1" onClick={handleUnfollow}>Unfollow</Button>
                                ) : (
                                    <Button className="flex-1" onClick={handleFollow}>Follow</Button>
                                )}
                                <Button variant="outline" className="flex-1">Message</Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts"><Grid3x3 className="mr-2" /> Posts</TabsTrigger>
            <TabsTrigger value="saved"><Bookmark className="mr-2" /> Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
            <div className="pt-4">
                {isLoading ? (
                    <div className="space-y-4 pt-4"><PostSkeleton /><PostSkeleton /></div>
                ) : userPosts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <MessageCircle size={48} className="mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">No Posts Yet</h3>
                    </div>
                ) : (
                    userPosts.map(post => <CommunityPost key={post.id} post={post} />)
                )}
            </div>
            </TabsContent>
            <TabsContent value="saved">
                <div className="text-center py-16 text-muted-foreground">
                    <Bookmark size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Saved Posts Yet</h3>
                </div>
            </TabsContent>
        </Tabs>
        </div>
    );
}

    