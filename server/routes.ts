import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFile } from "fs/promises";
import path from "path";
import {
  buildProductReceivedExpression,
  constantTimeSecretMatches,
  getProductReceivedReadiness,
  loadProductReceivedConfig,
  productReceivedRequestSchema,
  requestRiverOsReceipt,
  sha256Canonical,
  validateOperationalAuthority,
  type ProductReceivedSubmission,
} from "./qel/product-received";

const VOI_PILOT_FILES = [
  "001-product-received.json",
  "002-inventory-transferred.json",
  "003-product-sold.json",
  "004-product-returned.json",
  "005-payment-settled.json",
] as const;

const productReceivedSubmissions = new Map<
  string,
  { requestDigest: string; submission: ProductReceivedSubmission }
>();

async function readVoiPilotExpressions() {
  const directory = path.join(process.cwd(), "qel-spec", "examples", "voi");
  return Promise.all(
    VOI_PILOT_FILES.map(async (filename) => {
      const raw = await readFile(path.join(directory, filename), "utf-8");
      return JSON.parse(raw);
    }),
  );
}

function getProductReceivedStatus() {
  try {
    const config = loadProductReceivedConfig();
    return { ...getProductReceivedReadiness(config), configurationError: null };
  } catch (error) {
    return {
      ready: false,
      enabled: false,
      missing: [],
      warehouseNodeCount: 0,
      licensedOperatorCount: 0,
      configurationError: error instanceof Error ? error.message : "Invalid configuration",
    };
  }
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
        liveActivation: {
          activeEvent: "product-received",
          otherEventsEnabled: false,
          productReceived: getProductReceivedStatus(),
        },
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

  app.get("/api/qel/pilot/voi/product-received/status", (_req, res) => {
    res.json({
      eventType: "org.voijeans.inventory.product-received.v1",
      writeEndpoint: "/api/qel/pilot/voi/product-received",
      validationEndpoint: "/api/qel/pilot/voi/product-received/validate",
      activation: getProductReceivedStatus(),
      controls: [
        "ingest API authentication",
        "strict request validation",
        "warehouse-node allowlist",
        "operator and licence allowlist",
        "idempotency-key enforcement",
        "RiverOS receipt digest match",
      ],
    });
  });

  app.post("/api/qel/pilot/voi/product-received/validate", (req, res) => {
    const parsed = productReceivedRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        valid: false,
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    let config;
    try {
      config = loadProductReceivedConfig();
    } catch (error) {
      return res.status(503).json({
        valid: false,
        errors: [{ path: "configuration", message: error instanceof Error ? error.message : "Invalid configuration" }],
      });
    }

    const authorityErrors = validateOperationalAuthority(parsed.data, config);
    return res.status(authorityErrors.length === 0 ? 200 : 403).json({
      valid: authorityErrors.length === 0,
      schemaValid: true,
      operationalAuthorityValid: authorityErrors.length === 0,
      errors: authorityErrors,
      requestDigest: sha256Canonical(parsed.data),
    });
  });

  app.post("/api/qel/pilot/voi/product-received", async (req, res, next) => {
    try {
      const config = loadProductReceivedConfig();
      const readiness = getProductReceivedReadiness(config);
      if (!readiness.ready) {
        return res.status(503).json({
          accepted: false,
          reason: "Product Received ingestion is not ready",
          activation: readiness,
        });
      }

      const providedSecret = req.header("X-QEL-Ingest-Key") ?? "";
      if (!config.ingestApiKey || !constantTimeSecretMatches(providedSecret, config.ingestApiKey)) {
        return res.status(401).json({ accepted: false, reason: "Invalid ingest credentials" });
      }

      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 200) {
        return res.status(400).json({
          accepted: false,
          reason: "Idempotency-Key header must contain 8 to 200 characters",
        });
      }

      const parsed = productReceivedRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          accepted: false,
          reason: "Request validation failed",
          errors: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const authorityErrors = validateOperationalAuthority(parsed.data, config);
      if (authorityErrors.length > 0) {
        return res.status(403).json({
          accepted: false,
          reason: "Operational authority validation failed",
          errors: authorityErrors,
        });
      }

      const requestDigest = sha256Canonical(parsed.data);
      const existing = productReceivedSubmissions.get(idempotencyKey);
      if (existing) {
        if (existing.requestDigest !== requestDigest) {
          return res.status(409).json({
            accepted: false,
            reason: "Idempotency key was already used for a different request",
          });
        }
        return res.status(200).json({ accepted: true, ...existing.submission, replayed: true });
      }

      const expression = buildProductReceivedExpression(parsed.data);
      const expressionDigest = sha256Canonical(expression);
      const receipt = await requestRiverOsReceipt(expression, idempotencyKey, config);
      const submission: ProductReceivedSubmission = {
        expression,
        expressionDigest,
        receipt,
        replayed: false,
      };

      productReceivedSubmissions.set(idempotencyKey, { requestDigest, submission });
      return res.status(201).json({ accepted: true, ...submission });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
