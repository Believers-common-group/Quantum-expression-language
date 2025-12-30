import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { architectureExplainer } from "@/lib/architectureContent";
import { ArrowRight, Layers, ShieldCheck, Server, Activity, FileText, CheckCircle2 } from "lucide-react";

export default function ArchitectureExplainer() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 uppercase tracking-widest text-[10px]">
              System Architecture
            </Badge>
          </div>
          <h1 className="text-4xl font-bold font-sans tracking-tight text-foreground">
            {architectureExplainer.title}
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            {architectureExplainer.subtitle}
          </p>
        </div>

        <Separator className="bg-border/50" />

        {/* Section 1: Reality & Layers */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-accent" /> The Event-Driven Reality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {architectureExplainer.sections[0].content}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" /> Functional Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {architectureExplainer.sections[1].items?.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <div>
                    <span className="font-bold text-sm block text-foreground">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Section 2: The Gap */}
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Activity className="w-5 h-5" /> The Governance Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-foreground/90 font-medium leading-relaxed">
               {architectureExplainer.sections[2].content}
             </p>
          </CardContent>
        </Card>

        {/* Section 3: QEL Solution */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-px bg-border flex-1" />
             <h2 className="text-2xl font-bold text-primary">The QEL Semantic Overlay</h2>
             <div className="h-px bg-border flex-1" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {architectureExplainer.sections[3].primitives?.map((prim, i) => (
              <Card key={i} className="bg-primary/5 border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                   <span className="font-mono text-lg font-bold text-primary">{prim.name}</span>
                   <span className="text-xs text-muted-foreground">{prim.desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground max-w-2xl mx-auto italic">
            "{architectureExplainer.sections[3].content}"
          </p>
        </section>

        {/* Section 4: Comparison */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-mono text-muted-foreground uppercase">Before (Telemetry Only)</h3>
              <div className="font-mono text-sm bg-black/40 p-3 rounded border border-white/10 text-muted-foreground">
                Event → Service → Outcome → Logs
              </div>
              <p className="text-xs text-muted-foreground">High throughput, but accountability must be reconstructed from raw logs.</p>
            </div>
            
            <div className="p-6 space-y-4 bg-primary/5">
              <h3 className="text-sm font-mono text-primary uppercase">After (QEL Augmented)</h3>
              <div className="font-mono text-sm bg-black/40 p-3 rounded border border-primary/30 text-primary">
                Event → Service → Outcome<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;QEL Expression
              </div>
              <p className="text-xs text-foreground/80">Same throughput, but with attached authority, context, and intent.</p>
            </div>
          </div>
        </Card>

        {/* Section 5: Value & Phygital */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2 text-base">
                 <ShieldCheck className="w-4 h-4 text-primary" /> Enterprise Value
               </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {architectureExplainer.sections[4].benefits?.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
               <CardTitle className="flex items-center gap-2 text-base">
                 <FileText className="w-4 h-4 text-primary" /> Phygital Significance
               </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {architectureExplainer.sections[5].content}
              </p>
            </CardContent>
          </Card>
        </section>

      </div>
    </Layout>
  );
}
