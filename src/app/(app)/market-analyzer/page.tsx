
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, Paperclip, Send, TrendingDown, Layers, Target, Wand2, Lightbulb, ShieldCheck, AlertCircle, CheckCircle, TrendingUp, MinusCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { thinker, type ThinkerOutput } from '@/ai/flows/thinker-flow';
import { cn } from '@/lib/utils';
import { TradeFlowLogo } from '@/components/icons';
import { type MarketAnalysis } from '@/ai/flows/market-analyzer-flow';
import { type TradeAnalysis } from '@/ai/flows/trade-analyst-flow';
import Image from 'next/image';
import { motion } from 'framer-motion';

type AiMessage = {
    id: string;
    sender: 'user' | 'bot';
    content: React.ReactNode;
    isTyping?: boolean;
}

function MarketAnalysisResult({ analysis }: { analysis: MarketAnalysis }) {
    const sentimentMap = {
        Bullish: { icon: TrendingUp, color: 'text-green-500' },
        Bearish: { icon: TrendingDown, color: 'text-red-500' },
        Neutral: { icon: MinusCircle, color: 'text-yellow-500' },
    };
    const SentimentIcon = sentimentMap[analysis.overallSentiment].icon;
    const sentimentColor = sentimentMap[analysis.overallSentiment].color;

    return (
        <div className="space-y-4">
            <h3 className={cn("font-bold text-lg flex items-center gap-2", sentimentColor)}>
                <SentimentIcon /> Market Analysis Report
            </h3>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.marketInsights}</p>
            
            <h4 className="font-semibold flex items-center gap-2"><Lightbulb className="text-yellow-400"/> Potential Biases</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.potentialBiases}</p>
            
            <h4 className="font-semibold flex items-center gap-2"><ShieldCheck className="text-green-500"/> Addressing Your Concerns</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.addressingConcerns}</p>

            <h4 className="font-semibold flex items-center gap-2"><Target className="text-blue-400"/> Actionable Next Steps</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {analysis.actionableNextSteps.map((step, i) => <li key={i}>{step}</li>)}
            </ul>
        </div>
    )
}

function TradeAnalysisResult({ analysis }: { analysis: TradeAnalysis }) {
    return (
        <div className="space-y-4">
             <h3 className="font-bold text-lg flex items-center gap-2"><Wand2 /> Trade Review Analysis</h3>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.summary}</p>
             
             <h4 className="font-semibold flex items-center gap-2 text-green-400"><CheckCircle/> What Went Well</h4>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.whatWentWell}</p>
             
             <h4 className="font-semibold flex items-center gap-2 text-red-400"><AlertCircle/> What to Improve</h4>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.whatToImprove}</p>
             
             <h4 className="font-semibold flex items-center gap-2 text-yellow-400"><Lightbulb/> Potential Biases</h4>
             <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border">{analysis.potentialBiases}</p>
        </div>
    )
}

function BotMessage({ output }: { output: ThinkerOutput }) {
    if (output.marketAnalysis) {
        return <MarketAnalysisResult analysis={output.marketAnalysis} />;
    }
    if (output.tradeAnalysis) {
        return <TradeAnalysisResult analysis={output.tradeAnalysis} />;
    }
    return <p>{output.answer}</p>;
}

const examplePrompts = [
    "Analyze this chart for me.",
    "Review my last trade on EUR/USD.",
    "What are my common trading mistakes?",
    "How can I improve my trading discipline?",
]

const AiThinker = () => {
    const [user] = useAuthState(auth);
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Scroll to the bottom of the chat on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const addMessage = (sender: 'user' | 'bot', content: React.ReactNode, isTyping = false) => {
        const newMessage = { id: `${Date.now()}-${Math.random()}`, sender, content, isTyping };
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.isTyping) {
                // Replace typing indicator with the actual message
                return [...prev.slice(0, -1), newMessage];
            }
            return [...prev, newMessage];
        });
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent, prompt?: string) => {
        e.preventDefault();
        const currentInput = prompt || input;
        if ((!currentInput.trim() && !imagePreview) || isLoading || !user) return;
        
        if (messages.length === 0) {
            addMessage('bot', "Hello! I'm your AI trading thinker. How can I help you today?");
        }

        const userMessage = (
            <div>
                {currentInput}
                {imagePreview && <Image src={imagePreview} alt="chart" width={200} height={150} className="rounded-md mt-2" />}
            </div>
        );
        addMessage('user', userMessage);
        setIsLoading(true);
        addMessage('bot', '', true);

        const currentImage = imagePreview;

        setInput('');
        setImagePreview(null);
        
        try {
            const result = await thinker({
                prompt: currentInput,
                photoDataUri: currentImage || undefined,
                userId: user.uid,
            });
            addMessage('bot', <BotMessage output={result} />);
        } catch (error) {
            console.error(error);
            toast({ title: 'An Error Occurred', description: 'Could not get a response from the AI. Please try again.', variant: 'destructive'});
            addMessage('bot', 'Sorry, I ran into an error. Please check your configuration and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col max-h-[85vh]">
            <CardHeader>
                <CardTitle className='font-headline'>AI Analyst</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4 overflow-y-auto" ref={scrollRef}>
                {messages.length === 0 ? (
                     <div className="flex flex-col h-full items-center justify-center text-center">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                            <TradeFlowLogo className="h-24 w-24 text-primary" />
                        </motion.div>
                        <h2 className="text-2xl font-semibold mt-4">Your Personal Trading Analyst</h2>
                        <p className="text-muted-foreground mt-2 mb-6 max-w-md">Ask me anything about your charts, past trades, or trading psychology to get data-driven insights.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                           {examplePrompts.map((prompt, i) => (
                                <motion.div key={prompt} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}>
                                    <Button variant="outline" className="w-full text-left justify-start h-auto py-2" onClick={(e) => handleSubmit(e, prompt)}>
                                        <p className="whitespace-normal text-sm">{prompt}</p>
                                    </Button>
                                </motion.div>
                           ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={cn("flex items-end gap-3", msg.sender === 'user' && 'justify-end')}
                            >
                                {msg.sender === 'bot' && (
                                    <Avatar className="h-8 w-8 self-start flex-shrink-0">
                                        <div className="bg-primary rounded-full p-1.5">
                                            <TradeFlowLogo className="text-primary-foreground" />
                                        </div>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-md p-3 rounded-2xl",
                                    msg.sender === 'bot' ? 'bg-muted rounded-bl-none' : 'bg-primary text-primary-foreground rounded-br-none'
                                )}>
                                    {msg.isTyping ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="h-2 w-2 bg-current rounded-full animate-bounce" />
                                        </div>
                                    ) : msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
            
            <div className="p-2 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex items-start gap-1">
                     <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                     <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                         <Paperclip className="h-5 w-5" />
                         <span className="sr-only">Attach image</span>
                     </Button>
                    <div className="flex-grow relative">
                        {imagePreview && (
                            <div className="absolute bottom-full left-0 mb-2 p-1 bg-muted rounded-md border">
                                <Image src={imagePreview} alt="Preview" width={80} height={60} className="rounded-sm" />
                                 <button type="button" onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                                    &times;
                                </button>
                            </div>
                        )}
                        <Textarea
                            placeholder="Ask the AI to analyze a chart, review a past trade, or discuss your trading psychology..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={1}
                            className="flex-grow resize-none pr-12"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    handleSubmit(e, input);
                                }
                            }}
                        />
                         <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading || (!input.trim() && !imagePreview)}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    )
}

export default function MarketAnalyzerPage() {
  return (
    <div className="h-full">
        <AiThinker />
    </div>
  );
}
