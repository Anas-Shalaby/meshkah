"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MemorizationProgressProps {
  data: {
    totalHadiths: number;
    memorizedHadiths: number;
    reviewedHadiths: number;
    confidenceLevel: number;
    plans: {
      id: string;
      name: string;
      progress: number;
      totalHadiths: number;
      memorizedHadiths: number;
    }[];
  } | null;
}

export function MemorizationProgress({ data }: MemorizationProgressProps) {
  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        جاري تحميل البيانات...
      </div>
    );
  }

  const overallProgress = (data.memorizedHadiths / data.totalHadiths) * 100;
  const reviewProgress = (data.reviewedHadiths / data.totalHadiths) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              التقدم الإجمالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {data.memorizedHadiths} من {data.totalHadiths}
                </span>
                <span className="text-sm font-medium">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">مستوى الثقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  متوسط مستوى الثقة
                </span>
                <span className="text-sm font-medium">
                  {Math.round(data.confidenceLevel)}%
                </span>
              </div>
              <Progress value={data.confidenceLevel} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">تقدم الخطط</h3>
        <div className="space-y-4">
          {data.plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {plan.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {plan.memorizedHadiths} من {plan.totalHadiths}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(plan.progress)}%
                    </span>
                  </div>
                  <Progress value={plan.progress} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
