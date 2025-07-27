
'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat } from 'lucide-react';

const CommunityPost = ({ post }: { post: any }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4">
            <div className="flex items-start gap-4">
                <Avatar>
                    <AvatarImage src={post.avatarUrl} data-ai-hint="profile avatar" />
                    <AvatarFallback>{post.fallback}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{post.author}</h4>
                        <span className="text-sm text-muted-foreground">@{post.handle}</span>
                        <span className="text-sm text-muted-foreground">· {post.time}</span>
                    </div>
                    <p className="mt-2 text-foreground/90">{post.content}</p>
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


const mockPosts = [
    {
        id: 1,
        author: 'TraderAlex',
        handle: 'alex_trades',
        avatarUrl: 'https://placehold.co/100x100.png',
        fallback: 'TA',
        time: '2h',
        content: 'Caught a beautiful breakout on $EURUSD during the London session. Price broke above the range high, retested, and flew. Simple, clean, effective. Patience pays off!',
        replies: 12,
        retweets: 25,
        likes: 102
    },
    {
        id: 2,
        author: 'JessicaFX',
        handle: 'jessica_fx',
        avatarUrl: 'https://placehold.co/100x100.png',
        fallback: 'JF',
        time: '5h',
        content: 'Mistake of the day: Revenge trading after a small loss on $GBPUSD. Forced a setup that wasn\'t there and paid the price. A good reminder to step away and reset after a loss.',
        replies: 34,
        retweets: 15,
        likes: 150
    },
     {
        id: 3,
        author: 'MomentumMike',
        handle: 'mike_pips',
        avatarUrl: 'https://placehold.co/100x100.png',
        fallback: 'MM',
        time: '1d',
        content: 'Looking at a potential short on $XAUUSD. We\'re seeing bearish divergence on the 4H chart and a rejection from a key resistance level. Waiting for confirmation on the 1H timeframe before entering.',
        replies: 45,
        retweets: 88,
        likes: 231
    },
];


const CommunityPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" />
                        <AvatarFallback>TP</AvatarFallback>
                    </Avatar>
                    <Textarea 
                        placeholder="What's on your mind, trader?" 
                        className="bg-background border-2 border-transparent focus-visible:ring-primary focus-visible:border-primary"
                    />
                </div>
                <div className="flex justify-end">
                    <Button>Post</Button>
                </div>
            </CardContent>
        </Card>

        <div>
            {mockPosts.map((post) => (
                <CommunityPost key={post.id} post={post} />
            ))}
        </div>
    </div>
  );
};

export default CommunityPage;
