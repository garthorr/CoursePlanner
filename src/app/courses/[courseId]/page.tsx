"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseBoard } from "@/components/course-board";
import { UnitDialog } from "@/components/unit-dialog";
import { LessonForm } from "@/components/lesson-form";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import type { Course, Lesson } from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) {
      setCourse(await res.json());
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleAddUnit = async (name: string) => {
    await fetch(`/api/courses/${courseId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setUnitDialogOpen(false);
    fetchCourse();
  };

  const handleUpdateUnit = async (unitId: string, name: string) => {
    await fetch(`/api/units/${unitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchCourse();
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Delete this unit and all its lessons?")) return;
    await fetch(`/api/units/${unitId}`, { method: "DELETE" });
    fetchCourse();
  };

  const handleAddLesson = (unitId: string) => {
    setActiveUnitId(unitId);
    setEditingLesson(null);
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setActiveUnitId(lesson.unitId);
    setEditingLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
    fetchCourse();
  };

  const handleReorder = async (lessonId: string, targetUnitId: string, newIndex: number) => {
    await fetch("/api/lessons/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, targetUnitId, newIndex }),
    });
    fetchCourse();
  };

  const handleLessonSubmit = async (data: {
    title: string;
    description: string;
    duration: number;
    textbookCorrelations: { textbook: string; reference: string }[];
    links: { url: string; label: string | null }[];
  }) => {
    if (editingLesson) {
      await fetch(`/api/lessons/${editingLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else if (activeUnitId) {
      await fetch(`/api/units/${activeUnitId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setLessonDialogOpen(false);
    fetchCourse();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Course not found.</p>
        <Button variant="outline" asChild>
          <Link href="/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const totalLessons = course.units.reduce((sum, u) => sum + u.lessons.length, 0);
  const totalDays = course.units.reduce((sum, u) => sum + u.lessons.reduce((s, l) => s + l.duration, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            <Badge variant="secondary">{course.code}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {course.units.length} unit{course.units.length !== 1 ? "s" : ""} &middot;{" "}
            {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} &middot;{" "}
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCsvImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setUnitDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {course.units.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-semibold">No units yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first unit to start organizing lessons.
          </p>
          <Button className="mt-4" onClick={() => setUnitDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>
      ) : (
        <CourseBoard
          course={course}
          onReorder={handleReorder}
          onUpdateUnit={handleUpdateUnit}
          onDeleteUnit={handleDeleteUnit}
          onAddLesson={handleAddLesson}
          onEditLesson={handleEditLesson}
          onDeleteLesson={handleDeleteLesson}
        />
      )}

      <UnitDialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen} onSubmit={handleAddUnit} />

      <LessonForm
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        lesson={editingLesson}
        onSubmit={handleLessonSubmit}
      />

      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        courseId={courseId}
        onImported={fetchCourse}
      />
    </div>
  );
}
