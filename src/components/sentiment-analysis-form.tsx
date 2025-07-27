"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  analyzeNewsSentiment,
  type NewsSentimentOutput,
} from "@/ai/flows/news-sentiment-analysis";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  currencyPair: z.string().min(3, "Currency pair is required."),
  articleHeadline: z.string().min(10, "Headline is required."),
  articleBody: z.string().min(50, "Article body is required."),
});

type FormValues = z.infer<typeof formSchema>;

export function SentimentAnalysisForm() {
  const { toast } = useToast();
  const [result, setResult] = useState<NewsSentimentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyPair: "EUR/USD",
      articleHeadline: "",
      articleBody: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await analyzeNewsSentiment(values);
      setResult(response);
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the article. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getSentimentColorScheme = (sentiment: string | undefined) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return {
          badge: "bg-accent text-accent-foreground",
          icon: <TrendingUp className="h-6 w-6 text-accent" />,
          progressStyle: { "--primary": "hsl(var(--accent))" } as React.CSSProperties,
        };
      case "negative":
        return {
          badge: "bg-destructive text-destructive-foreground",
          icon: <TrendingDown className="h-6 w-6 text-destructive" />,
          progressStyle: { "--primary": "hsl(var(--destructive))" } as React.CSSProperties,
        };
      default:
        return {
          badge: "bg-secondary text-secondary-foreground",
          icon: <Minus className="h-6 w-6 text-secondary-foreground" />,
          progressStyle: { "--primary": "hsl(var(--secondary-foreground))" } as React.CSSProperties,
        };
    }
  };

  const scorePercentage = result ? (result.sentimentScore + 1) * 50 : 0;
  const sentimentColorScheme = getSentimentColorScheme(result?.overallSentiment);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline">Submit Article for Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currencyPair"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Pair</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EUR/USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="articleHeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Headline</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the news headline" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="articleBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full article text here..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Sentiment"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        {isLoading && <AnalysisSkeleton />}
        {result && (
          <>
            <Card className="bg-card/60 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="font-headline flex items-center justify-between">
                  <span>Sentiment Score</span>
                  {sentimentColorScheme.icon}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline" className={sentimentColorScheme.badge}>
                    {result.overallSentiment}
                  </Badge>
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {result.sentimentScore.toFixed(2)}
                  </span>
                </div>
                <Progress value={scorePercentage} style={sentimentColorScheme.progressStyle} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Very Negative</span>
                  <span>Neutral</span>
                  <span>Very Positive</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="font-headline">AI Summary & Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {result.summary}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

const AnalysisSkeleton = () => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  </div>
);
