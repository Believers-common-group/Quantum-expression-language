import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockEvents } from "@/lib/mockData";
import {
  acknowledgementIdempotencyKey,
  DEMO_ACTOR_ID,
  DEMO_PERMISSIONS,
  LocalPrototypeAcknowledgementStore,
  normalizeMockEvent,
  type CanonicalEvent,
  type EventSeverity,
} from "@/lib/event-contract";
import { AlertTriangle, CheckCheck, Circle, Filter, Radio, RefreshCw, Search } from "lucide-react";

const LEVEL_STYLES: Record<EventSeverity | "DEFAULT", string> = {
  SUCCESS: "bg-green-500/10 text-green-400 border-green-500/20",
  WARN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  INFO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DEFAULT: "",
};

const TYPE_STYLES: Record<string, string> = {
  HANDSHAKE: "text-primary",
  AUTH: "text-accent",
  SCHEMA: "text-amber-400",
  PROVISION: "text-purple-400",
  SYNC: "text-green-400",
  POLICY: "text-cyan-400",
  ALERT: "text-red-400",
  DEFAULT: "text-foreground",
};

const store = new LocalPrototypeAcknowledgementStore();
const receivedAt = "2026-07-31T12:15:00+05:30";
const initialEvents = mockEvents.map((event) => normalizeMockEvent(event, receivedAt));

export default function EventCollector() {
  const [events, setEvents] = useState<CanonicalEvent[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<"ALL" | EventSeverity>("ALL");
  const [isDemoActive, setIsDemoActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const levels: Array<"ALL" | EventSeverity> = ["ALL", "INFO", "SUCCESS", "WARN", "ERROR"];

  useEffect(() => {
    let cancelled = false;

    void store
      .list()
      .then((acknowledgements) => {
        if (cancelled) return;
        const acknowledgedIds = new Set(
          acknowledgements
            .filter((ack) => ack.actorId === DEMO_ACTOR_ID)
            .map((ack) => ack.eventId),
        );
        setEvents((current) =>
          current.map((event) =>
            acknowledgedIds.has(event.eventId) ? { ...event, state: "acknowledged" } : event,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPersistenceError("Prototype acknowledgement state could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          DEMO_PERMISSIONS.canViewConfidential ||
          event.confidentialityClass === "PUBLIC" ||
          event.confidentialityClass === "INTERNAL",
      ),
    [events],
  );

  const filtered = visibleEvents.filter((event) => {
    const matchLevel = filterLevel === "ALL" || event.severity === filterLevel;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      event.message.toLowerCase().includes(q) ||
      event.source.toLowerCase().includes(q) ||
      event.eventType.toLowerCase().includes(q) ||
      event.actor.toLowerCase().includes(q) ||
      event.correlationId.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  });

  const unacknowledged = visibleEvents.filter((event) => event.state === "observed").length;

  const acknowledgeOne = async (eventId: string) => {
    if (!DEMO_PERMISSIONS.canAcknowledge) {
      setPersistenceError("The current demo role cannot acknowledge events.");
      return;
    }

    setPersistenceError(null);
    try {
      await store.acknowledge({
        eventId,
        actorId: DEMO_ACTOR_ID,
        idempotencyKey: acknowledgementIdempotencyKey(eventId, DEMO_ACTOR_ID),
        comment: "Observed in the QEL Event Collector prototype.",
      });
      setEvents((current) =>
        current.map((event) =>
          event.eventId === eventId ? { ...event, state: "acknowledged" } : event,
        ),
      );
    } catch {
      setPersistenceError("Acknowledgement was not persisted. The event remains unresolved.");
    }
  };

  const acknowledgeAll = async () => {
    if (!DEMO_PERMISSIONS.canBulkAcknowledge) {
      setPersistenceError("Bulk acknowledgement requires an elevated permission and confirmation.");
      return;
    }

    const confirmed = window.confirm(
      "Acknowledge all observed prototype events? This records observation only and does not resolve or approve them.",
    );
    if (!confirmed) return;

    for (const event of visibleEvents.filter((item) => item.state === "observed")) {
      await acknowledgeOne(event.eventId);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200" role="status">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> SIMULATED DATA — NON-PRODUCTION PROTOTYPE
          </div>
          <p className="mt-1 text-xs text-amber-100/80">
            Events and acknowledgements remain inside this browser. An acknowledgement records observation only; it is not resolution, approval, suppression, Warden permission or RiverOS evidence.
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Radio className="h-7 w-7 text-primary" /> Event Collector Prototype
            </h1>
            <p className="mt-1 text-muted-foreground">
              Filterable demonstration of canonical event presentation and actor-bound acknowledgement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unacknowledged > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary"
                onClick={() => void acknowledgeAll()}
                disabled={!DEMO_PERMISSIONS.canBulkAcknowledge || isLoading}
                title="Bulk acknowledgement requires an elevated prototype permission."
              >
                <CheckCheck className="h-4 w-4" /> Acknowledge All ({unacknowledged})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              aria-pressed={isDemoActive}
              onClick={() => setIsDemoActive((value) => !value)}
              className={`gap-2 ${isDemoActive ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-border text-muted-foreground"}`}
            >
              {isDemoActive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" /> DEMO ACTIVE
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> DEMO PAUSED
                </>
              )}
            </Button>
          </div>
        </div>

        {persistenceError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300" role="alert">
            {persistenceError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Events", value: visibleEvents.length, color: "text-foreground" },
            { label: "Observed", value: unacknowledged, color: "text-amber-400" },
            { label: "Errors", value: visibleEvents.filter((event) => event.severity === "ERROR").length, color: "text-red-400" },
            { label: "Sources", value: new Set(visibleEvents.map((event) => event.source)).size, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card/50">
              <CardContent className="p-4">
                <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                <div className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search events"
              placeholder="Search message, source, actor, type or correlation ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-border bg-secondary/30 pl-10 focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2" aria-label="Severity filters">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {levels.map((level) => (
              <Button
                key={level}
                variant={filterLevel === level ? "default" : "outline"}
                size="sm"
                aria-pressed={filterLevel === level}
                onClick={() => setFilterLevel(level)}
                className={`font-mono text-xs ${filterLevel === level ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border bg-muted/10">
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-muted-foreground">
              <span>Simulated Event Stream</span>
              <span className="ml-auto text-xs text-muted-foreground/60">
                {filtered.length} of {visibleEvents.length} events
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground" role="status">
                  Loading prototype acknowledgement state…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm italic text-muted-foreground/50">
                  No simulated events match the current filters.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((event) => (
                    <article
                      key={event.eventId}
                      className={`flex items-start gap-4 p-4 transition-colors hover:bg-white/5 ${event.state === "observed" ? "border-l-2 border-primary/60" : "border-l-2 border-transparent"}`}
                    >
                      <Circle
                        aria-hidden="true"
                        className={`mt-1 h-2.5 w-2.5 fill-current ${event.state === "observed" ? "text-primary" : "text-muted-foreground/30"}`}
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <time className="whitespace-nowrap font-mono text-xs text-muted-foreground" dateTime={event.occurredAt}>
                            {event.occurredAt.slice(11, 23)}
                          </time>
                          <Badge variant="outline" className={`px-1.5 font-mono text-[10px] ${LEVEL_STYLES[event.severity] ?? LEVEL_STYLES.DEFAULT}`}>
                            {event.severity}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {event.state.toUpperCase()}
                          </Badge>
                          <span className={`font-mono text-xs font-bold ${TYPE_STYLES[event.eventType] ?? TYPE_STYLES.DEFAULT}`}>
                            [{event.eventType}]
                          </span>
                          <span className="truncate text-xs text-muted-foreground/70">{event.source}</span>
                          <span className="text-[10px] text-muted-foreground/50">via {event.actor}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{event.message}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground/50">
                          <span>correlation: {event.correlationId}</span>
                          <span>class: {event.confidentialityClass}</span>
                          <span>received: {event.receivedAt}</span>
                        </div>
                      </div>

                      {event.state === "observed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs text-muted-foreground hover:text-primary"
                          disabled={!DEMO_PERMISSIONS.canAcknowledge}
                          onClick={() => void acknowledgeOne(event.eventId)}
                          aria-label={`Acknowledge observation of ${event.eventId}`}
                        >
                          ACK OBSERVATION
                        </Button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
