"use client";

import { useState, useEffect } from "react";
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
import type { CourseListItem } from "@/lib/types";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: CourseListItem | null;
  onSubmit: (data: { name: string; code: string }) => void;
}

export function CourseDialog({ open, onOpenChange, course, onSubmit }: CourseDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (course) {
      setName(course.name);
      setCode(course.code);
    } else {
      setName("");
      setCode("");
    }
  }, [course, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onSubmit({ name: name.trim(), code: code.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "New Course"}</DialogTitle>
          <DialogDescription>
            {course ? "Update the course details." : "Create a new course to start planning."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                placeholder="e.g. AP Biology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                placeholder="e.g. BIO, HIST101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !code.trim()}>
              {course ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
