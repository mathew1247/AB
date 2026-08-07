import * as fs from "node:fs";
import * as path from "node:path";

export function loadJson<T>(file: string): T {
  const candidates = [
    path.join(__dirname, "..", "data", file),
    path.join(__dirname, "..", "..", "src", "data", file),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf-8")) as T;
    }
  }
  throw new Error(`Data file not found: ${file}`);
}
