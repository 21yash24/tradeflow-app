
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Bookmark, Users } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';

const UserStat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const journalPosts = [
    { id: 1, screenshot: 'https://placehold.co/400x400.png', pair: 'EUR/USD' },
    { id: 2, screenshot: 'https://placehold.co/400x400.png', pair: 'GBP/JPY' },
    { id: 3, screenshot: 'https://placehold.co/400x400.png', pair: 'AUD/CAD' },
    { id: 4, screenshot: 'https://placehold.co/400x400.png', pair: 'XAU/USD' },
    { id: 5, screenshot: 'https://placehold.co/400x400.png', pair: 'US30' },
    { id: 6, screenshot: 'https://placehold.co/400x400.png', pair: 'BTC/USD' },
]

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
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50">
          <AvatarImage src="https://placehold.co/150x150.png" data-ai-hint="profile avatar" />
          <AvatarFallback>TP</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold font-headline">tradepilot</h2>
            </div>
            <p className="text-muted-foreground mt-1">Focused on technical analysis and swing trading major FX pairs.</p>
            <div className="flex gap-6 sm:gap-8 my-4">
                <UserStat value={128} label="posts" />
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

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid"><Grid3x3 className="mr-2" /> Trades</TabsTrigger>
          <TabsTrigger value="saved"><Bookmark className="mr-2" /> Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="grid">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
            {journalPosts.map(post => (
                 <div key={post.id} className="relative aspect-square cursor-pointer" onClick={() => setViewingImage(post.screenshot)}>
                    <Image src={post.screenshot} alt={`Trade on ${post.pair}`} layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="trade chart" />
                 </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="saved">
            <div className="text-center py-16 text-muted-foreground">
                <Bookmark size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No Saved Posts Yet</h3>
                <p>Posts you save will appear here.</p>
            </div>
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
