import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockObservabilityData } from "@/lib/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Observability() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans tracking-tight">Observability Status</h1>
        <p className="text-muted-foreground mt-1">Real-time telemetry and network performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase text-primary/80 tracking-widest">Network Latency (ms)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockObservabilityData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="latency" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-accent/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase text-accent/80 tracking-widest">Throughput (MB/s)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockObservabilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--accent)/0.1)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                  itemStyle={{ color: 'hsl(var(--accent))' }}
                />
                <Bar dataKey="throughput" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Uptime", value: "99.99%", status: "healthy" },
          { label: "Error Rate", value: "0.02%", status: "healthy" },
          { label: "Active Connections", value: "1,240", status: "warning" },
        ].map((metric, i) => (
          <Card key={i} className="bg-secondary/20 border-border">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">{metric.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono font-bold">{metric.value}</div>
                <div className={`h-2 w-2 rounded-full ${
                  metric.status === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
