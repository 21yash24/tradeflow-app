
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";


export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: "Your preferences have been updated successfully.",
        })
    }
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Settings
            </h1>
            <p className="text-muted-foreground mt-2">
                Manage your account and application preferences.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
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
                            type="button"
                            variant={theme === 'light' ? 'default' : 'outline'}
                            onClick={() => setTheme('light')}
                            className="h-24 flex flex-col"
                        >
                            <Sun className="h-6 w-6 mb-2" />
                            Light
                        </Button>
                        <Button
                            type="button"
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

             <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your public profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" defaultValue="tradepilot" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="pilot@tradeflow.app" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input id="avatar" type="url" defaultValue="https://placehold.co/100x100.png" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" placeholder="Tell us a little about your trading style." defaultValue="Focused on technical analysis and swing trading major FX pairs." />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Trading Preferences</CardTitle>
                     <CardDescription>Set your default trading parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="default-pair">Default Currency Pair</Label>
                        <Select defaultValue="EUR/USD">
                            <SelectTrigger id="default-pair">
                                <SelectValue placeholder="Select pair" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                                <SelectItem value="GBP/JPY">GBP/JPY</SelectItem>
                                <SelectItem value="AUD/CAD">AUD/CAD</SelectItem>
                                <SelectItem value="USD/CHF">USD/CHF</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="default-risk">Default Risk (%)</Label>
                        <Input id="default-risk" type="number" defaultValue="1" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                            <span>Email Notifications</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Receive updates via email.
                            </span>
                        </Label>
                        <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                            <span>Push Notifications</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Receive push notifications on your devices.
                            </span>
                        </Label>
                        <Switch id="push-notifications" />
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
            </div>
        </form>
    </div>
  );
}
