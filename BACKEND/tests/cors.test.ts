import { describe, expect, it, afterEach } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Express } from "express";
import { createApp } from "../src/app";

let server: Server;

async function listen(app: Express): Promise<string> {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

afterEach(async () => {
  await new Promise<void>((resolve) => server?.close(() => resolve()));
});

describe("CORS enforcement", () => {
  it("allows the configured origin and echoes it back", async () => {
    const base = await listen(createApp());
    const res = await fetch(`${base}/health`, {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
  });

  it("rejects an unknown origin with 403 CORS_DENIED", async () => {
    const base = await listen(createApp());
    const res = await fetch(`${base}/health`, {
      headers: { Origin: "http://evil.example.com" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("CORS_DENIED");
  });

  it("allows requests without an Origin header", async () => {
    const base = await listen(createApp());
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
  });

  it("answers preflight OPTIONS for an allowed origin", async () => {
    const base = await listen(createApp());
    const res = await fetch(`${base}/api/interviews`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });
});
