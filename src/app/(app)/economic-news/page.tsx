
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EconomicNewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Economic News
        </h1>
        <p className="text-muted-foreground mt-2">
          Stay informed about market-moving economic events.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
