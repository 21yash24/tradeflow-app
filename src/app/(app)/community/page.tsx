
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat, Loader2, UserPlus, Search } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { followUser, type UserProfile } from '@/services/user-service';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

type Post = {
    id: string;
    authorId: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string | null;
    content: string;
    createdAt: any;
    likes: number;
    replies: number;
    retweets: number;
};

const CommunityPost = ({ post }: { post: Post }) => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const postDate = post.createdAt?.toDate();
    const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'just now';
    
    const handleFollow = async () => {
        if (!user) {
            toast({ title: "Please log in", description: "You must be logged in to follow users.", variant: "destructive" });
            return;
        }
        try {
            await followUser(user.uid, post.authorId);
            toast({ title: "Success", description: `You are now following ${post.authorName}.` });
        } catch (error) {
            console.error("Error following user:", error);
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    return (
        <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Link href={`/profile/${post.authorId}`}>
                        <Avatar>
                            <AvatarImage src={post.authorAvatar || `https://placehold.co/100x100.png`} data-ai-hint="profile avatar" />
                            <AvatarFallback>{post.authorName?.substring(0, 2) || 'U'}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline">{post.authorName}</Link>
                            <span className="text-sm text-muted-foreground">@{post.authorHandle}</span>
                            <span className="text-sm text-muted-foreground">· {timeAgo}</span>
                            {user && user.uid !== post.authorId && (
                                <Button variant="outline" size="sm" className="ml-auto" onClick={handleFollow}>
                                    <UserPlus className="mr-1 h-4 w-4" /> Follow
                                </Button>
                            )}
                        </div>
                        <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{post.content}</p>
                        <div className="mt-4 flex justify-between items-center text-muted-foreground max-w-xs">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-blue-500">
                               <MessageCircle size={18} /> 
                               <span>{post.replies}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-green-500">
                               <Repeat size={18} /> 
                               <span>{post.retweets}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-red-500">
                               <Heart size={18} /> 
                               <span>{post.likes}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const UserSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setResults([]);
            return;
        }

        setIsSearching(true);
        const q = query(
            collection(db, "users"),
            where("displayName", ">=", searchTerm),
            where("displayName", "<=", searchTerm + '\uf8ff')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
            setResults(usersData);
            setIsSearching(false);
        });

        return () => unsubscribe();
    }, [searchTerm]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                    placeholder="Search for other traders..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {searchTerm && (
                 <Card className="absolute top-full mt-2 w-full z-10">
                     <CardContent className="p-2">
                        {isSearching && <p className="p-4 text-center text-muted-foreground">Searching...</p>}
                        {!isSearching && results.length === 0 && <p className="p-4 text-center text-muted-foreground">No users found.</p>}
                        {results.map(user => (
                            <Link href={`/profile/${user.uid}`} key={user.uid} className="block" onClick={() => setSearchTerm('')}>
                                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <Avatar>
                                        <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png`} data-ai-hint="profile avatar" />
                                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.displayName}</p>
                                        <p className="text-sm text-muted-foreground">@{user.displayName.toLowerCase().replace(/\s/g, '_')}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                     </CardContent>
                 </Card>
            )}
        </div>
    )
}


const CommunityPage = () => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
            setPosts(postsData);
setIsLoadingPosts(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePostSubmit = async () => {
        if (!user || !newPostContent.trim()) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'posts'), {
                authorId: user.uid,
                authorName: user.displayName,
                authorHandle: user.displayName?.toLowerCase().replace(/\s/g, '_') || 'user',
                authorAvatar: user.photoURL,
                content: newPostContent,
                createdAt: serverTimestamp(),
                likes: 0,
                replies: 0,
                retweets: 0,
            });
            setNewPostContent('');
            toast({ title: "Post published!", description: "Your thoughts have been shared with the community." });
        } catch (error) {
            console.error("Error creating post:", error);
            toast({ title: "Error", description: "Could not publish your post.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
        
        <UserSearch />

        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={user?.photoURL || `https://placehold.co/100x100.png`} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Textarea 
                        placeholder="What's on your mind, trader?" 
                        className="bg-background border-2 border-transparent focus-visible:ring-primary focus-visible:border-primary"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handlePostSubmit} disabled={isSubmitting || !newPostContent.trim()}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</> : 'Post'}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div>
            {isLoadingPosts ? (
                 <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <h3 className="text-xl font-semibold">Loading Community Feed</h3>
                </div>
            ) : posts.length === 0 ? (
                 <div className="text-center py-16 text-muted-foreground">
                    <MessageCircle size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">It's quiet in here...</h3>
                    <p>Be the first to share something with the community!</p>
                </div>
            ) : (
                posts.map((post) => (
                    <CommunityPost key={post.id} post={post} />
                ))
            )}
        </div>
    </div>
  );
};

export default CommunityPage;
