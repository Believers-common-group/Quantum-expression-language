import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { qelCore, qelThesis, qelArchitecture, qelUseCases } from "@/lib/qelContent";
import { BookOpen, Scale, Network, FileText, Shield, ArrowRight, Layers } from "lucide-react";

export default function Reference() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">QEL Reference</h1>
        <p className="text-muted-foreground mt-1">Canonical specifications, governance doctrines, and architectural standards.</p>
      </div>

      <Tabs defaultValue="core" className="w-full space-y-6">
        <TabsList className="bg-card border border-primary/20 p-1 w-full justify-start h-auto flex-wrap">
          <TabsTrigger value="core" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="w-4 h-4" /> Core Primer
          </TabsTrigger>
          <TabsTrigger value="thesis" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Scale className="w-4 h-4" /> Thesis & Alignment
          </TabsTrigger>
          <TabsTrigger value="architecture" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Network className="w-4 h-4" /> Architecture
          </TabsTrigger>
          <TabsTrigger value="usecases" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4" /> Use Cases
          </TabsTrigger>
        </TabsList>

        {/* CORE PRIMER CONTENT */}
        <TabsContent value="core" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{qelCore.title}</CardTitle>
              <CardDescription className="text-lg font-medium text-foreground/80">{qelCore.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-secondary/20 rounded border-l-4 border-primary">
                <p className="font-mono text-sm leading-relaxed">{qelCore.definition}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" /> Core Principles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {qelCore.principles.map((p, i) => (
                    <Card key={i} className="bg-secondary/10 border-white/5">
                      <CardContent className="p-4">
                        <div className="font-bold text-sm mb-2 text-primary">{p.title}</div>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Semantic Primitives</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/30 text-left">
                      <tr>
                        <th className="p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Primitive</th>
                        <th className="p-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Meaning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {qelCore.primitives.map((p, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono text-accent">{p.name}</td>
                          <td className="p-3 text-muted-foreground">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THESIS CONTENT */}
        <TabsContent value="thesis" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader>
                <CardTitle>Constitutional Cyber Governance</CardTitle>
                <CardDescription>{qelThesis.constitutional.premise}</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {qelThesis.constitutional.mapping.map((m, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 rounded bg-secondary/20 hover:bg-secondary/30 transition-colors">
                        <div className="min-w-[140px] font-bold text-sm text-primary">{m.principle}</div>
                        <div className="text-sm text-muted-foreground">→ {m.qel}</div>
                      </div>
                    ))}
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-primary/10 to-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">The Alignment Chain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {qelThesis.alignmentChain.map((stage, i) => (
                  <div key={i} className="relative pl-6 pb-4 border-l border-primary/20 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="text-xs font-mono text-primary mb-1">{stage.stage}</div>
                    <div className="text-xs font-bold">{stage.responsibility}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{stage.criteria}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ARCHITECTURE CONTENT */}
        <TabsContent value="architecture" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <Card className="bg-card border-border">
             <CardHeader>
                <CardTitle>Canonical Institutional Stack</CardTitle>
                <CardDescription>QEL spans Levels 2–8, ensuring observability without replacing reality.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-1">
                 {qelArchitecture.layers.map((layer) => (
                   <div key={layer.level} className="flex items-center gap-4 p-2 rounded hover:bg-white/5 transition-colors">
                      <div className="font-mono text-xs text-muted-foreground w-12">Lvl {layer.level}</div>
                      <div className="font-bold text-sm text-foreground">{layer.name}</div>
                      <div className="text-xs text-accent ml-auto border border-accent/20 px-2 py-0.5 rounded">{layer.role}</div>
                   </div>
                 ))}
               </div>
             </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-border">
            <CardHeader>
              <CardTitle>Phygital Transport Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">{qelArchitecture.phygital.definition}</p>
               <div className="p-4 bg-black/40 rounded border border-white/10 font-mono text-xs text-primary">
                 {qelArchitecture.phygital.role}
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USE CASES */}
        <TabsContent value="usecases" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {qelUseCases.map((usecase, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/50 transition-colors group">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{usecase.title}</CardTitle>
                  <CardDescription className="text-xs">{usecase.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {usecase.points.map((point, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-border">
                     <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-primary/10 hover:text-primary">
                       Read Implementation Brief <ArrowRight className="w-3 h-3 ml-2" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </Layout>
  );
}
