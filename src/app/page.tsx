
'use client';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TradeFlowLogo } from '@/components/icons';

export default function Home() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace('/journal');
            } else {
                router.replace('/login');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <TradeFlowLogo className="size-12 text-primary animate-pulse" />
        </div>
    );
}

