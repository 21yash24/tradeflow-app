
'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CommunityPage = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">Trade Ideas</TabsTrigger>
          <TabsTrigger value="charts">Chart Gallery</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes Wall</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <Card className="mb-6">
            <CardContent className="space-y-4 p-4">
              <div className="flex gap-4 items-center">
                <Avatar>
                  <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" />
                  <AvatarFallback>TR</AvatarFallback>
                </Avatar>
                <Input placeholder="Share a trade idea (e.g. XAUUSD NY Killzone)..." />
              </div>
              <Textarea placeholder="Explain your setup, entry, SL, TP and confluences..." />
              <Button>Post Idea</Button>
            </CardContent>
          </Card>

          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-4 hover:shadow-xl transition">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Avatar>
                      <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" />
                      <AvatarFallback>TR</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">Trader {i}</h4>
                      <p className="text-xs text-muted-foreground">EURUSD | 1:3 RR | NY Session</p>
                    </div>
                  </div>
                  <Button variant="ghost">❤️ Like</Button>
                </div>
                <p className="mt-4">Caught liquidity before NY open. Break of structure + FVG + 1H OB confluence. TP smashed.</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="charts">
            <Card className="text-center p-12">
                 <h2 className="text-xl font-bold mb-2">Chart Gallery</h2>
                 <p className="text-muted-foreground">Coming soon: Upload and rate trade charts.</p>
            </Card>
        </TabsContent>

        <TabsContent value="mistakes">
            <Card className="text-center p-12">
                <h2 className="text-xl font-bold mb-2">Mistakes Wall</h2>
                <p className="text-muted-foreground">Coming soon: Learn from others' mistakes.</p>
            </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="p-4">
            <h2 className="text-xl font-bold mb-2">Top Consistent Traders</h2>
            <ul className="space-y-2">
              <li className='p-2 rounded-md hover:bg-muted/50'>🥇 Alex – 18 win streak, avg RR 1:2.5</li>
              <li className='p-2 rounded-md hover:bg-muted/50'>🥈 Jess – 15 days disciplined, avg loss -0.5%</li>
              <li className='p-2 rounded-md hover:bg-muted/50'>🥉 Ravi – 13 wins, zero revenge trades</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityPage;
