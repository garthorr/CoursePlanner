"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CourseDialog } from "@/components/course-dialog";
import type { CourseListItem } from "@/lib/types";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseListItem | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError("Failed to load courses. Please refresh.");
    } finally {
      setLoading(false);
    }
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
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to delete course:", err);
      alert("Failed to delete course.");
    }
  };

  const handleClone = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Clone failed: ${res.status}`);
      const cloned = await res.json();
      await fetchCourses();
      router.push(`/courses/${cloned.id}`);
    } catch (err) {
      console.error("Failed to clone course:", err);
      alert("Failed to clone course.");
    }
  };

  const handleToggleTemplate = async (courseId: string, isTemplate: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/template`, {
        method: isTemplate ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to toggle template:", err);
      alert("Failed to update template status.");
    }
  };

  const handleSubmit = async (data: { name: string; code: string }) => {
    try {
      const res = await fetch(
        editingCourse ? `/api/courses/${editingCourse.id}` : "/api/courses",
        {
          method: editingCourse ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setDialogOpen(false);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to save course:", err);
      alert("Failed to save course.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => { setLoading(true); fetchCourses(); }}>
          Retry
        </Button>
      </div>
    );
  }

  const activeCourses = courses.filter((c) => !c.isTemplate);
  const templates = courses.filter((c) => c.isTemplate);

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
        <>
          {activeCourses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Active Courses</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onClone={handleClone}
                    onToggleTemplate={handleToggleTemplate}
                  />
                ))}
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Templates</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onClone={handleClone}
                    onToggleTemplate={handleToggleTemplate}
                  />
                ))}
              </div>
            </div>
          )}
        </>
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
