import { useState } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Box, Cuboid, Workflow, ArrowRight, Settings2, Code, Terminal, Save } from "lucide-react";

export default function Workspace() {
  const [arcs, setArcs] = useState([
    { id: 1, name: "NCLT Restructuring Flow", status: "Active", actors: 4, rules: 12 },
    { id: 2, name: "Textile SCM Logistics", status: "Draft", actors: 18, rules: 5 },
    { id: 3, name: "Data Center Access Control", status: "Testing", actors: 2, rules: 99 }
  ]);

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-sans tracking-tight">Workspace</h1>
            <p className="text-muted-foreground">Build, configure, and deploy your Governance Arcs.</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Arc
          </Button>
        </div>

        <Tabs defaultValue="arcs" className="w-full">
          <TabsList className="bg-card border border-primary/20">
            <TabsTrigger value="arcs" className="gap-2"><Cuboid className="w-4 h-4"/> My Arcs</TabsTrigger>
            <TabsTrigger value="definitions" className="gap-2"><Settings2 className="w-4 h-4"/> Actor Definitions</TabsTrigger>
            <TabsTrigger value="deploy" className="gap-2"><Box className="w-4 h-4"/> Deployments</TabsTrigger>
          </TabsList>

          <TabsContent value="arcs" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arcs.map((arc) => (
                <Card key={arc.id} className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                        <Workflow className="w-5 h-5 text-primary" />
                      </div>
                      <Badge variant={arc.status === "Active" ? "default" : "outline"} className={arc.status === "Active" ? "bg-primary text-primary-foreground" : ""}>
                        {arc.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg">{arc.name}</CardTitle>
                    <CardDescription>ID: arc_{arc.id * 8374}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><Terminal className="w-3 h-3"/> {arc.actors} Actors</span>
                      <span className="flex items-center gap-1"><Code className="w-3 h-3"/> {arc.rules} Rules</span>
                    </div>
                    <Button variant="ghost" className="w-full mt-4 border border-border group-hover:border-primary/30">
                      Open Builder <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-transparent border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center p-6 cursor-pointer text-muted-foreground hover:text-primary transition-colors h-[220px]">
                <Plus className="w-8 h-8 mb-2" />
                <span className="font-medium">Create New Arc</span>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="definitions">
             <Card>
                <CardHeader>
                   <CardTitle>Global Actor Definitions</CardTitle>
                   <CardDescription>Define the entities (Human or Machine) that can sign QEL expressions across all Arcs.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center border-t border-border bg-black/20">
                   <p className="text-muted-foreground">Select an Arc to edit local definitions, or configure global defaults here.</p>
                </CardContent>
             </Card>
          </TabsContent>
          
           <TabsContent value="deploy">
             <Card>
                <CardHeader>
                   <CardTitle>Active Deployments</CardTitle>
                   <CardDescription>Manage your Data Center and Edge Warden instances.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/10">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                         <div>
                            <div className="font-bold">US-East-1 Data Center</div>
                            <div className="text-xs text-muted-foreground">v2.4.1 • 99.99% Uptime</div>
                         </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                   </div>
                   <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/10">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]" />
                         <div>
                            <div className="font-bold">Edge-Fleet-Logistics</div>
                            <div className="text-xs text-muted-foreground">v2.3.9 • Updating...</div>
                         </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
