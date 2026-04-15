"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { SortableLessonTile } from "@/components/sortable-lesson-tile";
import { LessonTile } from "@/components/lesson-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Course, UnitWithLessons, Lesson } from "@/lib/types";

interface CourseBoardProps {
  course: Course;
  onReorder: (lessonId: string, targetUnitId: string, newIndex: number) => Promise<void>;
  onReorderUnit: (unitId: string, newIndex: number) => Promise<void>;
  onUpdateUnit: (unitId: string, name: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onAddLesson: (unitId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}

function SortableUnit({
  unit,
  courseSequence,
  onUpdateUnit,
  onDeleteUnit,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: {
  unit: UnitWithLessons;
  courseSequence: number;
  onUpdateUnit: (unitId: string, name: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onAddLesson: (unitId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(unit.name);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `unit-sortable-${unit.id}`,
    data: { type: "unit", unitId: unit.id },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `unit-${unit.id}`,
    data: { type: "unit-dropzone", unitId: unit.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalDays = unit.lessons.reduce((sum, l) => sum + l.duration, 0);
  const lessonIds = unit.lessons.map((l) => l.id);

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== unit.name) {
      onUpdateUnit(unit.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      {...attributes}
      className={`rounded-lg border bg-card transition-colors ${isOver ? "ring-2 ring-primary/50" : ""}`}
    >
      <div className="flex items-center gap-2 p-3">
        <div
          className="cursor-grab text-muted-foreground/50 shrink-0"
          {...listeners}
          aria-label="Drag unit"
        >
          <GripVertical className="h-4 w-4" />
        </div>

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
        <div ref={setDroppableRef} className="border-t px-3 pb-3 pt-2 min-h-[48px]">
          <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
            {unit.lessons.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Drop lessons here or add a new one.
              </p>
            ) : (
              <div className="space-y-2">
                {unit.lessons.map((lesson) => (
                  <SortableLessonTile
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
          </SortableContext>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onAddLesson(unit.id)}>
            <Plus className="h-3.5 w-3.5" />
            Add Lesson
          </Button>
        </div>
      )}
    </div>
  );
}

type ActiveDrag =
  | { type: "lesson"; lesson: Lesson }
  | { type: "unit"; unit: UnitWithLessons }
  | null;

export function CourseBoard({
  course,
  onReorder,
  onReorderUnit,
  onUpdateUnit,
  onDeleteUnit,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: CourseBoardProps) {
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const findUnitForLesson = useCallback(
    (lessonId: string) => {
      return course.units.find((u) => u.lessons.some((l) => l.id === lessonId));
    },
    [course.units]
  );

  const unitSortableIds = course.units.map((u) => `unit-sortable-${u.id}`);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;

    if (activeType === "unit") {
      const unitId = active.data.current?.unitId as string | undefined;
      const unit = course.units.find((u) => u.id === unitId);
      if (unit) setActiveDrag({ type: "unit", unit });
      return;
    }

    // Default: treat as lesson drag
    const lesson = course.units
      .flatMap((u) => u.lessons)
      .find((l) => l.id === active.id);
    if (lesson) setActiveDrag({ type: "lesson", lesson });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const drag = activeDrag;
    setActiveDrag(null);

    if (!over) return;

    // --- Unit reordering ---
    if (drag?.type === "unit") {
      const overType = over.data.current?.type;
      // Only react when the drop target is another sortable unit.
      if (overType !== "unit") return;
      const overUnitId = over.data.current?.unitId as string | undefined;
      if (!overUnitId || overUnitId === drag.unit.id) return;

      const targetIndex = course.units.findIndex((u) => u.id === overUnitId);
      const sourceIndex = course.units.findIndex((u) => u.id === drag.unit.id);
      if (targetIndex === -1 || sourceIndex === targetIndex) return;

      await onReorderUnit(drag.unit.id, targetIndex);
      return;
    }

    // --- Lesson reordering (existing behavior) ---
    const activeId = active.id as string;
    const overId = over.id as string;

    let targetUnitId: string;
    let targetIndex: number;

    if (overId.startsWith("unit-sortable-")) {
      // Dragging a lesson onto a unit header row — place at end of that unit.
      targetUnitId = overId.replace("unit-sortable-", "");
      const unit = course.units.find((u) => u.id === targetUnitId);
      targetIndex = unit?.lessons.length ?? 0;
    } else if (overId.startsWith("unit-")) {
      // Dropped on the empty lesson-list drop zone.
      targetUnitId = overId.replace("unit-", "");
      const unit = course.units.find((u) => u.id === targetUnitId);
      targetIndex = unit?.lessons.length ?? 0;
    } else {
      // Dropped on another lesson.
      const overUnit = findUnitForLesson(overId);
      if (!overUnit) return;
      targetUnitId = overUnit.id;
      targetIndex = overUnit.lessons.findIndex((l) => l.id === overId);
    }

    // Don't reorder if nothing changed
    const sourceUnit = findUnitForLesson(activeId);
    if (sourceUnit?.id === targetUnitId) {
      const sourceIndex = sourceUnit.lessons.findIndex((l) => l.id === activeId);
      if (sourceIndex === targetIndex) return;
    }

    await onReorder(activeId, targetUnitId, targetIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={unitSortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {course.units.map((unit) => (
            <SortableUnit
              key={unit.id}
              unit={unit}
              courseSequence={course.sequence}
              onUpdateUnit={onUpdateUnit}
              onDeleteUnit={onDeleteUnit}
              onAddLesson={onAddLesson}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeDrag?.type === "lesson" ? (
          <div className="opacity-90">
            <LessonTile
              lesson={activeDrag.lesson}
              courseSequence={course.sequence}
              unitSequence={
                findUnitForLesson(activeDrag.lesson.id)?.sequence ?? 0
              }
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : activeDrag?.type === "unit" ? (
          <div className="opacity-90 rounded-lg border bg-card p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <Badge variant="outline" className="font-mono text-xs">
                {course.sequence}.{activeDrag.unit.sequence}
              </Badge>
              <h3 className="font-semibold text-sm">{activeDrag.unit.name}</h3>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
