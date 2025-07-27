
'use client';

import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Newspaper,
  Settings,
  Users,
  PanelLeft,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TradeFlowLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
    { href: "/journal", icon: BookOpenCheck, label: "Journal" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/community", icon: Users, label: "Community" },
    { href: "/economic-news", icon: Newspaper, label: "Economic News" },
];

function DesktopSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-card p-4 rounded-r-xl shadow-lg fixed h-full">
           <div className="flex items-center gap-3 mb-8 px-2">
               <TradeFlowLogo className="size-8 text-primary" />
               <h1 className="text-xl font-bold font-headline text-foreground">
                   TradeFlow
               </h1>
           </div>
           <nav className="flex flex-col gap-2 flex-grow">
               {navItems.map(item => (
                    <Link href={item.href} key={item.href}>
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
               ))}
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
    const isActive = (path: string) => pathname === path;
    const { setTheme, theme } = useTheme();

    return (
         <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {navItems.map(item => (
                    <TooltipProvider key={item.href}>
                         <Tooltip>
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
                    </TooltipProvider>
                ))}
                 <Sheet>
                    <SheetTrigger asChild>
                         <button type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group text-muted-foreground">
                            <PanelLeft className="w-6 h-6 mb-1" />
                            <span className="sr-only">More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto pb-6">
                         <nav className="flex flex-col gap-2 mt-4">
                            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                                <Settings className="w-5 h-5" />
                                <span>Settings</span>
                            </Link>
                             <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                <div className="flex items-center gap-3">
                                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span>Toggle Theme</span>
                                </div>
                            </div>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
        <DesktopSidebar />
        <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 overflow-auto">
            {children}
        </main>
        <MobileBottomNav />
    </div>
  );
}
