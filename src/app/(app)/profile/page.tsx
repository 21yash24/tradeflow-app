
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import SettingsContent from "../settings/page";
import { Moon, Sun } from "lucide-react";

const AboutUsContent = () => (
    <Card>
        <CardHeader>
            <CardTitle>About TradeFlow</CardTitle>
            <CardDescription>The ultimate trading journal and analysis tool.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>
                TradeFlow was built by traders, for traders. We understand the discipline, precision, and reflection required to succeed in the markets. Our mission is to provide you with the tools to meticulously track your progress, analyze your performance, and connect with a community of like-minded individuals.
            </p>
            <p>
                Whether you're just starting out or managing a prop firm challenge, TradeFlow is designed to be your indispensable partner on the path to consistent profitability.
            </p>
        </CardContent>
    </Card>
);

const ThemeSettingsContent = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <p className="text-sm text-muted-foreground">
                        Select a theme. Your preference will be saved for your next visit.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="h-24 flex flex-col"
                    >
                        <Sun className="h-6 w-6 mb-2" />
                        Light
                    </Button>
                    <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="h-24 flex flex-col"
                    >
                         <Moon className="h-6 w-6 mb-2" />
                        Dark
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('settings');

    const sidebarNavItems = [
        { id: 'settings', label: 'Settings' },
        { id: 'appearance', label: 'Appearance' },
        { id: 'about', label: 'About Us' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Profile & Settings
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account and application preferences.
                </p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="flex flex-col space-y-1">
                        {sidebarNavItems.map(item => (
                             <Button
                                key={item.id}
                                variant="ghost"
                                className={cn(
                                    "justify-start",
                                    activeTab === item.id && "bg-muted font-semibold"
                                )}
                                onClick={() => setActiveTab(item.id)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </aside>
                <main className="md:w-3/4">
                    {activeTab === 'settings' && <SettingsContent />}
                    {activeTab === 'appearance' && <ThemeSettingsContent />}
                    {activeTab === 'about' && <AboutUsContent />}
                </main>
            </div>
        </div>
    );
}

