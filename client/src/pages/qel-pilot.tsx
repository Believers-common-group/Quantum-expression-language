import Layout from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileCheck2, GitBranch, ShieldAlert, ShieldCheck } from "lucide-react";

interface ProductReceivedActivation {
  ready: boolean;
  enabled: boolean;
  missing: string[];
  warehouseNodeCount: number;
  licensedOperatorCount: number;
  configurationError: string | null;
}

interface QelStatus {
  language: string;
  specVersion: string;
  frozenSnapshot: string;
  validation: { implementation: string; commands: string[] };
  pilot: {
    liveActivation: {
      activeEvent: string;
      otherEventsEnabled: boolean;
      productReceived: ProductReceivedActivation;
    };
  };
}

interface QelExpression {
  id: string;
  type: string;
  status: string;
  subject: { id: string; type: string };
  transition?: { from: string | null; to: string };
  time: { occurred_at: string; issued_at: string };
  proof: Array<{ type: string; payload_digest: string }>;
}

interface PilotResponse {
  count: number;
  expressions: QelExpression[];
}

export default function QelPilot() {
  const statusQuery = useQuery<QelStatus>({ queryKey: ["/api/qel/status"] });
  const eventsQuery = useQuery<PilotResponse>({ queryKey: ["/api/qel/pilot/voi/events"] });
  const productReceived = statusQuery.data?.pilot.liveActivation.productReceived;

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
              <FileCheck2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">QEL v0.1 Pilot</h1>
              <p className="text-muted-foreground">Read-only status for the extracted specification, VOI fixtures, and controlled Product Received gate.</p>
            </div>
          </div>
        </header>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <div className="font-semibold">Claim boundary</div>
              <p className="text-sm text-muted-foreground">
                A valid expression is an integrity-protected claim. It is not automatically a true fact, legal determination, or accepted institutional outcome.
              </p>
            </div>
          </CardContent>
        </Card>

        {statusQuery.isLoading ? (
          <Card><CardContent className="p-6 text-muted-foreground">Loading QEL status…</CardContent></Card>
        ) : statusQuery.error || !statusQuery.data ? (
          <Card><CardContent className="p-6 text-destructive">QEL status endpoint is unavailable.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader><CardDescription>Specification</CardDescription><CardTitle>{statusQuery.data.specVersion}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{statusQuery.data.language}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardDescription>Frozen source</CardDescription><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="h-4 w-4" /> Snapshot preserved</CardTitle></CardHeader>
              <CardContent className="break-all font-mono text-xs text-muted-foreground">{statusQuery.data.frozenSnapshot}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardDescription>Reference core</CardDescription><CardTitle className="text-base">{statusQuery.data.validation.implementation}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {statusQuery.data.validation.commands.map((command) => <Badge key={command} variant="outline">{command}</Badge>)}
              </CardContent>
            </Card>
            <Card className={productReceived?.ready ? "border-emerald-500/40" : "border-amber-500/30"}>
              <CardHeader>
                <CardDescription>Live activation</CardDescription>
                <CardTitle className="flex items-center gap-2 text-base">
                  {productReceived?.ready ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
                  Product Received
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <Badge variant={productReceived?.ready ? "default" : "outline"}>{productReceived?.ready ? "READY" : "DISABLED / INCOMPLETE"}</Badge>
                <div>{productReceived?.warehouseNodeCount ?? 0} warehouse node(s)</div>
                <div>{productReceived?.licensedOperatorCount ?? 0} licensed operator(s)</div>
                {productReceived?.configurationError ? <div className="text-destructive">{productReceived.configurationError}</div> : null}
                {(productReceived?.missing ?? []).map((item) => <div key={item} className="font-mono">Missing: {item}</div>)}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>VOI five-event chain</CardTitle>
            <CardDescription>Canonical test fixtures served from `qel-spec/examples/voi`. Only Product Received has a controlled live admission path.</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading expressions…</p>
            ) : eventsQuery.error || !eventsQuery.data ? (
              <p className="text-sm text-destructive">Pilot expressions are unavailable.</p>
            ) : (
              <div className="space-y-3">
                {eventsQuery.data.expressions.map((expression, index) => (
                  <div key={expression.id} className="rounded-lg border border-border bg-secondary/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-xs text-primary">{index + 1}</div>
                        <div>
                          <div className="font-semibold">{expression.type}</div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">{expression.id}</div>
                        </div>
                      </div>
                      <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> {expression.status}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs md:grid-cols-4">
                      <div><span className="text-muted-foreground">Subject</span><div className="mt-1 break-all font-mono">{expression.subject.id}</div></div>
                      <div><span className="text-muted-foreground">Transition</span><div className="mt-1 font-mono">{expression.transition?.from ?? "∅"} → {expression.transition?.to ?? "—"}</div></div>
                      <div><span className="text-muted-foreground">Occurred</span><div className="mt-1 font-mono">{expression.time.occurred_at}</div></div>
                      <div><span className="text-muted-foreground">Digest</span><div className="mt-1 truncate font-mono" title={expression.proof[0]?.payload_digest}>{expression.proof[0]?.payload_digest}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
