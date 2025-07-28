
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TradeFlowLogo } from "@/components/icons";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const resetPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});


function ForgotPasswordDialog() {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { email: "" },
    });

    const handlePasswordReset = async (values: z.infer<typeof resetPasswordSchema>) => {
        setIsSending(true);
        try {
            await sendPasswordResetEmail(auth, values.email);
            toast({
                title: "Reset Link Sent",
                description: "If an account exists for this email, a password reset link has been sent.",
            });
            form.reset();
            setIsOpen(false);
        } catch (error: any) {
             toast({
                title: "Error",
                description: "Could not send password reset email. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    }
    
    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <button type="button" className="ml-auto inline-block text-xs underline">
                    Forgot your password?
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Forgot Password</DialogTitle>
                    <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handlePasswordReset)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input id="reset-email" type="email" placeholder="m@example.com" {...form.register("email")} />
                             {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSending}>
                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Send Reset Link
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loginFormSchema>>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
        email: "",
        password: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof loginFormSchema>) => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({
                title: "Login Successful",
                description: "Welcome back! Redirecting you to your journal...",
            });
            router.push('/journal');
        } catch (error: any) {
            toast({
                title: "Login Failed",
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
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Enter your email below to login to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" {...form.register("email")} />
                             {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                               <ForgotPasswordDialog />
                            </div>
                            <Input id="password" type="password" {...form.register("password")} />
                             {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Signing in...</> : "Sign In"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Don't have an account?{" "}
                        <Link href="/signup" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
