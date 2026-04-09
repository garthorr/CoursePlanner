"use client";

import { Clock, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Lesson } from "@/lib/types";

interface LessonTileProps {
  lesson: Lesson;
  courseSequence: number;
  unitSequence: number;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function LessonTile({
  lesson,
  courseSequence,
  unitSequence,
  onEdit,
  onDelete,
  dragHandleProps,
}: LessonTileProps) {
  const code = `${courseSequence}.${unitSequence}.${lesson.sequence}`;

  return (
    <div className="group flex items-center gap-2 rounded-md border bg-background p-2 transition-colors hover:bg-accent/50">
      <div className="cursor-grab text-muted-foreground/50" {...dragHandleProps}>
        <GripVertical className="h-4 w-4" />
      </div>

      <Badge variant="outline" className="shrink-0 font-mono text-xs">
        {code}
      </Badge>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{lesson.title}</p>
      </div>

      {lesson.duration > 1 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          {lesson.duration}d
        </div>
      )}

      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
