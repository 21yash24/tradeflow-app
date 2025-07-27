
'use client';

import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TradeFlowLogo } from "@/components/icons";

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
         <aside className="hidden md:flex flex-col w-64 bg-card p-4 rounded-r-xl shadow-lg">
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
      </main>
    </div>
  );
}
