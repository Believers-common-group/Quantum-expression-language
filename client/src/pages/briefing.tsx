import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { briefingContent } from "@/lib/briefingContent";
import { Code, Terminal, Server, FileJson, Copy, Check } from "lucide-react";
import { useState } from "react";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-sm overflow-x-auto">
       <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-white" onClick={onCopy}>
         {copied ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
       </Button>
       <pre>{code}</pre>
    </div>
  );
}

export default function Briefing() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="space-y-4">
           <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5">CONFIDENTIAL // ENGINEERING EYES ONLY</Badge>
           <h1 className="text-4xl font-bold font-sans">{briefingContent.title}</h1>
           <p className="text-xl text-muted-foreground">{briefingContent.subtitle}</p>
        </div>

        {/* Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" /> Platform Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="leading-relaxed">{briefingContent.overview}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {briefingContent.deploymentModel.steps.map((step) => (
                 <div key={step.step} className="p-4 bg-secondary/10 rounded-lg border border-border">
                    <div className="text-xs font-mono text-primary mb-1">STEP 0{step.step}</div>
                    <div className="font-bold text-foreground mb-1">{step.action}</div>
                    <div className="text-sm text-muted-foreground">{step.desc}</div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* API Spec */}
        <div className="space-y-4">
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <Terminal className="w-6 h-6" /> API Endpoints
           </h2>
           <div className="space-y-4">
             {briefingContent.apiEndpoints.map((ep, i) => (
               <Card key={i} className="bg-card/50 border-border overflow-hidden">
                 <div className="flex flex-col md:flex-row border-b border-border">
                    <div className={`p-4 font-mono font-bold w-24 flex items-center justify-center border-b md:border-b-0 md:border-r border-border ${ep.method === 'POST' ? 'text-green-400 bg-green-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                      {ep.method}
                    </div>
                    <div className="p-4 font-mono text-sm flex-1 flex items-center bg-black/20 text-foreground/80">
                      {ep.path}
                    </div>
                 </div>
                 <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{ep.summary}</h3>
                      <p className="text-sm text-muted-foreground">{ep.desc}</p>
                    </div>
                    {ep.payload && (
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-muted-foreground uppercase">Payload / Response</div>
                        <CodeBlock code={ep.payload} />
                      </div>
                    )}
                 </CardContent>
               </Card>
             ))}
           </div>
        </div>
        
        {/* AI Prompt */}
        <Card className="bg-primary/5 border-primary/20">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-primary">
               <FileJson className="w-5 h-5" /> AI / Dev Team Briefing Prompt
             </CardTitle>
             <CardDescription>Copy this prompt to instruct your team or LLM agents on how to build against this spec.</CardDescription>
           </CardHeader>
           <CardContent>
              <CodeBlock code={briefingContent.aiPrompt.content} />
           </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
