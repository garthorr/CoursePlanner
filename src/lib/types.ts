export interface Course {
  id: string;
  name: string;
  code: string;
  sequence: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  units: UnitWithLessons[];
  pacing?: Pacing | null;
}

export interface Unit {
  id: string;
  name: string;
  sequence: number;
  bufferDays: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitWithLessons extends Unit {
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  sequence: number;
  unitId: string;
  createdAt: string;
  updatedAt: string;
  textbookCorrelations: TextbookCorrelation[];
  links: LessonLink[];
  attachments: Attachment[];
}

export interface TextbookCorrelation {
  id: string;
  textbook: string;
  reference: string;
  lessonId: string;
}

export interface LessonLink {
  id: string;
  url: string;
  label: string | null;
  lessonId: string;
}

export type AttachmentType =
  | "ASSESSMENT"
  | "CLASSWORK"
  | "NOTES"
  | "HOMEWORK"
  | "RESOURCE"
  | "OTHER";

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  filePath: string | null;
  url: string | null;
  lessonId: string;
  createdAt: string;
}

export interface Pacing {
  id: string;
  totalDays: number | null;
  courseId: string;
}

export interface CourseListItem {
  id: string;
  name: string;
  code: string;
  sequence: number;
  isTemplate: boolean;
  units: {
    id: string;
    name: string;
    sequence: number;
    _count: { lessons: number };
  }[];
}
