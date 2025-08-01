"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";
import { ar } from "date-fns/locale";

interface StudyStreakProps {
  data: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string;
    studyDays: {
      date: string;
      hadithsMemorized: number;
      hadithsReviewed: number;
    }[];
  } | null;
}

export function StudyStreak({ data }: StudyStreakProps) {
  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        جاري تحميل البيانات...
      </div>
    );
  }

  const formatDate = (date: string) => {
    const studyDate = new Date(date);
    if (isToday(studyDate)) return "اليوم";
    if (isYesterday(studyDate)) return "الأمس";
    if (isThisWeek(studyDate)) return format(studyDate, "EEEE", { locale: ar });
    if (isThisMonth(studyDate))
      return format(studyDate, "d MMMM", { locale: ar });
    return format(studyDate, "d MMMM yyyy", { locale: ar });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              السلسلة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentStreak}</div>
            <p className="text-xs text-muted-foreground">أيام متتالية</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">أطول سلسلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.longestStreak}</div>
            <p className="text-xs text-muted-foreground">أيام</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">سجل الدراسة</h3>
        <div className="space-y-2">
          {data.studyDays.map((day) => (
            <Card key={day.date}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.hadithsMemorized} حديث محفوظ
                      {day.hadithsReviewed > 0 &&
                        ` • ${day.hadithsReviewed} حديث مراجع`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
