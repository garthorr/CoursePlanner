"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload } from "lucide-react";

const FIELD_OPTIONS = [
  { value: "__skip__", label: "Skip" },
  { value: "title", label: "Title" },
  { value: "unit", label: "Unit Name" },
  { value: "description", label: "Description" },
  { value: "duration", label: "Duration (days)" },
  { value: "textbook", label: "Textbook" },
  { value: "textbookRef", label: "Textbook Reference" },
  { value: "link", label: "Link URL" },
];

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onImported: () => void;
}

export function CsvImportDialog({ open, onOpenChange, courseId, onImported }: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ lessonsCreated: number; unitsCreated: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        console.error("CSV parse error:", err);
        alert("Failed to parse CSV file.");
      },
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const csvHeaders = results.meta.fields || [];
        if (csvHeaders.length === 0) {
          alert("No columns detected in CSV.");
          return;
        }
        setHeaders(csvHeaders);
        setRows(data);
        setResult(null);

        // Auto-map columns based on header names
        const autoMap: Record<string, string> = {};
        for (const header of csvHeaders) {
          const lower = header.toLowerCase().trim();
          if (lower.includes("title") || lower === "name" || lower === "lesson") {
            autoMap[header] = "title";
          } else if (lower.includes("unit") || lower === "chapter" || lower === "module") {
            autoMap[header] = "unit";
          } else if (lower.includes("desc")) {
            autoMap[header] = "description";
          } else if (lower.includes("dur") || lower.includes("days")) {
            autoMap[header] = "duration";
          } else if (lower.includes("textbook") || lower === "book") {
            autoMap[header] = "textbook";
          } else if (lower.includes("ref") || lower.includes("page") || lower.includes("chapter")) {
            if (!autoMap[header]) autoMap[header] = "textbookRef";
          } else if (lower.includes("link") || lower.includes("url")) {
            autoMap[header] = "link";
          } else {
            autoMap[header] = "__skip__";
          }
        }
        setColumnMap(autoMap);
      },
    });
  };

  const handleImport = async () => {
    setImporting(true);

    const mappedRows = rows.map((row) => {
      const mapped: Record<string, string | number> = {};
      for (const [header, field] of Object.entries(columnMap)) {
        if (field === "__skip__") continue;
        const val = row[header]?.trim();
        if (!val) continue;
        if (field === "duration") {
          mapped[field] = parseInt(val) || 1;
        } else {
          mapped[field] = val;
        }
      }
      return mapped;
    });

    try {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rows: mappedRows }),
      });
      if (!res.ok) throw new Error(`Import failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
      onImported();
    } catch (err) {
      console.error("Failed to import CSV:", err);
      alert("Failed to import CSV.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setResult(null);
    onOpenChange(false);
  };

  const hasTitleMapping = Object.values(columnMap).includes("title");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Lessons from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map its columns to lesson fields.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* File upload */}
          {headers.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with lesson data
              </p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Column mapping */}
          {headers.length > 0 && !result && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Column Mapping</Label>
                <div className="grid grid-cols-2 gap-2">
                  {headers.map((header) => (
                    <div key={header} className="flex items-center gap-2">
                      <span className="text-sm truncate flex-1 font-mono text-muted-foreground">
                        {header}
                      </span>
                      <Select
                        value={columnMap[header] || "__skip__"}
                        onValueChange={(v) => setColumnMap({ ...columnMap, [header]: v })}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Preview ({rows.length} row{rows.length !== 1 ? "s" : ""})
                </Label>
                <ScrollArea className="h-[200px] rounded border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        {headers
                          .filter((h) => columnMap[h] !== "__skip__")
                          .map((h) => (
                            <th key={h} className="px-2 py-1 text-left font-medium">
                              {FIELD_OPTIONS.find((f) => f.value === columnMap[h])?.label || h}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          {headers
                            .filter((h) => columnMap[h] !== "__skip__")
                            .map((h) => (
                              <td key={h} className="px-2 py-1 truncate max-w-[200px]">
                                {row[h]}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 10 && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      ...and {rows.length - 10} more rows
                    </p>
                  )}
                </ScrollArea>
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-lg border bg-green-50 p-4 text-center">
              <p className="font-medium text-green-800">Import Complete</p>
              <p className="text-sm text-green-700 mt-1">
                {result.lessonsCreated} lesson{result.lessonsCreated !== 1 ? "s" : ""} imported
                {result.unitsCreated > 0 && `, ${result.unitsCreated} new unit${result.unitsCreated !== 1 ? "s" : ""} created`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {headers.length > 0 && (
                <Button
                  onClick={handleImport}
                  disabled={importing || !hasTitleMapping}
                >
                  {importing ? "Importing..." : `Import ${rows.length} Lessons`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
