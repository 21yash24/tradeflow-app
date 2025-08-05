
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { Trade } from '@/components/add-trade-form';

export async function getUserTrades(userId: string): Promise<Trade[]> {
  const db = getDb();
  try {
    const tradesSnapshot = await db.collection('trades')
        .where('userId', '==', userId)
        .where('deleted', '!=', true)
        .orderBy('date', 'desc')
        .limit(100) // Limit to the last 100 trades for performance
        .get();

    if (tradesSnapshot.empty) {
      return [];
    }

    const trades = tradesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Trade[];

    return trades;
  } catch (error) {
    console.error("Error fetching user trades:", error);
    // In a real app, you might want more robust error handling
    return [];
  }
}
