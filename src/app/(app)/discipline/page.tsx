
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DisciplinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Discipline Tracker
        </h1>
        <p className="text-muted-foreground mt-2">
          Maintain discipline and stick to your trading plan.
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
