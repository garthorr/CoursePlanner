"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TextbookCorrelation } from "@/lib/types";

type LocalCorrelation = Omit<TextbookCorrelation, "id" | "lessonId"> & { id?: string; tempId?: string };

interface TextbookManagerProps {
  correlations: LocalCorrelation[];
  onChange: (correlations: LocalCorrelation[]) => void;
}

export function TextbookManager({ correlations, onChange }: TextbookManagerProps) {
  const handleAdd = () => {
    onChange([...correlations, { textbook: "", reference: "", tempId: crypto.randomUUID() }]);
  };

  const handleRemove = (index: number) => {
    onChange(correlations.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: "textbook" | "reference", value: string) => {
    const updated = [...correlations];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>Textbook Correlations</Label>
      {correlations.map((corr, index) => (
        <div key={corr.id || corr.tempId} className="flex gap-2">
          <Input
            placeholder="Textbook name"
            value={corr.textbook}
            onChange={(e) => handleChange(index, "textbook", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Chapter/Page (e.g., Ch. 5, pp. 120-135)"
            value={corr.reference}
            onChange={(e) => handleChange(index, "reference", e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5" />
        Add Textbook Reference
      </Button>
    </div>
  );
}
