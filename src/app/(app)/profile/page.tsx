
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Bookmark, Users, MessageCircle, Repeat, Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

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


const UserStat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);


const savedPosts = [
    { id: 1, screenshot: 'https://placehold.co/400x400.png', pair: 'XAU/USD' },
    { id: 2, screenshot: 'https://placehold.co/400x400.png', pair: 'US30' },
];

const CommunityPost = ({ post }: { post: Post }) => {
    const postDate = post.createdAt?.toDate();
    const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'just now';

    return (
        <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={post.authorAvatar || `https://placehold.co/100x100.png`} data-ai-hint="profile avatar" />
                        <AvatarFallback>{post.authorName?.substring(0, 2) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{post.authorName}</h4>
                            <span className="text-sm text-muted-foreground">@{post.authorHandle}</span>
                            <span className="text-sm text-muted-foreground">· {timeAgo}</span>
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


const DiscoverPerson = ({ name, handle, avatar }: { name: string, handle: string, avatar: string}) => (
    <Card className="flex flex-col items-center p-4 text-center shrink-0 w-36">
        <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={avatar} data-ai-hint="profile avatar" />
            <AvatarFallback>{name.substring(0,2)}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-xs text-muted-foreground mb-3">@{handle}</p>
        <Button size="sm" className="w-full">Follow</Button>
    </Card>
)

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    if (user) {
        setIsLoadingPosts(true);
        const q = query(
            collection(db, "posts"),
            where("authorId", "==", user.uid),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
            setUserPosts(postsData);
            setIsLoadingPosts(false);
        });
        return () => unsubscribe();
    }
  }, [user]);

  const userHandle = user?.displayName?.toLowerCase().replace(/\s/g, '_') || 'user';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50">
          <AvatarImage src={user?.photoURL || "https://placehold.co/150x150.png"} data-ai-hint="profile avatar" />
          <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold font-headline">{user?.displayName || "Trader"}</h2>
            </div>
            <p className="text-muted-foreground mt-1">Focused on technical analysis and swing trading major FX pairs.</p>
            <div className="flex gap-6 sm:gap-8 my-4">
                <UserStat value={userPosts.length} label="posts" />
                <UserStat value={1952} label="followers" />
                <UserStat value={292} label="following" />
            </div>
             <div className="flex gap-2 mt-4">
                <Button asChild className="flex-1"><Link href="/settings">Edit Profile</Link></Button>
                <Button variant="outline" className="flex-1">Share Profile</Button>
            </div>
        </div>
      </div>

       <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"> <Users size={18} /> Discover People</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
               <DiscoverPerson name="JessicaFX" handle="jessica_fx" avatar="https://placehold.co/100x100.png"/>
               <DiscoverPerson name="MomentumMike" handle="mike_pips" avatar="https://placehold.co/100x100.png"/>
               <DiscoverPerson name="ScalperSarah" handle="sarah_scalps" avatar="https://placehold.co/100x100.png"/>
               <DiscoverPerson name="CryptoChris" handle="crypto_c" avatar="https://placehold.co/100x100.png"/>
               <DiscoverPerson name="AlexTrades" handle="alex_trades" avatar="https://placehold.co/100x100.png"/>
            </div>
       </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts"><Grid3x3 className="mr-2" /> Posts</TabsTrigger>
          <TabsTrigger value="saved"><Bookmark className="mr-2" /> Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <div>
            {isLoadingPosts ? (
                <div className="text-center py-16"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
            ) : userPosts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <MessageCircle size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Posts Yet</h3>
                    <p>Your posts will appear here once you create them.</p>
                </div>
            ) : (
                userPosts.map(post => (
                    <CommunityPost key={post.id} post={post} />
                ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="saved">
             <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
                {savedPosts.map(post => (
                     <div key={post.id} className="relative aspect-square cursor-pointer" onClick={() => setViewingImage(post.screenshot)}>
                        <Image src={post.screenshot} alt={`Trade on ${post.pair}`} layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="trade chart" />
                     </div>
                ))}
              </div>
              {savedPosts.length === 0 && (
                 <div className="text-center py-16 text-muted-foreground">
                    <Bookmark size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Saved Posts Yet</h3>
                    <p>Posts you save will appear here.</p>
                </div>
              )}
        </TabsContent>
      </Tabs>

       <Dialog open={!!viewingImage} onOpenChange={(isOpen) => !isOpen && setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Trade Screenshot</DialogTitle>
            </DialogHeader>
            {viewingImage && (
                 <div className="mt-4">
                    <Image src={viewingImage} alt="Trade Screenshot" width={1200} height={800} className="rounded-md" />
                 </div>
            )}
        </DialogContent>
       </Dialog>
    </div>
  );
}
