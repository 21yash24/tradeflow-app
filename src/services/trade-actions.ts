
'use server';

import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function deleteTrade(tradeId: string) {
    if (!tradeId) {
        throw new Error('Trade ID is required.');
    }
    try {
        await db.collection('trades').doc(tradeId).delete();
        revalidatePath('/journal'); // This will trigger a re-fetch of the data on the journal page
    } catch (error) {
        console.error("Error deleting trade from server action:", error);
        throw new Error('Failed to delete trade.');
    }
}

    