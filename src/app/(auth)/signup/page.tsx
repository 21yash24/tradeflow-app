
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TradeFlowLogo } from "@/components/icons";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: values.username });
            
            // Create a user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: values.username,
                email: values.email,
                photoURL: null,
                bio: `I'm a new trader on TradeFlow!`,
                createdAt: new Date(),
            });

            toast({
                title: "Account Created",
                description: "Welcome to TradeFlow! We're glad to have you.",
            });
            router.push('/journal');
        } catch (error: any) {
             toast({
                title: "Sign Up Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="mx-auto max-w-sm w-full">
                 <CardHeader className="text-center space-y-4">
                     <div className="flex flex-col items-center gap-2">
                         <TradeFlowLogo className="mx-auto h-12 w-12 text-primary" />
                         <h1 className="text-2xl font-bold font-headline">TradeFlow</h1>
                    </div>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>Unlock Your Trading Potential</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" placeholder="tradepilot" {...form.register("username")} />
                            {form.formState.errors.username && <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" {...form.register("email")} />
                             {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...form.register("password")} />
                            {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Creating Account...</> : "Create Account"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link href="/login" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
