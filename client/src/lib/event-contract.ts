export const EVENT_SEVERITIES = ["INFO", "SUCCESS", "WARN", "ERROR"] as const;
export type EventSeverity = (typeof EVENT_SEVERITIES)[number];

export const EVENT_STATES = [
  "observed",
  "acknowledged",
  "assigned",
  "escalated",
  "resolved",
  "rejected",
] as const;
export type EventState = (typeof EVENT_STATES)[number];

export const CONFIDENTIALITY_CLASSES = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] as const;
export type ConfidentialityClass = (typeof CONFIDENTIALITY_CLASSES)[number];

export type CanonicalEvent = {
  eventId: string;
  eventType: string;
  source: string;
  actor: string;
  severity: EventSeverity;
  message: string;
  occurredAt: string;
  receivedAt: string;
  correlationId: string;
  causationId?: string;
  evidenceRef?: string;
  confidentialityClass: ConfidentialityClass;
  state: EventState;
  simulated: true;
};

export type EventAcknowledgement = {
  acknowledgementId: string;
  eventId: string;
  actorId: string;
  acknowledgedAt: string;
  idempotencyKey: string;
  comment?: string;
  evidenceStatus: "prototype-local-only";
};

export type EventPermissions = {
  canViewConfidential: boolean;
  canAcknowledge: boolean;
  canBulkAcknowledge: boolean;
  canExport: boolean;
};

export const DEMO_ACTOR_ID = "digitalme:demo-operator";

export const DEMO_PERMISSIONS: EventPermissions = {
  canViewConfidential: true,
  canAcknowledge: true,
  canBulkAcknowledge: false,
  canExport: false,
};

type LegacyMockEvent = {
  id: string;
  time: string;
  type: string;
  source: string;
  actor: string;
  level: string;
  message: string;
  acknowledged: boolean;
};

const isSeverity = (value: string): value is EventSeverity =>
  EVENT_SEVERITIES.includes(value as EventSeverity);

export function normalizeMockEvent(event: LegacyMockEvent, receivedAt: string): CanonicalEvent {
  const occurredAt = `2026-07-31T${event.time}+05:30`;
  return {
    eventId: event.id,
    eventType: event.type,
    source: event.source,
    actor: event.actor,
    severity: isSeverity(event.level) ? event.level : "INFO",
    message: event.message,
    occurredAt,
    receivedAt,
    correlationId: `demo-correlation:${event.id}`,
    causationId: undefined,
    evidenceRef: undefined,
    confidentialityClass: "INTERNAL",
    state: event.acknowledged ? "acknowledged" : "observed",
    simulated: true,
  };
}

export interface AcknowledgementStore {
  list(): Promise<EventAcknowledgement[]>;
  acknowledge(input: Omit<EventAcknowledgement, "acknowledgementId" | "acknowledgedAt" | "evidenceStatus">): Promise<EventAcknowledgement>;
}

const STORAGE_KEY = "qel.prototype.event-acknowledgements.v1";

function safeParse(value: string | null): EventAcknowledgement[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as EventAcknowledgement[]) : [];
  } catch {
    return [];
  }
}

export class LocalPrototypeAcknowledgementStore implements AcknowledgementStore {
  async list(): Promise<EventAcknowledgement[]> {
    if (typeof window === "undefined") return [];
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  }

  async acknowledge(
    input: Omit<EventAcknowledgement, "acknowledgementId" | "acknowledgedAt" | "evidenceStatus">,
  ): Promise<EventAcknowledgement> {
    if (typeof window === "undefined") {
      throw new Error("Prototype acknowledgement persistence is available only in the browser.");
    }

    const current = await this.list();
    const existing = current.find((item) => item.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;

    const acknowledgement: EventAcknowledgement = {
      ...input,
      acknowledgementId: `prototype-ack:${input.idempotencyKey}`,
      acknowledgedAt: new Date().toISOString(),
      evidenceStatus: "prototype-local-only",
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, acknowledgement]));
    return acknowledgement;
  }
}

export function acknowledgementIdempotencyKey(eventId: string, actorId: string): string {
  return `${eventId}:${actorId}:ack-v1`;
}
