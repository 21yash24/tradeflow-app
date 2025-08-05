
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Lightbulb, ShieldCheck, Upload, AlertCircle, BrainCircuit, CheckCircle, TrendingUp, TrendingDown, MinusCircle, Layers, Target, Wand2, Send, Paperclip } from 'lucide-react';
import { analyzeMarket, type MarketAnalysis, type MarketAnalysisInput } from '@/ai/flows/market-analyzer-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TradeFlowLogo } from '@/components/icons';
import { analyzeTrade, type TradeAnalysis, type TradeAnalysisInput } from '@/ai/flows/trade-analyst-flow';

type Message = {
    id: string;
    sender: 'user' | 'bot';
    content: React.ReactNode;
    options?: { label: string; icon: React.ElementType, value: string }[];
    isTyping?: boolean;
}

const AiChatbotAnalyst = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationState, setConversationState] = useState<'initial' | 'market_analysis' | 'trade_review' | 'discipline' | 'finished'>('initial');
    const [analysisData, setAnalysisData] = useState<Partial<MarketAnalysisInput & TradeAnalysisInput>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Initial message from the bot
        setMessages([{
            id: 'init',
            sender: 'bot',
            content: 'What would you like to analyze today?',
            options: [
                { label: 'Market Analysis', icon: TrendingUp, value: 'market_analysis' },
                { label: 'Trade Review', icon: BrainCircuit, value: 'trade_review' },
                { label: 'Trading Discipline', icon: ShieldCheck, value: 'discipline' },
            ]
        }]);
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the chat on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const addMessage = (sender: 'user' | 'bot', content: React.ReactNode, options?: Message['options'], isTyping = false) => {
        const newMessage = { id: Date.now().toString(), sender, content, options, isTyping };
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.isTyping) {
                // Replace typing indicator with the actual message
                const newMessages = [...prev.slice(0, -1), newMessage];
                return newMessages;
            }
            return [...prev, newMessage];
        });
    };
    
    const handleOptionSelect = (label: string, value: string) => {
        addMessage('user', label);
        setConversationState(value as any);
        setIsLoading(true);
        setTimeout(() => processBotResponse(value), 1000);
    }

    const processBotResponse = (state: string, data?: Partial<MarketAnalysisInput>) => {
        setIsLoading(false);
        const newData = { ...analysisData, ...data };
        setAnalysisData(newData);

        if (state === 'market_analysis') {
            addMessage('bot', 'Great! Please upload a screenshot of the chart you want to analyze.');
        } else if (state === 'trade_review') {
            addMessage('bot', `Let's review a trade. What was the currency pair?`);
        } else if (state === 'discipline') {
            addMessage('bot', `Let's talk about discipline. In a few words, how have you been feeling about your trading lately? (e.g., "anxious", "over-confident", "sticking to the plan")`);
        } else if (state === 'market_analysis_bias') {
            addMessage('bot', `Got the chart. What's your initial bias?`, [
                { label: 'Bullish', icon: TrendingUp, value: 'Bullish' },
                { label: 'Bearish', icon: TrendingDown, value: 'Bearish' },
                { label: 'Neutral', icon: MinusCircle, value: 'Neutral' },
            ]);
        } else if (state === 'market_analysis_timeframe') {
            addMessage('bot', `And what timeframe are you trading on?`, [
                { label: 'Intraday', icon: MinusCircle, value: 'Intraday' },
                { label: 'Swing', icon: MinusCircle, value: 'Swing' },
                { label: 'Position', icon: MinusCircle, value: 'Position' },
            ]);
        } else if (state === 'market_analysis_concerns') {
            addMessage('bot', `Finally, what are your specific concerns or questions about this setup?`);
        } else if (state === 'market_analysis_start') {
            runMarketAnalysis(newData as MarketAnalysisInput);
        }
    };
    
     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const photoDataUri = reader.result as string;
                addMessage('user', <Image src={photoDataUri} alt="chart" width={200} height={150} className="rounded-md" />);
                setIsLoading(true);
                setTimeout(() => processBotResponse('market_analysis_bias', { photoDataUri }), 1000);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        addMessage('user', input);
        const currentData = { ...analysisData };

        if(conversationState === 'market_analysis_concerns') {
            currentData.concerns = input;
            setInput('');
            setIsLoading(true);
            setTimeout(() => runMarketAnalysis(currentData as MarketAnalysisInput), 1000);
        } else if (conversationState === 'trade_review') {
            currentData.pair = input;
            setInput('');
            addMessage('bot', `Got it: ${input}. Was it a buy or sell?`, [
                { label: 'Buy', icon: TrendingUp, value: 'buy' },
                { label: 'Sell', icon: TrendingDown, value: 'sell' },
            ]);
            setConversationState('trade_review_type' as any);
        } else if (conversationState === 'trade_review_pnl') {
            currentData.pnl = parseFloat(input);
            setInput('');
            addMessage('bot', `What were your notes or thoughts on this trade?`);
            setConversationState('trade_review_notes' as any);
        } else if (conversationState === 'trade_review_notes') {
            currentData.notes = input;
            setInput('');
            addMessage('bot', `And what was your mental state during the trade?`);
            setConversationState('trade_review_mental_state' as any);
        } else if (conversationState === 'trade_review_mental_state') {
             currentData.mentalState = input;
             setInput('');
             setIsLoading(true);
             setTimeout(() => runTradeAnalysis(currentData as TradeAnalysisInput), 1000);
        }
    };
    
    const handleFollowUpOption = (label: string, value: string) => {
        addMessage('user', label);
        const currentData = { ...analysisData };
        
        if (conversationState === 'market_analysis_bias') {
             currentData.userBias = value;
             setIsLoading(true);
             setTimeout(() => processBotResponse('market_analysis_timeframe', currentData), 1000);
        } else if (conversationState === 'market_analysis_timeframe') {
            currentData.timeframe = value;
            setIsLoading(true);
            setTimeout(() => processBotResponse('market_analysis_concerns', currentData), 1000);
        } else if (conversationState === 'trade_review_type') {
            (currentData as TradeAnalysisInput).type = value as 'buy' | 'sell';
            addMessage('bot', `What was the final P/L in USD? (e.g., 150 or -50)`);
            setConversationState('trade_review_pnl' as any);
        }
    }


    const runMarketAnalysis = async (finalData: MarketAnalysisInput) => {
        addMessage('bot', '', undefined, true);
        try {
            const result = await analyzeMarket(finalData);
            addMessage('bot', <MarketAnalysisResult analysis={result} />);
        } catch (error) {
            toast({ title: 'Analysis Failed', description: 'Could not analyze the market data.', variant: 'destructive'});
            addMessage('bot', 'Sorry, I ran into an error. Please try again.');
        } finally {
            setIsLoading(false);
            setConversationState('finished');
        }
    }
    
    const runTradeAnalysis = async (finalData: TradeAnalysisInput) => {
         addMessage('bot', '', undefined, true);
        try {
            const result = await analyzeTrade(finalData);
            addMessage('bot', <TradeAnalysisResult analysis={result} />);
        } catch (error) {
            toast({ title: 'Analysis Failed', description: 'Could not analyze the trade data.', variant: 'destructive'});
            addMessage('bot', 'Sorry, I ran into an error. Please try again.');
        } finally {
            setIsLoading(false);
            setConversationState('finished');
        }
    }

    const startNewAnalysis = () => {
        setMessages([]);
        setAnalysisData({});
        setConversationState('initial');
        setTimeout(() => {
            setMessages([{
                id: 'init',
                sender: 'bot',
                content: 'What would you like to analyze today?',
                options: [
                    { label: 'Market Analysis', icon: TrendingUp, value: 'market_analysis' },
                    { label: 'Trade Review', icon: BrainCircuit, value: 'trade_review' },
                    { label: 'Trading Discipline', icon: ShieldCheck, value: 'discipline' },
                ]
            }]);
        }, 100);
    }
    
    const isInputDisabled = conversationState === 'initial' || conversationState === 'finished' || isLoading || conversationState === 'market_analysis' || conversationState === 'market_analysis_bias' || conversationState === 'market_analysis_timeframe';


    return (
        <Card className="h-[80vh] flex flex-col">
            <CardContent className="flex-grow p-4 overflow-y-auto" ref={scrollRef}>
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'user' && 'justify-end')}>
                             {msg.sender === 'bot' && (
                                <Avatar className="h-8 w-8 self-start">
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
                        </div>
                    ))}
                </div>
            </CardContent>
            
            <div className="p-4 border-t">
                 {/* Quick Reply Options */}
                 {messages[messages.length-1]?.options && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {messages[messages.length-1]?.options?.map(opt => {
                             const stateHandlers: Record<string, Function> = {
                                'initial': handleOptionSelect,
                                'market_analysis_bias': handleFollowUpOption,
                                'market_analysis_timeframe': handleFollowUpOption,
                                'trade_review_type': handleFollowUpOption
                             };
                             const handler = stateHandlers[conversationState] || handleOptionSelect;
                             return (
                                <Button key={opt.value} variant="outline" onClick={() => handler(opt.label, opt.value)}>
                                    <opt.icon className="mr-2 h-4 w-4" /> {opt.label}
                                </Button>
                             )
                        })}
                    </div>
                 )}
                 {conversationState === 'finished' && (
                     <Button onClick={startNewAnalysis} className="w-full">Start New Analysis</Button>
                 )}
                
                {conversationState === 'market_analysis' && (
                    <>
                     <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                     <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                         <Upload className="mr-2 h-4 w-4"/> Upload Chart Screenshot
                     </Button>
                    </>
                )}


                <form onSubmit={handleTextSubmit} className={cn("flex items-center gap-2", (isInputDisabled) && "hidden")}>
                    <Textarea
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={1}
                        className="flex-grow resize-none"
                        disabled={isInputDisabled}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleTextSubmit(e);
                            }
                        }}
                    />
                    <Button type="submit" size="icon" disabled={isInputDisabled || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    )
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

export default function MarketAnalyzerPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    AI Analyst
                </h1>
                <p className="text-muted-foreground mt-2">
                    Your personal AI trading mentor.
                </p>
            </div>
            <AiChatbotAnalyst />
        </div>
    );
}
