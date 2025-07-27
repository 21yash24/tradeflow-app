
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";


export default function SettingsContent() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: "Your preferences have been updated successfully.",
        })
    }
  return (
    <form onSubmit={handleSubmit}>
    <div className="space-y-6">
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
    </div>
    <div className="mt-6 flex justify-end">
        <Button type="submit">Save Changes</Button>
    </div>
   </form>
  );
}

