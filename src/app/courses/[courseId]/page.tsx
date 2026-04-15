"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Upload, BarChart3, Layers, Copy, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseBoard } from "@/components/course-board";
import { UnitDialog } from "@/components/unit-dialog";
import { LessonForm } from "@/components/lesson-form";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { PacingDashboard } from "@/components/pacing-dashboard";
import type { Course, Lesson } from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [view, setView] = useState<"content" | "pacing">("content");

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.status === 404) {
        setCourse(null);
        setError(null);
        return;
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setCourse(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load course:", err);
      setError("Failed to load course. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleAddUnit = async (name: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`Add unit failed: ${res.status}`);
      setUnitDialogOpen(false);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to add unit:", err);
      alert("Failed to add unit.");
    }
  };

  const handleUpdateUnit = async (unitId: string, name: string) => {
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`Update unit failed: ${res.status}`);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to update unit:", err);
      alert("Failed to update unit.");
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Delete this unit and all its lessons?")) return;
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete unit failed: ${res.status}`);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to delete unit:", err);
      alert("Failed to delete unit.");
    }
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
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete lesson failed: ${res.status}`);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to delete lesson:", err);
      alert("Failed to delete lesson.");
    }
  };

  const handleReorder = async (lessonId: string, targetUnitId: string, newIndex: number) => {
    try {
      const res = await fetch("/api/lessons/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, targetUnitId, newIndex }),
      });
      if (!res.ok) throw new Error(`Reorder failed: ${res.status}`);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to reorder lesson:", err);
      alert("Failed to reorder lesson.");
      await fetchCourse();
    }
  };

  const handleReorderUnit = async (unitId: string, newIndex: number) => {
    try {
      const res = await fetch("/api/units/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, newIndex }),
      });
      if (!res.ok) throw new Error(`Reorder unit failed: ${res.status}`);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to reorder unit:", err);
      alert("Failed to reorder unit.");
      await fetchCourse();
    }
  };

  const handleLessonSubmit = async (data: {
    title: string;
    description: string;
    duration: number;
    textbookCorrelations: { textbook: string; reference: string }[];
    links: { url: string; label: string | null }[];
  }) => {
    try {
      const res = editingLesson
        ? await fetch(`/api/lessons/${editingLesson.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : activeUnitId
          ? await fetch(`/api/units/${activeUnitId}/lessons`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            })
          : null;
      if (!res || !res.ok) throw new Error(`Save lesson failed: ${res?.status}`);
      setLessonDialogOpen(false);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to save lesson:", err);
      alert("Failed to save lesson.");
    }
  };

  const handleToggleTemplate = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/template`, {
        method: course?.isTemplate ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      await fetchCourse();
    } catch (err) {
      console.error("Failed to toggle template:", err);
      alert("Failed to update template status.");
    }
  };

  const handleClone = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Clone failed: ${res.status}`);
      const cloned = await res.json();
      window.location.href = `/courses/${cloned.id}`;
    } catch (err) {
      console.error("Failed to clone course:", err);
      alert("Failed to clone course.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => { setLoading(true); fetchCourse(); }}>
          Retry
        </Button>
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
            {course.isTemplate && <Badge variant="outline">Template</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {course.units.length} unit{course.units.length !== 1 ? "s" : ""} &middot;{" "}
            {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} &middot;{" "}
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={handleToggleTemplate}>
            {course.isTemplate ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
            {course.isTemplate ? "Unmark Template" : "Save as Template"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClone}>
            <Copy className="h-4 w-4" />
            Clone
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCsvImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setUnitDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 border-b">
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-none border-b-2 ${view === "content" ? "border-primary" : "border-transparent"}`}
          onClick={() => setView("content")}
        >
          <Layers className="h-4 w-4" />
          Lessons
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-none border-b-2 ${view === "pacing" ? "border-primary" : "border-transparent"}`}
          onClick={() => setView("pacing")}
        >
          <BarChart3 className="h-4 w-4" />
          Pacing
        </Button>
      </div>

      {view === "pacing" ? (
        <PacingDashboard courseId={courseId} />
      ) : course.units.length === 0 ? (
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
          onReorderUnit={handleReorderUnit}
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
