"use client";

import Link from "next/link";
import { BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourseListItem } from "@/lib/types";

interface CourseCardProps {
  course: CourseListItem;
  onEdit: (course: CourseListItem) => void;
  onDelete: (courseId: string) => void;
}

export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const totalLessons = course.units.reduce((sum, u) => sum + u._count.lessons, 0);

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(course)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(course.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Link href={`/courses/${course.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {course.code}
            </Badge>
            {course.isTemplate && (
              <Badge variant="outline" className="text-xs">
                Template
              </Badge>
            )}
          </div>
          <CardTitle className="mt-2 text-lg">{course.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{course.units.length} unit{course.units.length !== 1 ? "s" : ""}</span>
            <span>{totalLessons} lesson{totalLessons !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
