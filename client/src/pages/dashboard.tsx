import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockStats, mockLogs } from "@/lib/mockData";
import { Activity, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground mt-1">System status overview and operational metrics.</p>
        </div>
        <Link href="/wizard">
          <Button className="bg-primary text-primary-foreground font-mono hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-shadow">
            + NEW DEPLOYMENT
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, i) => (
          <Card key={i} className="bg-card border-primary/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-primary mr-1">{stat.change}</span> from last epoch
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-2 bg-card border-border h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live System Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              {mockLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 rounded bg-secondary/30 border-l-2 border-primary/50 hover:bg-secondary/50 transition-colors">
                  <span className="text-muted-foreground whitespace-nowrap">{log.time}</span>
                  <span className={`font-bold ${
                    log.level === 'SUCCESS' ? 'text-green-400' : 
                    log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'
                  }`}>{log.level}</span>
                  <span className="text-foreground/90">{log.message}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                VIEW ALL LOGS <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-primary/10 to-card border-primary/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
              Restart Edge Nodes
            </Button>
            <Button variant="outline" className="w-full justify-start border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
              Flush Schema Cache
            </Button>
            <Button variant="outline" className="w-full justify-start border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
              Download Audit Report
            </Button>
            <Button variant="outline" className="w-full justify-start border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
              Manage API Keys
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
