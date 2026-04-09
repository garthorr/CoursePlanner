"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LessonTile } from "@/components/lesson-tile";
import type { Lesson } from "@/lib/types";

interface SortableLessonTileProps {
  lesson: Lesson;
  courseSequence: number;
  unitSequence: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLessonTile({
  lesson,
  courseSequence,
  unitSequence,
  onEdit,
  onDelete,
}: SortableLessonTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lesson.id,
    data: { type: "lesson", lesson, unitId: lesson.unitId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LessonTile
        lesson={lesson}
        courseSequence={courseSequence}
        unitSequence={unitSequence}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}
