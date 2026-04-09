"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseDialog } from "@/components/course-dialog";
import type { CourseListItem } from "@/lib/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseListItem | null>(null);

  const fetchCourses = useCallback(async () => {
    const res = await fetch("/api/courses");
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreate = () => {
    setEditingCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: CourseListItem) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return;
    await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    fetchCourses();
  };

  const handleSubmit = async (data: { name: string; code: string }) => {
    if (editingCourse) {
      await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setDialogOpen(false);
    fetchCourses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage your courses and lesson plans</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">No courses yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first course to get started with planning.
          </p>
          <Button className="mt-4" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editingCourse}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
