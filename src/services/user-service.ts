
'use server';

import { z } from 'zod';
import { doc, writeBatch, type Firestore, runTransaction, increment } from 'firebase/firestore';


const ChecklistItemSchema = z.object({
    id: z.string(),
    label: z.string(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;


const UserProfileSchema = z.object({
    uid: z.string(),
    displayName: z.string(),
    email: z.string(),
    photoURL: z.string().nullable(),
    bio: z.string(),
    skills: z.array(z.string()).optional(),
    followersCount: z.number().optional(),
    followingCount: z.number().optional(),
    createdAt: z.any(),
    preTradeChecklist: z.array(ChecklistItemSchema).optional(),
    disciplineChecklist: z.array(ChecklistItemSchema).optional(),
    fcmTokens: z.array(z.string()).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export async function followUser(db: Firestore, currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself.");
    }
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const followingRef = doc(currentUserRef, 'following', targetUserId);
    const followerRef = doc(targetUserRef, 'followers', currentUserId);

    try {
        await runTransaction(db, async (transaction) => {
            const followingDoc = await transaction.get(followingRef);
            if (followingDoc.exists()) {
                 console.log("Already following");
                 return;
            }
            transaction.set(followingRef, { timestamp: new Date() });
            transaction.set(followerRef, { timestamp: new Date() });
            transaction.update(currentUserRef, { followingCount: increment(1) });
            transaction.update(targetUserRef, { followersCount: increment(1) });
        });
    } catch (e) {
        console.error("Follow transaction failed: ", e);
        throw new Error("Could not follow user.");
    }
}

export async function unfollowUser(db: Firestore, currentUserId: string, targetUserId:string) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const followingRef = doc(currentUserRef, 'following', targetUserId);
    const followerRef = doc(targetUserRef, 'followers', currentUserId);

     try {
        await runTransaction(db, async (transaction) => {
            transaction.delete(followingRef);
            transaction.delete(followerRef);
            transaction.update(currentUserRef, { followingCount: increment(-1) });
            transaction.update(targetUserRef, { followersCount: increment(-1) });
        });
    } catch (e) {
        console.error("Unfollow transaction failed: ", e);
        throw new Error("Could not unfollow user.");
    }
}

    