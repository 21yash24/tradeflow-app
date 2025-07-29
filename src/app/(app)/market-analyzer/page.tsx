
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Lightbulb, ShieldCheck, Upload, AlertCircle, BrainCircuit, CheckCircle, TrendingUp, TrendingDown, MinusCircle, Layers, Target } from 'lucide-react';
import { analyzeMarket, type MarketAnalysis, type MarketAnalysisInput } from '@/ai/flows/market-analyzer-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const AiMarketAnalyst = () => {
    const [analysisState, setAnalysisState] = useState<MarketAnalysisInput>({
        photoDataUri: '',
        userBias: '',
        timeframe: '',
        concerns: '',
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [results, setResults] = useState<MarketAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const questions = [
        { key: 'userBias', prompt: "What's your initial bias on this chart?", type: 'radio', options: ['Bullish', 'Bearish', 'Neutral'] },
        { key: 'timeframe', prompt: "What timeframe are you trading?", type: 'radio', options: ['Intraday', 'Swing', 'Position'] },
        { key: 'concerns', prompt: "What are your specific concerns or questions about this setup?", type: 'textarea' },
    ];
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAnalysisState({ ...analysisState, photoDataUri: reader.result as string });
                setCurrentStep(1); // Move to the first question
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnswer = (key: string, value: string) => {
        setAnalysisState({ ...analysisState, [key as keyof MarketAnalysisInput]: value });
    };

    const handleNextStep = () => {
        // Simple validation
        const currentQuestion = questions[currentStep - 1];
        if (!analysisState[currentQuestion.key as keyof typeof analysisState]) {
             toast({ title: 'Please answer the question', variant: 'destructive'});
             return;
        }
        if (currentStep < questions.length + 1) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handleRunAnalysis = async () => {
        if (!analysisState.photoDataUri) {
            toast({ title: 'No Image', description: 'Please upload a chart image first.', variant: 'destructive'});
            return;
        }
        setIsLoading(true);
        setResults(null);
        try {
            const result = await analyzeMarket(analysisState);
            setResults(result); 
            setCurrentStep(questions.length + 2); // Final results step
        } catch (error) {
            console.error("Error running analysis:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ title: 'Analysis Failed', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }
    
    const resetAnalyzer = () => {
        setAnalysisState({ photoDataUri: '', userBias: '', timeframe: '', concerns: '' });
        setResults(null);
        setCurrentStep(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const renderCurrentStep = () => {
        // Loading state
        if (isLoading) {
             return (
                <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg border border-dashed">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <h3 className="text-xl font-semibold">Analysis in Progress</h3>
                    <p className="text-muted-foreground">Please wait while the AI analyzes your chart...</p>
                </div>
            )
        }
        
        const sentimentMap = {
            Bullish: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
            Bearish: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
            Neutral: { icon: MinusCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        };

        // Results view
        if (results && currentStep === questions.length + 2) {
            const SentimentIcon = sentimentMap[results.overallSentiment].icon;
            const sentimentColor = sentimentMap[results.overallSentiment].color;

            return (
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Market Analysis Report</CardTitle>
                                <CardDescription>A review of your chart from your AI mentor.</CardDescription>
                            </div>
                            <Badge className={cn("text-base px-4 py-1", sentimentMap[results.overallSentiment].bg, sentimentColor)}>
                                <SentimentIcon className="mr-2 h-5 w-5"/>
                                {results.overallSentiment}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4">
                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Support Levels</h4>
                                <div className="space-y-1">
                                    {results.keySupportLevels.map((level, i) => <p key={i} className="text-sm text-muted-foreground">{level}</p>)}
                                </div>
                            </Card>
                             <Card className="p-4">
                                <h4 className="font-semibold text-sm mb-2 text-primary">Key Resistance Levels</h4>
                                 <div className="space-y-1">
                                    {results.keyResistanceLevels.map((level, i) => <p key={i} className="text-sm text-muted-foreground">{level}</p>)}
                                </div>
                            </Card>
                        </div>
                        
                        {results.identifiedPatterns && results.identifiedPatterns.length > 0 && (
                             <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center text-lg gap-2"><Layers className="text-primary"/> Identified Patterns</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                     {results.identifiedPatterns.map((pattern, i) => <Badge key={i} variant="secondary">{pattern}</Badge>)}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center text-lg gap-2"><Lightbulb className="text-yellow-400"/> Market Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{results.marketInsights}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center text-lg gap-2"><BrainCircuit className="text-primary"/> Potential Biases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{results.potentialBiases}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center text-lg gap-2"><ShieldCheck className="text-green-500"/> Addressing Your Concerns</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{results.addressingConcerns}</p>
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center text-lg gap-2"><Target className="text-blue-400"/> Actionable Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {results.actionableNextSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                                        <p className="text-muted-foreground">{step}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <Separator />
                        
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Disclaimer</AlertTitle>
                            <AlertDescription>{results.disclaimer}</AlertDescription>
                        </Alert>
                         <div className="flex justify-end">
                            <Button onClick={resetAnalyzer} variant="outline">Start New Analysis</Button>
                        </div>
                    </CardContent>
                 </Card>
            )
        }


        // Conversational steps
        if (currentStep > 0 && currentStep <= questions.length + 1) {
            const questionIndex = currentStep - 1;
            const question = questions[questionIndex];
            const isLastQuestion = currentStep === questions.length + 1;

            return (
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative w-full h-80 rounded-md overflow-hidden border">
                                <Image src={analysisState.photoDataUri} alt="Chart preview" layout="fill" objectFit="contain" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                           <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                {question ? (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4">{question.prompt}</h3>
                                        {question.type === 'radio' && (
                                            <div className="flex flex-wrap gap-2">
                                                {question.options?.map(opt => (
                                                    <Button 
                                                        key={opt}
                                                        variant={analysisState[question.key as keyof typeof analysisState] === opt ? 'default' : 'outline'}
                                                        onClick={() => {
                                                            handleAnswer(question.key, opt);
                                                            setTimeout(() => handleNextStep(), 200);
                                                        }}
                                                    >
                                                        {opt}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                        {question.type === 'textarea' && (
                                            <div className="space-y-4">
                                                 <Textarea 
                                                    placeholder="Type your answer here..."
                                                    value={analysisState[question.key as keyof typeof analysisState]}
                                                    onChange={e => handleAnswer(question.key, e.target.value)}
                                                    rows={4}
                                                />
                                                <div className="flex justify-end">
                                                    <Button onClick={handleNextStep}>
                                                        Next <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Final confirmation step
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4">Ready for analysis?</h3>
                                        <p className="text-muted-foreground mb-4">The AI will now analyze your chart and the answers you've provided.</p>
                                        <div className="flex justify-end">
                                             <Button onClick={handleRunAnalysis} size="lg">
                                                <BrainCircuit className="mr-2 h-5 w-5" /> Analyze Now
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        // Initial upload step
        return (
             <>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                />
                <Card 
                    className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground h-48">
                            <Upload className="h-10 w-10" />
                            <h3 className="text-lg font-medium">Upload a Chart Screenshot</h3>
                            <p>Click here to start a new analysis session.</p>
                        </div>
                    </CardContent>
                </Card>
             </>
        )
    };

    return (
        <div className="space-y-6">
            {renderCurrentStep()}
        </div>
    )
}

export default function MarketAnalyzerPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    AI Market Analyst
                </h1>
                <p className="text-muted-foreground mt-2">
                    Get an objective second opinion on your chart analysis from an AI mentor.
                </p>
            </div>
            <AiMarketAnalyst />
        </div>
    );
}
