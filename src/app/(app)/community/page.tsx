
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat, Loader2, UserPlus, Search, MoreHorizontal, Trash2, Edit, Image as ImageIcon } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc, writeBatch, increment, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { followUser, type UserProfile } from '@/services/user-service';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

type Comment = {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: any;
}

const PostActions = ({ post }: { post: Post }) => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    useEffect(() => {
        if (user && post.likedBy) {
            setIsLiked(post.likedBy.includes(user.uid));
        }
    }, [user, post.likedBy]);

    const handleLike = async () => {
        if (!user) {
            toast({ title: "Please log in to like posts.", variant: "destructive" });
            return;
        }

        const postRef = doc(db, 'posts', post.id);
        const likeRef = doc(db, `posts/${post.id}/likes`, user.uid);
        const likeDoc = await getDoc(likeRef);

        try {
            if (likeDoc.exists()) {
                // Unlike
                await writeBatch(db)
                    .delete(likeRef)
                    .update(postRef, { likeCount: increment(-1), likedBy: post.likedBy?.filter(id => id !== user.uid) })
                    .commit();
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            } else {
                // Like
                await writeBatch(db)
                    .set(likeRef, { userId: user.uid, createdAt: serverTimestamp() })
                    .update(postRef, { likeCount: increment(1), likedBy: [...(post.likedBy || []), user.uid] })
                    .commit();
                setIsLiked(true);
                setLikeCount(prev => prev - 1);
            }
        } catch (error) {
            console.error("Error liking post:", error);
            toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
        }
    };

    return (
        <>
            <div className="mt-4 flex justify-between items-center text-muted-foreground max-w-xs">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-blue-500" onClick={() => setIsCommentsOpen(true)}>
                    <MessageCircle size={18} />
                    <span>{post.commentCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-green-500">
                    <Repeat size={18} />
                    <span>0</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-2 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
                    onClick={handleLike}
                >
                    <Heart size={18} className={isLiked ? "fill-current" : ""} />
                    <span>{likeCount}</span>
                </Button>
            </div>
            {isCommentsOpen && <CommentsDialog postId={post.id} isOpen={isCommentsOpen} onOpenChange={setIsCommentsOpen} />}
        </>
    );
};

const CommentsDialog = ({ postId, isOpen, onOpenChange }: { postId: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            onSnapshot(userDocRef, (doc) => setProfile(doc.data() as UserProfile));
        }
    }, [user]);

    useEffect(() => {
        if (!postId) return;
        const q = query(collection(db, `posts/${postId}/comments`), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Comment[];
            setComments(commentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [postId]);

    const handleCommentSubmit = async () => {
        if (!user || !profile || !newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const commentsRef = collection(db, `posts/${postId}/comments`);
            await addDoc(commentsRef, {
                authorId: user.uid,
                authorName: profile.displayName,
                authorAvatar: profile.photoURL,
                content: newComment,
                createdAt: serverTimestamp(),
            });
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, { commentCount: increment(1) });

            setNewComment("");
        } catch (error) {
            toast({ title: "Error submitting comment", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto my-4 pr-2">
                    {isLoading ? <Loader2 className="mx-auto animate-spin" /> :
                        comments.length > 0 ? (
                            comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.authorAvatar || `https://placehold.co/100x100.png`} />
                                        <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-3 rounded-lg w-full">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">{comment.authorName}</p>
                                            <p className="text-xs text-muted-foreground">{comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}</p>
                                        </div>
                                        <p className="text-sm mt-1">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
                    }
                </div>
                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Textarea placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                    <Button onClick={handleCommentSubmit} disabled={isSubmitting || !newComment.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Comment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CommunityPost = React.memo(({ post, onPostUpdated }: { post: Post; onPostUpdated: () => void; }) => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const postDate = post.createdAt?.toDate();
    const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'just now';
    const isAuthor = user?.uid === post.authorId;
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    const handleFollow = async () => {
        if (!user) {
            toast({ title: "Please log in", description: "You must be logged in to follow users.", variant: "destructive" });
            return;
        }
        try {
            await followUser(db, user.uid, post.authorId);
            toast({ title: "Success", description: `You are now following ${post.authorName}.` });
        } catch (error) {
            console.error("Error following user:", error);
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const handleDelete = async (postId: string) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                toast({ title: "Post Deleted", description: "Your post has been removed." });
            } catch (error) {
                console.error("Error deleting post:", error);
                toast({ title: "Error", description: "Failed to delete the post.", variant: "destructive" });
            }
        }
    };

    return (
         <>
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
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline">{post.authorName}</Link>
                                    <span className="text-sm text-muted-foreground">@{post.authorHandle}</span>
                                    <span className="text-sm text-muted-foreground">· {timeAgo}</span>
                                </div>
                                <div className="flex items-center">
                                    {user && user.uid !== post.authorId && (
                                        <Button variant="outline" size="sm" onClick={handleFollow}>
                                            <UserPlus className="mr-1 h-4 w-4" /> Follow
                                        </Button>
                                    )}
                                    {isAuthor && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                                    <Edit className="mr-2 h-4 w-4"/> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                            <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{post.content}</p>
                            {post.imageUrl && (
                                <div className="mt-3 rounded-lg overflow-hidden border">
                                    <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                                </div>
                            )}
                            <PostActions post={post} />
                        </div>
                    </div>
                </CardContent>
            </Card>
         </>
    );
});
CommunityPost.displayName = 'CommunityPost';


const UserSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setResults([]);
            setIsSearching(false);
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

        return () => unsubscribe(); // This is the cleanup function
    }, [searchTerm]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                    placeholder="Search for other traders, posts, or #tags"
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

const CreatePost = () => {
    const [user] = useAuthState(auth);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { toast } = useToast();
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setProfile(doc.data() as UserProfile);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePostSubmit = async () => {
        if (!user || !profile || (!newPostContent.trim() && !imageFile)) return;
        setIsSubmitting(true);

        try {
            let imageUrl: string | undefined = undefined;
            if (imageFile) {
                const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
                await uploadString(ref(storage, storageRef.fullPath), imagePreview!, 'data_url');
                imageUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, 'posts'), {
                authorId: user.uid,
                authorName: profile.displayName,
                authorHandle: profile.displayName?.toLowerCase().replace(/\s/g, '_') || 'user',
                authorAvatar: profile.photoURL,
                content: newPostContent,
                imageUrl,
                createdAt: serverTimestamp(),
                likeCount: 0,
                commentCount: 0,
                likedBy: [],
            });
            setNewPostContent('');
            setImageFile(null);
            setImagePreview(null);
            toast({ title: "Post published!", description: "Your thoughts have been shared with the community." });
        } catch (error) {
            console.error("Error creating post:", error);
            toast({ title: "Error", description: "Could not publish your post.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={profile?.photoURL || `https://placehold.co/100x100.png`} data-ai-hint="profile avatar" />
                        <AvatarFallback>{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Textarea
                        placeholder="What's on your mind, trader?"
                        className="bg-background border-2 border-transparent focus-visible:ring-primary focus-visible:border-primary"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                {imagePreview && (
                    <div className="pl-16 relative">
                        <img src={imagePreview} alt="Preview" className="rounded-lg max-h-80" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="flex justify-between items-center pl-16">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="text-primary" />
                    </Button>
                    <Button onClick={handlePostSubmit} disabled={isSubmitting || (!newPostContent.trim() && !imageFile)}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</> : 'Post'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


const CommunityPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    likeCount: data.likeCount || 0,
                    commentCount: data.commentCount || 0,
                } as Post;
            });
            setPosts(postsData);
            setIsLoadingPosts(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setIsLoadingPosts(false);
        });
        return () => unsubscribe();
    }, []);

    const onPostUpdated = useCallback(() => {
      // The onSnapshot listener will automatically update the UI, 
      // but we could force a re-fetch here if needed.
    }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
        
        <UserSearch />

        <CreatePost />

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
                    <CommunityPost key={post.id} post={post} onPostUpdated={onPostUpdated} />
                ))
            )}
        </div>
    </div>
  );
};

export default CommunityPage;
