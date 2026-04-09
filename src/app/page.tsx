"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Layers, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseListItem } from "@/lib/types";

export default function DashboardPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const courseCount = courses.filter((c) => !c.isTemplate).length;
  const unitCount = courses.reduce((sum, c) => sum + c.units.length, 0);
  const lessonCount = courses.reduce(
    (sum, c) => sum + c.units.reduce((s, u) => s + u._count.lessons, 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to CoursePlanner</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{courseCount}</p>
            <p className="text-xs text-muted-foreground">active courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{unitCount}</p>
            <p className="text-xs text-muted-foreground">across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lessonCount}</p>
            <p className="text-xs text-muted-foreground">total lessons planned</p>
          </CardContent>
        </Card>
      </div>

      {courseCount === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Create your first course to begin planning.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/courses">
                <Plus className="h-4 w-4" />
                Go to Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
