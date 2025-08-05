
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat, Loader2, UserPlus, Search, MoreHorizontal, Trash2, Edit, Image as ImageIcon, Home, TrendingUp, Users, Bot, Hash, Globe, Paperclip, Send } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc, runTransaction, increment, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { followUser, type UserProfile } from '@/services/user-service';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { thinker, type ThinkerOutput } from '@/ai/flows/thinker-flow';
import { cn } from '@/lib/utils';
import { TradeFlowLogo } from '@/components/icons';
import { type MarketAnalysis } from '@/ai/flows/market-analyzer-flow';
import { type TradeAnalysis } from '@/ai/flows/trade-analyst-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, TrendingDown, MinusCircle, Layers, Target, Wand2, Lightbulb, ShieldCheck, AlertCircle } from 'lucide-react';


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
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const isLiked = user && post.likedBy ? post.likedBy.includes(user.uid) : false;

    const handleLike = async () => {
        if (!user) {
            toast({ title: "Please log in to like posts.", variant: "destructive" });
            return;
        }

        const postRef = doc(db, 'posts', post.id);

        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    throw "Post does not exist!";
                }

                const currentLikedBy = postDoc.data().likedBy || [];
                const userHasLiked = currentLikedBy.includes(user.uid);

                if (userHasLiked) {
                    // Unlike
                    transaction.update(postRef, {
                        likeCount: increment(-1),
                        likedBy: arrayRemove(user.uid)
                    });
                } else {
                    // Like
                    transaction.update(postRef, {
                        likeCount: increment(1),
                        likedBy: arrayUnion(user.uid)
                    });
                }
            });
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
                    <span>{post.likeCount}</span>
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
            if (imageFile && imagePreview) {
                const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
                await uploadString(storageRef, imagePreview, 'data_url');
                imageUrl = await getDownloadURL(storageRef);
            }

            const postData: any = {
                authorId: user.uid,
                authorName: profile.displayName,
                authorHandle: profile.displayName?.toLowerCase().replace(/\s/g, '_') || 'user',
                authorAvatar: profile.photoURL,
                content: newPostContent,
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
                likeCount: 0,
                commentCount: 0,
                likedBy: [],
            };

            await addDoc(collection(db, 'posts'), postData);

            setNewPostContent('');
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
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

const GroupsPanel = () => {
    const groups = [
        { name: 'All Posts', icon: Home, active: true },
        { name: 'Swing Traders', icon: TrendingUp },
        { name: 'Day Traders', icon: Users },
        { name: 'Price Action Ninjas', icon: Bot },
        { name: 'Algo Wizards', icon: Globe },
        { name: 'Crypto Crew', icon: Hash },
    ];
    return (
        <Card>
            <CardHeader>
                <CardTitle>Groups</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {groups.map(group => (
                        <Button key={group.name} variant={group.active ? "secondary" : "ghost"} className="w-full justify-start">
                           <group.icon className="mr-2 h-5 w-5" />
                           {group.name}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
};

type AiMessage = {
    id: string;
    sender: 'user' | 'bot';
    content: React.ReactNode;
    isTyping?: boolean;
}

function MarketAnalysisResult({ analysis }: { analysis: MarketAnalysis }) {
    const sentimentMap = {
        Bullish: { icon: TrendingUp, color: 'text-green-500' },
        Bearish: { icon: TrendingDown, color: 'text-red-500' },
        Neutral: { icon: MinusCircle, color: 'text-yellow-500' },
    };
    const SentimentIcon = sentimentMap[analysis.overallSentiment].icon;
    const sentimentColor = sentimentMap[analysis.overallSentiment].color;

    return (
        <div className="space-y-4">
            <h3 className={cn("font-bold text-lg flex items-center gap-2", sentimentColor)}>
                <SentimentIcon /> Market Analysis Report
            </h3>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.marketInsights}</p>
            
            <h4 className="font-semibold flex items-center gap-2"><Lightbulb className="text-yellow-400"/> Potential Biases</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.potentialBiases}</p>
            
            <h4 className="font-semibold flex items-center gap-2"><ShieldCheck className="text-green-500"/> Addressing Your Concerns</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.addressingConcerns}</p>

            <h4 className="font-semibold flex items-center gap-2"><Target className="text-blue-400"/> Actionable Next Steps</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {analysis.actionableNextSteps.map((step, i) => <li key={i}>{step}</li>)}
            </ul>
        </div>
    )
}

function TradeAnalysisResult({ analysis }: { analysis: TradeAnalysis }) {
    return (
        <div className="space-y-4">
             <h3 className="font-bold text-lg flex items-center gap-2"><Wand2 /> Trade Review Analysis</h3>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.summary}</p>
             
             <h4 className="font-semibold flex items-center gap-2 text-green-400"><CheckCircle/> What Went Well</h4>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.whatWentWell}</p>
             
             <h4 className="font-semibold flex items-center gap-2 text-red-400"><AlertCircle/> What to Improve</h4>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.whatToImprove}</p>
             
             <h4 className="font-semibold flex items-center gap-2 text-yellow-400"><Lightbulb/> Potential Biases</h4>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.potentialBiases}</p>
        </div>
    )
}

function BotMessage({ output }: { output: ThinkerOutput }) {
    if (output.marketAnalysis) {
        return <MarketAnalysisResult analysis={output.marketAnalysis} />;
    }
    if (output.tradeAnalysis) {
        return <TradeAnalysisResult analysis={output.tradeAnalysis} />;
    }
    return <p>{output.answer}</p>;
}

const AiThinker = () => {
    const [user] = useAuthState(auth);
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Initial message from the bot
        addMessage('bot', "Hello! I'm your AI trading thinker. You can ask me to analyze a chart, review a trade, or discuss your trading psychology. How can I help you today?");
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the chat on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const addMessage = (sender: 'user' | 'bot', content: React.ReactNode, isTyping = false) => {
        const newMessage = { id: `${Date.now()}-${Math.random()}`, sender, content, isTyping };
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.isTyping) {
                // Replace typing indicator with the actual message
                return [...prev.slice(0, -1), newMessage];
            }
            return [...prev, newMessage];
        });
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !imagePreview) || isLoading || !user) return;

        const userMessage = (
            <div>
                {input}
                {imagePreview && <Image src={imagePreview} alt="chart" width={200} height={150} className="rounded-md mt-2" />}
            </div>
        );
        addMessage('user', userMessage);
        setIsLoading(true);
        addMessage('bot', '', true);

        const currentInput = input;
        const currentImage = imagePreview;

        setInput('');
        setImagePreview(null);
        
        try {
            const result = await thinker({
                prompt: currentInput,
                photoDataUri: currentImage || undefined,
                userId: user.uid,
            });
            addMessage('bot', <BotMessage output={result} />);
        } catch (error) {
            console.error(error);
            toast({ title: 'An Error Occurred', description: 'Could not get a response from the AI. Please try again.', variant: 'destructive'});
            addMessage('bot', 'Sorry, I ran into an error. Please check your configuration and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>AI Thinker</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4 overflow-y-auto" ref={scrollRef}>
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'user' && 'justify-end')}>
                             {msg.sender === 'bot' && (
                                <Avatar className="h-8 w-8 self-start">
                                    <div className="bg-primary rounded-full p-1.5">
                                        <TradeFlowLogo className="text-primary-foreground" />
                                    </div>
                                </Avatar>
                            )}
                            <div className={cn(
                                "max-w-md p-3 rounded-2xl",
                                msg.sender === 'bot' ? 'bg-muted rounded-bl-none' : 'bg-primary text-primary-foreground rounded-br-none'
                            )}>
                                {msg.isTyping ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="h-2 w-2 bg-current rounded-full animate-bounce" />
                                    </div>
                                ) : msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            
            <div className="p-2 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex items-start gap-1">
                     <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                     <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                         <Paperclip className="h-5 w-5" />
                         <span className="sr-only">Attach image</span>
                     </Button>
                    <div className="flex-grow relative">
                        {imagePreview && (
                            <div className="absolute bottom-full left-0 mb-2 p-1 bg-muted rounded-md border">
                                <Image src={imagePreview} alt="Preview" width={80} height={60} className="rounded-sm" />
                                 <button type="button" onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                                    &times;
                                </button>
                            </div>
                        )}
                        <Textarea
                            placeholder="Ask the AI..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={1}
                            className="flex-grow resize-none pr-12"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                         <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading || (!input.trim() && !imagePreview)}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    )
}

const RightPanel = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <Card>
                <CardHeader>
                    <CardTitle>Trending Topics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {['#NFP', '#FOMC', '#EURUSD', '#RiskManagement', '#Crypto'].map(tag => (
                            <div key={tag} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-primary">{tag}</span>
                                <span className="text-muted-foreground">1,234 posts</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <div className="flex-grow">
                 <AiThinker />
            </div>
        </div>
    )
}

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

    const onPostUpdated = useCallback(() => {}, []);


  return (
    <div className="grid lg:grid-cols-10 gap-6 h-full">
      <div className="lg:col-span-2 hidden lg:block">
          <GroupsPanel />
      </div>
      <div className="lg:col-span-5 space-y-4">
        <h1 className="text-3xl font-bold font-headline lg:hidden">Community Hub</h1>
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
       <div className="lg:col-span-3 hidden lg:block">
          <RightPanel />
      </div>
    </div>
  );
};

export default CommunityPage;

