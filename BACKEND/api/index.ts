// Thin Vercel adapter: re-exports the captured http.Server from src.
// All business logic lives in src/ (see src/vercel.ts and src/app-server.ts).
export { default } from "../src/vercel";
