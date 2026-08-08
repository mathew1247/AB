import dotenv from "dotenv";
import { z } from "zod";

// Load .env for local/dev/prod runs, but NOT during tests (vitest) so the
// test suite stays deterministic and never touches MongoDB/AI.
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().optional(),
  AI_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  AI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DEFAULT_TOTAL_QUESTIONS: z.coerce.number().int().min(1).max(20).default(5),
  MAX_ANSWER_LENGTH: z.coerce.number().int().positive().default(4000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;
