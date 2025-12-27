import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCalculatorData } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function Calculators() {
  const [nodes, setNodes] = useState([10]);
  const [throughput, setThroughput] = useState([50]);

  // Simple dynamic calculation for demo purposes
  const projectedData = mockCalculatorData.map(d => ({
    ...d,
    cost: d.cost + (nodes[0] * 100),
    savings: d.savings + (nodes[0] * 50) + (throughput[0] * 10)
  }));

  const totalSavings = projectedData.reduce((acc, curr) => acc + curr.savings, 0);
  const totalCost = projectedData.reduce((acc, curr) => acc + curr.cost, 0);
  const roi = ((totalSavings - totalCost) / totalCost) * 100;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">Economic Fit Calculator</h1>
        <p className="text-muted-foreground mt-1">Project ROI and resource consumption based on scale.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-primary/20">
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Edge Nodes</Label>
                  <span className="font-mono text-primary">{nodes[0]}</span>
                </div>
                <Slider 
                  value={nodes} 
                  onValueChange={setNodes} 
                  max={100} 
                  step={1}
                  className="[&_.range]:bg-primary"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Throughput (TB/mo)</Label>
                  <span className="font-mono text-primary">{throughput[0]}</span>
                </div>
                <Slider 
                  value={throughput} 
                  onValueChange={setThroughput} 
                  max={500} 
                  step={10}
                  className="[&_.range]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Projected 6-Month ROI</div>
              <div className="text-4xl font-mono font-bold text-primary">{roi.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle>Cost vs. Savings Projection</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Operational Cost" />
                <Line type="monotone" dataKey="savings" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Efficiency Savings" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
