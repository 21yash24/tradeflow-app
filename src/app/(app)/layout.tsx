
'use client';

import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TradeFlowLogo } from "@/components/icons";
import { cn } from "@/lib/utils";

function BottomNavbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/journal", icon: BookOpenCheck, label: "Journal" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/community", icon: Users, label: "Community" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/80 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors",
                isActive(item.href)
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function SidebarNav() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    const navItems = [
        { href: "/journal", icon: BookOpenCheck, label: "Journal" },
        { href: "/analytics", icon: BarChart3, label: "Analytics" },
        { href: "/community", icon: Users, label: "Community" },
        { href: "/economic-news", icon: Newspaper, label: "Economic News" },
    ];

    return (
         <aside className="hidden md:flex flex-col w-64 bg-card p-4 rounded-l-xl shadow-lg">
            <div className="flex items-center gap-2 mb-8">
                <TradeFlowLogo className="size-10 text-primary-foreground" />
                <h1 className="text-2xl font-bold font-headline text-primary-foreground">
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
    );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        <header className="hidden md:flex items-center justify-end p-4 border-b bg-card rounded-tr-xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="@trader" data-ai-hint="profile avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto pb-24 md:pb-8">
            {children}
        </main>
        <BottomNavbar />
      </div>
    </div>
  );
}
