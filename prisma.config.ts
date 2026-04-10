// Best-effort load of dotenv when available (e.g. local dev). In Docker
// the env vars are injected directly by docker-compose and dotenv is not
// installed in the runtime image, so a hard `import "dotenv/config"` would
// crash the migrate container.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv/config");
} catch {
  // dotenv not installed — assume env vars are set by the host
}
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
