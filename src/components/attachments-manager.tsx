"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Upload, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Attachment, AttachmentType } from "@/lib/types";

const ATTACHMENT_TYPES: { value: AttachmentType; label: string }[] = [
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "CLASSWORK", label: "Classwork" },
  { value: "NOTES", label: "Notes" },
  { value: "HOMEWORK", label: "Homework" },
  { value: "RESOURCE", label: "Resource" },
  { value: "OTHER", label: "Other" },
];

interface AttachmentsManagerProps {
  lessonId?: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function AttachmentsManager({ lessonId, attachments, onAttachmentsChange }: AttachmentsManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [cloudUrl, setCloudUrl] = useState("");
  const [cloudName, setCloudName] = useState("");
  const [cloudType, setCloudType] = useState<AttachmentType>("RESOURCE");
  const [uploadType, setUploadType] = useState<AttachmentType>("RESOURCE");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !lessonId) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonId", lessonId);
      formData.append("type", uploadType);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const attachment = await res.json();
        onAttachmentsChange([...attachments, attachment]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddCloudLink = async () => {
    if (!cloudUrl || !lessonId) return;

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        url: cloudUrl,
        name: cloudName || cloudUrl,
        type: cloudType,
      }),
    });

    if (res.ok) {
      const attachment = await res.json();
      onAttachmentsChange([...attachments, attachment]);
      setCloudUrl("");
      setCloudName("");
      setLinkMode(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    const res = await fetch(`/api/upload?id=${attachmentId}`, { method: "DELETE" });
    if (res.ok) {
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
    }
  };

  const getTypeBadgeColor = (type: AttachmentType) => {
    const colors: Record<AttachmentType, string> = {
      ASSESSMENT: "bg-red-100 text-red-800",
      CLASSWORK: "bg-blue-100 text-blue-800",
      NOTES: "bg-green-100 text-green-800",
      HOMEWORK: "bg-yellow-100 text-yellow-800",
      RESOURCE: "bg-purple-100 text-purple-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return colors[type];
  };

  return (
    <div className="space-y-3">
      <Label>Attachments</Label>

      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 rounded border p-2 text-sm">
              <Badge variant="outline" className={getTypeBadgeColor(att.type)}>
                {att.type.toLowerCase()}
              </Badge>
              <span className="flex-1 truncate">
                {att.url ? (
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {att.name}
                  </a>
                ) : (
                  att.name
                )}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(att.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!lessonId ? (
        <p className="text-xs text-muted-foreground">Save the lesson first to add attachments.</p>
      ) : (
        <div className="space-y-2">
          {linkMode ? (
            <div className="space-y-2 rounded border p-3">
              <Input
                placeholder="Cloud resource URL (e.g., Google Docs link)"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Display name (optional)"
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  className="flex-1"
                />
                <Select value={cloudType} onValueChange={(v) => setCloudType(v as AttachmentType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTACHMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleAddCloudLink} disabled={!cloudUrl}>
                  Add Link
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setLinkMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Select value={uploadType} onValueChange={(v) => setUploadType(v as AttachmentType)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTACHMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setLinkMode(true)}>
                <Link2 className="h-3.5 w-3.5" />
                Add Cloud Link
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
