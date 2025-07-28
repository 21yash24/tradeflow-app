
'use client';

import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Newspaper,
  Settings,
  Users,
  Moon,
  Sun,
  LogOut,
  User,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TradeFlowLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { UserProfile } from "@/services/user-service";

const navItems = [
    { href: "/journal", icon: BookOpenCheck, label: "Journal" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/discipline", icon: ClipboardCheck, label: "Discipline" },
    { href: "/alerts", icon: Bell, label: "Alerts" },
    { href: "/community", icon: Users, label: "Community" },
];

function UserProfileDropdown() {
    const [user] = useAuthState(auth);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const router = useRouter();

     useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setProfile(doc.data() as UserProfile);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                     <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.photoURL || `https://placehold.co/100x100.png`} alt={user?.displayName || "User"} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                     <Link href={`/profile/${user.uid}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                     <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function DesktopSidebar() {
    const pathname = usePathname();
    const [user] = useAuthState(auth);
    const isActive = (path: string) => {
        if (path === '/profile') {
            return pathname.startsWith('/profile');
        }
        return pathname.startsWith(path);
    }
    
    const profileLink = user ? `/profile/${user.uid}` : '/login';

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-card p-4 rounded-r-xl shadow-lg fixed h-full">
           <div className="flex items-center justify-between mb-8 px-2">
               <div className="flex items-center gap-3">
                    <TradeFlowLogo className="size-8 text-primary" />
                    <h1 className="text-xl font-bold font-headline text-foreground">
                        TradeFlow
                    </h1>
               </div>
               <UserProfileDropdown />
           </div>
           <nav className="flex flex-col gap-2 flex-grow">
               {[...navItems, { href: profileLink, icon: User, label: 'Profile'}].map(item => {
                 // Special handling for the dynamic profile link
                 const finalHref = item.label === 'Profile' ? profileLink : item.href;
                 
                 return (
                    <Link href={finalHref} key={item.href}>
                       <div
                       className={cn(
                           "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                           isActive(item.href)
                           ? "bg-primary/90 text-primary-foreground font-semibold"
                           : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                       )}
                       >
                           <item.icon className="w-5 h-5" />
                           <span>{item.label}</span>
                       </div>
                   </Link>
               )}
            )}
           </nav>
           <div className="mt-auto">
                <Link href="/settings">
                   <div
                       className={cn(
                           "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                           isActive("/settings")
                           ? "bg-primary/90 text-primary-foreground font-semibold"
                           : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                       )}
                       >
                       <Settings className="w-5 h-5" />
                       <span>Settings</span>
                   </div>
               </Link>
           </div>
       </aside>
    )
}

function MobileBottomNav() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname.startsWith(path);
    const mainNavItems = navItems.filter(item => item.href !== '/profile' && item.href !== '/settings');


    return (
         <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border">
            <TooltipProvider>
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {mainNavItems.map(item => (
                    
                         <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                 <Link href={item.href} className={cn(
                                     "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group",
                                     isActive(item.href) ? "text-primary" : "text-muted-foreground"
                                 )}>
                                    <item.icon className="w-6 h-6 mb-1" />
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                   
                ))}
            </div>
             </TooltipProvider>
        </div>
    )
}


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const createUserProfileIfNeeded = async () => {
        if(user) {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    bio: `I'm a new trader on TradeFlow!`,
                    createdAt: new Date(),
                });
            }
        }
    };
    if (!loading && user) {
        createUserProfileIfNeeded();
    }
  }, [user, loading])

  if(loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
          <TradeFlowLogo className="size-12 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
        <DesktopSidebar />
        <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 overflow-auto">
             <div className="lg:hidden flex justify-between items-center mb-4">
                 <Link href="/" className="flex items-center gap-2">
                    <TradeFlowLogo className="size-7 text-primary" />
                     <h1 className="text-lg font-bold font-headline text-foreground">
                        TradeFlow
                    </h1>
                 </Link>
                 <UserProfileDropdown />
             </div>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </main>
        <MobileBottomNav />
    </div>
  );
}
