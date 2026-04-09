"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LessonLink } from "@/lib/types";

type LocalLink = Omit<LessonLink, "id" | "lessonId"> & { id?: string; tempId?: string };

interface LinksManagerProps {
  links: LocalLink[];
  onChange: (links: LocalLink[]) => void;
}

export function LinksManager({ links, onChange }: LinksManagerProps) {
  const handleAdd = () => {
    onChange([...links, { url: "", label: "", tempId: crypto.randomUUID() }]);
  };

  const handleRemove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: "url" | "label", value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>Links</Label>
      {links.map((link, index) => (
        <div key={link.id || link.tempId} className="flex gap-2">
          <Input
            placeholder="URL"
            value={link.url}
            onChange={(e) => handleChange(index, "url", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Label (optional)"
            value={link.label || ""}
            onChange={(e) => handleChange(index, "label", e.target.value)}
            className="flex-[0.5]"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" />
        Add Link
      </Button>
    </div>
  );
}
