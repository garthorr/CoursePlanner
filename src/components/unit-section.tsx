"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LessonTile } from "@/components/lesson-tile";
import type { UnitWithLessons, Lesson } from "@/lib/types";

interface UnitSectionProps {
  unit: UnitWithLessons;
  courseSequence: number;
  onUpdateUnit: (unitId: string, name: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onAddLesson: (unitId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}

export function UnitSection({
  unit,
  courseSequence,
  onUpdateUnit,
  onDeleteUnit,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: UnitSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(unit.name);

  const totalDays = unit.lessons.reduce((sum, l) => sum + l.duration, 0);

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== unit.name) {
      onUpdateUnit(unit.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 p-3">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <Badge variant="outline" className="shrink-0 font-mono text-xs">
          {courseSequence}.{unit.sequence}
        </Badge>

        {editing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <h3 className="flex-1 truncate font-semibold text-sm">{unit.name}</h3>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">
            {unit.lessons.length} lesson{unit.lessons.length !== 1 ? "s" : ""} &middot; {totalDays} day{totalDays !== 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(true); setEditName(unit.name); }}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDeleteUnit(unit.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2">
          {unit.lessons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No lessons in this unit yet.</p>
          ) : (
            <div className="space-y-2">
              {unit.lessons.map((lesson) => (
                <LessonTile
                  key={lesson.id}
                  lesson={lesson}
                  courseSequence={courseSequence}
                  unitSequence={unit.sequence}
                  onEdit={() => onEditLesson(lesson)}
                  onDelete={() => onDeleteLesson(lesson.id)}
                />
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onAddLesson(unit.id)}>
            <Plus className="h-3.5 w-3.5" />
            Add Lesson
          </Button>
        </div>
      )}
    </div>
  );
}
