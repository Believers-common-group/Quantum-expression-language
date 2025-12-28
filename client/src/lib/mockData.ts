import { Zap, Server, Shield, Database, Activity, DollarSign, CheckCircle, AlertTriangle, Box } from "lucide-react";

export const mockStats = [
  { label: "Active Nodes", value: "843", change: "+12%", icon: Server, color: "text-primary" },
  { label: "Schema Registry", value: "Syncd", change: "98ms", icon: Database, color: "text-accent" },
  { label: "License Silos", value: "Active", change: "12/12", icon: Shield, color: "text-green-500" },
  { label: "QEL Throughput", value: "4.2TB", change: "+8.1%", icon: Zap, color: "text-primary" },
];

export const mockLogs = [
  { id: 1, time: "10:42:01", level: "INFO", message: "Edge node [E-992] registration handshake initiated." },
  { id: 2, time: "10:42:05", level: "SUCCESS", message: "Edge node [E-992] identity verified via QEL-Auth." },
  { id: 3, time: "10:42:12", level: "WARN", message: "Schema registry latency spike detected (120ms)." },
  { id: 4, time: "10:43:00", level: "INFO", message: "License silo provisioning for tenant [T-ALPHA] started." },
  { id: 5, time: "10:43:45", level: "SUCCESS", message: "ERP Backfill trigger executed for batch #4421." },
];

export const mockMoments = [
  { 
    id: "m-1", 
    title: "Edge Node Handshake", 
    duration: "00:12", 
    timestamp: "10:42:01", 
    thumbnail: "bg-primary/20", 
    type: "security" 
  },
  { 
    id: "m-2", 
    title: "Schema Validation Spike", 
    duration: "00:08", 
    timestamp: "10:42:12", 
    thumbnail: "bg-amber-500/20", 
    type: "alert" 
  },
  { 
    id: "m-3", 
    title: "ERP Sync Completion", 
    duration: "00:15", 
    timestamp: "10:43:45", 
    thumbnail: "bg-green-500/20", 
    type: "success" 
  }
];

export const mockObservabilityData = [
  { time: "00:00", latency: 20, throughput: 400 },
  { time: "04:00", latency: 25, throughput: 300 },
  { time: "08:00", latency: 45, throughput: 800 },
  { time: "12:00", latency: 80, throughput: 1200 },
  { time: "16:00", latency: 50, throughput: 900 },
  { time: "20:00", latency: 30, throughput: 600 },
  { time: "23:59", latency: 22, throughput: 450 },
];

export const mockCalculatorData = [
  { name: "Month 1", cost: 4000, savings: 1000 },
  { name: "Month 2", cost: 4200, savings: 2500 },
  { name: "Month 3", cost: 4300, savings: 4800 },
  { name: "Month 4", cost: 4400, savings: 8000 },
  { name: "Month 5", cost: 4500, savings: 12000 },
  { name: "Month 6", cost: 4600, savings: 18000 },
];

export const checklistSteps = [
  { id: 1, title: "Edge Registration", description: "Register edge nodes with QEL Identity Provider.", status: "completed" },
  { id: 2, title: "Schema Bootstrap", description: "Initialize schema registry and validate definitions.", status: "completed" },
  { id: 3, title: "License Silo", description: "Provision isolated license silos for compliant usage.", status: "in-progress" },
  { id: 4, title: "ERP Backfill", description: "Configure triggers for legacy ERP data synchronization.", status: "pending" },
  { id: 5, title: "Observability", description: "Verify telemetry pipelines and dashboard access.", status: "pending" },
  { id: 6, title: "Production Cutover", description: "Finalize economic fit and switch traffic.", status: "locked" },
];
