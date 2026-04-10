"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TextbookManager } from "@/components/textbook-manager";
import { LinksManager } from "@/components/links-manager";
import { AttachmentsManager } from "@/components/attachments-manager";
import type { Lesson, TextbookCorrelation, LessonLink, Attachment } from "@/lib/types";

interface LessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: Lesson | null;
  onSubmit: (data: {
    title: string;
    description: string;
    duration: number;
    textbookCorrelations: { textbook: string; reference: string }[];
    links: { url: string; label: string | null }[];
  }) => void;
}

type LocalCorrelation = Omit<TextbookCorrelation, "id" | "lessonId"> & { id?: string; tempId?: string };
type LocalLink = Omit<LessonLink, "id" | "lessonId"> & { id?: string; tempId?: string };

function correlationsFromLesson(lesson: Lesson | null | undefined): LocalCorrelation[] {
  if (!lesson) return [];
  return lesson.textbookCorrelations.map((c) => ({
    id: c.id,
    textbook: c.textbook,
    reference: c.reference,
  }));
}

function linksFromLesson(lesson: Lesson | null | undefined): LocalLink[] {
  if (!lesson) return [];
  return lesson.links.map((l) => ({
    id: l.id,
    url: l.url,
    label: l.label,
  }));
}

export function LessonForm({ open, onOpenChange, lesson, onSubmit }: LessonFormProps) {
  // Derived state pattern: reset form fields when lesson or open changes.
  const formKey = `${lesson?.id ?? "new"}-${open}`;
  const [lastKey, setLastKey] = useState(formKey);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [duration, setDuration] = useState(lesson?.duration ?? 1);
  const [correlations, setCorrelations] = useState<LocalCorrelation[]>(() =>
    correlationsFromLesson(lesson)
  );
  const [links, setLinks] = useState<LocalLink[]>(() => linksFromLesson(lesson));
  const [attachments, setAttachments] = useState<Attachment[]>(lesson?.attachments ?? []);

  if (lastKey !== formKey) {
    setLastKey(formKey);
    setTitle(lesson?.title ?? "");
    setDescription(lesson?.description ?? "");
    setDuration(lesson?.duration ?? 1);
    setCorrelations(correlationsFromLesson(lesson));
    setLinks(linksFromLesson(lesson));
    setAttachments(lesson?.attachments ?? []);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description,
      duration,
      textbookCorrelations: correlations
        .filter((c) => c.textbook.trim())
        .map((c) => ({ textbook: c.textbook, reference: c.reference })),
      links: links
        .filter((l) => l.url.trim())
        .map((l) => ({ url: l.url, label: l.label })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit Lesson" : "New Lesson"}</DialogTitle>
          <DialogDescription>
            {lesson ? "Update the lesson details." : "Add a new lesson to this unit."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input
                  id="lesson-title"
                  placeholder="e.g. Introduction to Cell Biology"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor content={description} onChange={setDescription} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (days)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min={1}
                  max={30}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
              </div>

              <Separator />

              <TextbookManager correlations={correlations} onChange={setCorrelations} />

              <Separator />

              <LinksManager links={links} onChange={setLinks} />

              <Separator />

              <AttachmentsManager
                lessonId={lesson?.id}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {lesson ? "Save Changes" : "Add Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
