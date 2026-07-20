import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFile } from "fs/promises";
import path from "path";

const VOI_PILOT_FILES = [
  "001-product-received.json",
  "002-inventory-transferred.json",
  "003-product-sold.json",
  "004-product-returned.json",
  "005-payment-settled.json",
] as const;

async function readVoiPilotExpressions() {
  const directory = path.join(process.cwd(), "qel-spec", "examples", "voi");
  return Promise.all(
    VOI_PILOT_FILES.map(async (filename) => {
      const raw = await readFile(path.join(directory, filename), "utf-8");
      return JSON.parse(raw);
    }),
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/qel/status", (_req, res) => {
    res.json({
      language: "Quantum Expression Language",
      specVersion: "0.1.0-draft",
      semantics: "signed-claim-not-automatic-fact",
      frozenSnapshot: "archive/qel-console-2026-07-21",
      pilot: {
        name: "VOI five-event pilot",
        eventCount: VOI_PILOT_FILES.length,
        eventTypes: [
          "product-received",
          "inventory-transferred",
          "product-sold",
          "product-returned",
          "payment-settled",
        ],
      },
      validation: {
        implementation: "qel-core-python",
        commands: ["validate", "canonicalize", "hash", "verify-digest"],
      },
    });
  });

  app.get("/api/qel/pilot/voi/events", async (_req, res, next) => {
    try {
      const expressions = await readVoiPilotExpressions();
      res.json({ count: expressions.length, expressions });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
