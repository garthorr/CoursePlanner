"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PacingConfig } from "@/components/pacing-config";

interface UnitStat {
  id: string;
  name: string;
  sequence: number;
  usedDays: number;
  lessonCount: number;
  bufferDays: number;
}

interface PacingAnalytics {
  availableDays: number;
  usedDays: number;
  bufferDays: number;
  allocatedBuffer: number;
  unallocatedBuffer: number;
  unitStats: UnitStat[];
  overBudget: boolean;
}

interface PacingData {
  pacing: {
    id: string;
    totalDays: number | null;
    schoolDates: { id: string; date: string; excluded: boolean }[];
  };
  analytics: PacingAnalytics;
}

interface PacingDashboardProps {
  courseId: string;
}

function BufferInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (next: number) => void;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Math.max(0, parseInt(local) || 0);
    if (parsed !== value) onCommit(parsed);
    else setLocal(String(value));
  };

  return (
    <Input
      type="number"
      min={0}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="w-16 h-7 text-xs"
    />
  );
}

export function PacingDashboard({ courseId }: PacingDashboardProps) {
  const [data, setData] = useState<PacingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPacing = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/pacing`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      console.error("Failed to load pacing data:", err);
      setError("Failed to load pacing data.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchPacing();
  }, [fetchPacing]);

  const handleBufferChange = async (unitId: string, bufferDays: number) => {
    // Optimistic update so the input stays responsive
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        analytics: {
          ...prev.analytics,
          unitStats: prev.analytics.unitStats.map((u) =>
            u.id === unitId ? { ...u, bufferDays } : u
          ),
        },
      };
    });
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bufferDays }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      await fetchPacing();
    } catch (err) {
      console.error("Failed to update buffer:", err);
      await fetchPacing();
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading pacing data...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data) return null;

  const { analytics, pacing } = data;
  const usedPercent = analytics.availableDays > 0 ? Math.min(100, (analytics.usedDays / analytics.availableDays) * 100) : 0;
  const bufferPercent = analytics.availableDays > 0 ? (analytics.allocatedBuffer / analytics.availableDays) * 100 : 0;

  return (
    <div className="space-y-4">
      <PacingConfig
        courseId={courseId}
        currentTotalDays={pacing.totalDays}
        hasSchoolDates={pacing.schoolDates.length > 0}
        onUpdate={fetchPacing}
      />

      {analytics.availableDays > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Available Days</p>
                <p className="text-2xl font-bold">{analytics.availableDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Used Days</p>
                <p className="text-2xl font-bold">{analytics.usedDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Buffer Days</p>
                <p className="text-2xl font-bold">{analytics.bufferDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Unallocated Buffer</p>
                <p className="text-2xl font-bold">{analytics.unallocatedBuffer}</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pacing Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.overBudget && (
                <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-2 bg-destructive/10 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  Lessons exceed available days by {analytics.usedDays - analytics.availableDays} day{analytics.usedDays - analytics.availableDays !== 1 ? "s" : ""}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lesson days: {analytics.usedDays}</span>
                  <span>Buffer (allocated): {analytics.allocatedBuffer}</span>
                  <span>Remaining: {analytics.unallocatedBuffer}</span>
                </div>
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${usedPercent}%` }}
                  />
                  <div
                    className="h-full bg-primary/40 transition-all"
                    style={{ width: `${bufferPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-unit breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Unit Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.unitStats.map((unit) => (
                  <div key={unit.id} className="flex items-center gap-3 p-2 rounded border">
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      {unit.sequence}
                    </Badge>
                    <span className="flex-1 text-sm font-medium truncate">{unit.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {unit.lessonCount} lesson{unit.lessonCount !== 1 ? "s" : ""} &middot; {unit.usedDays} day{unit.usedDays !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">Buffer:</span>
                      <BufferInput
                        value={unit.bufferDays}
                        onCommit={(next) => handleBufferChange(unit.id, next)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
