

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Community Hub
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect with other traders, share insights, and grow together. (Coming Soon)
        </p>
      </div>
      <Card className="text-center p-12">
          <CardHeader>
              <CardTitle>Feature Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground">We're working hard to build a vibrant community space. Stay tuned!</p>
               <div className="flex justify-center items-center mt-8 space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="@trader1" data-ai-hint="profile avatar" />
                        <AvatarFallback>T1</AvatarFallback>
                    </Avatar>
                     <Avatar className="h-20 w-20">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="@trader2" data-ai-hint="profile avatar" />
                        <AvatarFallback>T2</AvatarFallback>
                    </Avatar>
                     <Avatar className="h-16 w-16">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="@trader3" data-ai-hint="profile avatar" />
                        <AvatarFallback>T3</AvatarFallback>
                    </Avatar>
               </div>
          </CardContent>
      </Card>
    </div>
  );
}
