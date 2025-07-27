
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Bookmark, MessageCircle, Repeat, Heart, Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { followUser, unfollowUser, type UserProfile } from '@/services/user-service';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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

const CommunityPost = ({ post }: { post: Post }) => {
    const postDate = post.createdAt?.toDate();
    const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'just now';

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
                        <div className="flex items-center gap-2">
                             <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline">{post.authorName}</Link>
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
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-6 sm:gap-8 my-4">
                <div className="text-center space-y-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-12" /></div>
                <div className="text-center space-y-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
                <div className="text-center space-y-1"><Skeleton className="h-6 w-8" /><Skeleton className="h-4 w-16" /></div>
            </div>
             <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
        </div>
      </div>
)


export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const [currentUser] = useAuthState(auth);
  const { toast } = useToast();
  const { userId } = params;

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    const userDocRef = doc(db, 'users', userId);
    const userUnsub = onSnapshot(userDocRef, (doc) => {
        if(doc.exists()){
            setProfileUser(doc.data() as UserProfile);
        } else {
            // handle user not found
        }
    });

    const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const postsUnsub = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
        setUserPosts(postsData);
    });
    
    const followersQuery = collection(db, 'users', userId, 'followers');
    const followingQuery = collection(db, 'users', userId, 'following');
    const followersUnsub = onSnapshot(followersQuery, (snapshot) => setFollowers(snapshot.size));
    const followingUnsub = onSnapshot(followingQuery, (snapshot) => setFollowing(snapshot.size));

    let isFollowingUnsub = () => {};
    if (currentUser) {
        const isFollowingRef = doc(db, 'users', currentUser.uid, 'following', userId);
        isFollowingUnsub = onSnapshot(isFollowingRef, (doc) => {
            setIsFollowing(doc.exists());
        });
    }

    // Combine loading states
    Promise.all([new Promise(res => onSnapshot(userDocRef, res))]).then(() => setIsLoading(false));

    return () => {
        userUnsub();
        postsUnsub();
        followersUnsub();
        followingUnsub();
        isFollowingUnsub();
    };
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    await followUser(currentUser.uid, userId);
    toast({ title: "Followed", description: `You are now following ${profileUser?.displayName}.` });
  };
  const handleUnfollow = async () => {
    if (!currentUser) return;
    await unfollowUser(currentUser.uid, userId);
    toast({ title: "Unfollowed", description: `You are no longer following ${profileUser?.displayName}.` });
  };

  const isCurrentUserProfile = currentUser?.uid === userId;

  return (
    <div className="space-y-6">
      {isLoading ? <ProfileHeaderSkeleton /> : profileUser && (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50">
              <AvatarImage src={profileUser.photoURL || `https://placehold.co/150x150.png`} data-ai-hint="profile avatar" />
              <AvatarFallback>{profileUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold font-headline">{profileUser.displayName || "Trader"}</h2>
                </div>
                <p className="text-muted-foreground mt-1">{profileUser.bio}</p>
                <div className="flex gap-6 sm:gap-8 my-4">
                    <UserStat value={userPosts.length} label="posts" />
                    <UserStat value={followers} label="followers" />
                    <UserStat value={following} label="following" />
                </div>
                 <div className="flex gap-2 mt-4">
                    {isCurrentUserProfile ? (
                        <>
                            <Button asChild className="flex-1"><Link href="/settings">Edit Profile</Link></Button>
                            <Button variant="outline" className="flex-1">Share Profile</Button>
                        </>
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
                <div className="space-y-4 pt-4">
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            ) : userPosts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <MessageCircle size={48} className="mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Posts Yet</h3>
                    <p>This user hasn't posted anything yet.</p>
                </div>
            ) : (
                userPosts.map(post => (
                    <CommunityPost key={post.id} post={post} />
                ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="saved">
             <div className="text-center py-16 text-muted-foreground">
                <Bookmark size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No Saved Posts Yet</h3>
                <p>This user has no saved posts.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
