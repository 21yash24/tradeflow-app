import { SentimentAnalysisForm } from "@/components/sentiment-analysis-form";

export default function SentimentAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          News Sentiment Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Gain an edge by analyzing market sentiment. Paste a news article to
          get an AI-powered analysis of its potential impact.
        </p>
      </div>
      <SentimentAnalysisForm />
    </div>
  );
}
