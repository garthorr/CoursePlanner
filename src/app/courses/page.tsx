import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage your courses and lesson plans</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">No courses yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first course to get started with planning.
        </p>
      </div>
    </div>
  );
}
