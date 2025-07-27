
'use server';

import { db } from '@/lib/firebase-admin';
import { z } from 'zod';

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

export async function followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself.");
    }

    const batch = db.batch();

    const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);
    const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);

    batch.set(followingRef, { timestamp: new Date() });
    batch.set(followerRef, { timestamp: new Date() });

    await batch.commit();
}

export async function unfollowUser(currentUserId: string, targetUserId:string) {
    const batch = db.batch();

    const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);
    const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);

    batch.delete(followingRef);
    batch.delete(followerRef);
    
    await batch.commit();
}
