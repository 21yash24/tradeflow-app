
'use server';

import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { z } from 'zod';

const UserProfileSchema = z.object({
    uid: z.string(),
    displayName: z.string(),
    email: z.string(),
    photoURL: z.string().nullable(),
    bio: z.string(),
    createdAt: z.any(), // Keeping it simple for now
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export async function followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself.");
    }

    const batch = writeBatch(db);

    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);

    batch.set(followingRef, { timestamp: new Date() });
    batch.set(followerRef, { timestamp: new Date() });

    await batch.commit();
}


export async function unfollowUser(currentUserId: string, targetUserId:string) {
     const batch = writeBatch(db);

    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);

    batch.delete(followingRef);
    batch.delete(followerRef);
    
    await batch.commit();
}
