
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now integrated into the Community Hub.
// This component will redirect users to the new location.
export default function MarketAnalyzerPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/community');
    }, [router]);

    return null;
}
