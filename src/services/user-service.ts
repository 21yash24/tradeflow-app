
'use server';

import { z } from 'zod';
import { doc, writeBatch, type Firestore } from 'firebase/firestore';


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
    createdAt: z.any(),
    preTradeChecklist: z.array(ChecklistItemSchema).optional(),
    disciplineChecklist: z.array(ChecklistItemSchema).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export async function followUser(db: Firestore, currentUserId: string, targetUserId: string) {
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

export async function unfollowUser(db: Firestore, currentUserId: string, targetUserId:string) {
    const batch = writeBatch(db);

    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);

    batch.delete(followingRef);
    batch.delete(followerRef);
    
    await batch.commit();
}
