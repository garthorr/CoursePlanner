"use client";

import { useState } from "react";
import { Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PacingConfigProps {
  courseId: string;
  currentTotalDays: number | null;
  hasSchoolDates: boolean;
  onUpdate: () => void;
}

export function PacingConfig({ courseId, currentTotalDays, hasSchoolDates, onUpdate }: PacingConfigProps) {
  const [mode, setMode] = useState<"manual" | "calendar">(hasSchoolDates ? "calendar" : "manual");
  const [totalDays, setTotalDays] = useState(currentTotalDays ?? 180);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [excludedDatesText, setExcludedDatesText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveManual = async () => {
    setSaving(true);
    await fetch(`/api/courses/${courseId}/pacing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalDays }),
    });
    setSaving(false);
    onUpdate();
  };

  const handleSaveCalendar = async () => {
    if (!startDate || !endDate) return;
    setSaving(true);

    // Parse excluded dates (one per line, YYYY-MM-DD)
    const excludedDates = excludedDatesText
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d && /^\d{4}-\d{2}-\d{2}$/.test(d));

    await fetch(`/api/courses/${courseId}/pacing/dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, excludedDates }),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pacing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
          >
            <Hash className="h-3.5 w-3.5" />
            Enter Days
          </Button>
          <Button
            variant={mode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("calendar")}
          >
            <Calendar className="h-3.5 w-3.5" />
            Calendar Range
          </Button>
        </div>

        {mode === "manual" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="total-days">Total Instructional Days</Label>
              <div className="flex gap-2">
                <Input
                  id="total-days"
                  type="number"
                  min={1}
                  max={365}
                  value={totalDays}
                  onChange={(e) => setTotalDays(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <Button onClick={handleSaveManual} disabled={saving || totalDays < 1}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excluded-dates">
                Excluded Dates (holidays, non-instructional — one per line, YYYY-MM-DD)
              </Label>
              <textarea
                id="excluded-dates"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={"2025-11-27\n2025-11-28\n2025-12-23"}
                value={excludedDatesText}
                onChange={(e) => setExcludedDatesText(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveCalendar} disabled={saving || !startDate || !endDate}>
              {saving ? "Generating..." : "Generate School Calendar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
