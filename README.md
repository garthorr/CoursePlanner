# CoursePlanner

A responsive webapp for teachers to create and manage course plans with pacing analytics.

## Features

- **Courses**: Create, edit, clone, and template courses
- **Units & Lessons**: Organize lessons into units with drag-and-drop reordering
- **Auto-numbering**: Lesson codes (Course.Unit.Lesson) update automatically on reorder
- **Rich Text**: TipTap editor for lesson descriptions
- **Attachments**: Upload files or link cloud resources, classified by type (assessment, classwork, notes, etc.)
- **Textbook Correlations**: Track textbook references per lesson
- **Links**: Associate URLs with lessons
- **CSV Import**: Import lessons from spreadsheets with column mapping
- **Pacing Analytics**: Track instructional days vs. lesson days with buffer allocation
- **Templates**: Save courses as templates and clone for new semesters

## Tech Stack

- Next.js 14+ (App Router)
- PostgreSQL + Prisma ORM
- shadcn/ui + Tailwind CSS
- TipTap (rich text)
- @dnd-kit (drag and drop)
- Docker Compose

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd CoursePlanner
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run with Docker
docker-compose up --build

# Or run locally (requires running PostgreSQL)
npx prisma db push
npm run dev
```

## Docker

```bash
docker-compose up --build
```

This starts:
- **app** on port 3000
- **db** (PostgreSQL) on port 5432
- **migrate** runs schema push on startup

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/courseplanner` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
