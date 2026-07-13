import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockEvents } from "@/lib/mockData";
import { Radio, Search, Filter, CheckCheck, RefreshCw, Circle } from "lucide-react";

type EventEntry = {
  id: string;
  time: string;
  type: string;
  source: string;
  actor: string;
  level: string;
  message: string;
  acknowledged: boolean;
};

const LEVEL_STYLES: Record<string, string> = {
  SUCCESS: "bg-green-500/10 text-green-400 border-green-500/20",
  WARN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  INFO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const TYPE_STYLES: Record<string, string> = {
  HANDSHAKE: "text-primary",
  AUTH: "text-accent",
  SCHEMA: "text-amber-400",
  PROVISION: "text-purple-400",
  SYNC: "text-green-400",
  POLICY: "text-cyan-400",
  ALERT: "text-red-400",
};

export default function EventCollector() {
  const [events, setEvents] = useState<EventEntry[]>([...mockEvents]);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [isLive, setIsLive] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);

  const levels = ["ALL", "INFO", "SUCCESS", "WARN", "ERROR"];

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setPulseCount((n) => n + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [isLive]);

  const filtered = events.filter((e) => {
    const matchLevel = filterLevel === "ALL" || e.level === filterLevel;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.message.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  });

  const unacknowledged = events.filter((e) => !e.acknowledged).length;

  const acknowledgeAll = () => {
    setEvents((prev) => prev.map((e) => ({ ...e, acknowledged: true })));
  };

  const acknowledgeOne = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e))
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold font-sans tracking-tight flex items-center gap-3">
              <Radio className="w-7 h-7 text-primary" />
              Event Collector
            </h1>
            <p className="text-muted-foreground mt-1">
              Centralized stream of all system events, signals, and governance actions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unacknowledged > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary"
                onClick={acknowledgeAll}
              >
                <CheckCheck className="w-4 h-4" /> Acknowledge All ({unacknowledged})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive((v) => !v)}
              className={`gap-2 ${isLive ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-border text-muted-foreground"}`}
            >
              {isLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  PAUSED
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: events.length, color: "text-foreground" },
            { label: "Unacknowledged", value: unacknowledged, color: "text-amber-400" },
            { label: "Errors", value: events.filter((e) => e.level === "ERROR").length, color: "text-red-400" },
            { label: "Sources", value: new Set(events.map((e) => e.source)).size, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events by message, source, actor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/30 border-border focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {levels.map((lvl) => (
              <Button
                key={lvl}
                variant={filterLevel === lvl ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLevel(lvl)}
                className={`font-mono text-xs ${filterLevel === lvl ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {lvl}
              </Button>
            ))}
          </div>
        </div>

        {/* Event Stream */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border bg-muted/10">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span>Event Stream</span>
              <span className="ml-auto text-xs text-muted-foreground/60">{filtered.length} of {events.length} events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground/50 text-sm italic">
                  No events match the current filters.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 p-4 transition-colors hover:bg-white/5 ${!event.acknowledged ? "border-l-2 border-primary/60" : "border-l-2 border-transparent"}`}
                    >
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <Circle
                          className={`w-2.5 h-2.5 fill-current ${!event.acknowledged ? "text-primary" : "text-muted-foreground/30"}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{event.time}</span>
                          <Badge variant="outline" className={`font-mono text-[10px] px-1.5 ${LEVEL_STYLES[event.level] ?? ""}`}>
                            {event.level}
                          </Badge>
                          <span className={`font-mono text-xs font-bold ${TYPE_STYLES[event.type] ?? "text-foreground"}`}>
                            [{event.type}]
                          </span>
                          <span className="text-xs text-muted-foreground/70 truncate">{event.source}</span>
                          <span className="text-[10px] text-muted-foreground/50">via {event.actor}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{event.message}</p>
                      </div>

                      {!event.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-primary shrink-0"
                          onClick={() => acknowledgeOne(event.id)}
                        >
                          ACK
                        </Button>
                      )}
                    </div>
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
