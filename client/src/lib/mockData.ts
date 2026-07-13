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

export const mockEvents = [
  { id: "evt-001", time: "10:42:01.033", type: "HANDSHAKE", source: "Edge-Node-992", actor: "NODE-AGENT", level: "INFO", message: "TLS handshake initiated with Data Center US-East-1.", acknowledged: false },
  { id: "evt-002", time: "10:42:05.210", type: "AUTH", source: "QEL-Auth", actor: "ADMIN-01", level: "SUCCESS", message: "Identity token issued for tenant [T-ALPHA] via QEL-Auth.", acknowledged: false },
  { id: "evt-003", time: "10:42:12.887", type: "SCHEMA", source: "Schema-Registry", actor: "SCHEMA-DAEMON", level: "WARN", message: "Registry latency spike detected — response time 120ms, threshold 80ms.", acknowledged: false },
  { id: "evt-004", time: "10:43:00.004", type: "PROVISION", source: "License-Silo", actor: "ADMIN-01", level: "INFO", message: "License silo provisioning started for tenant [T-ALPHA].", acknowledged: true },
  { id: "evt-005", time: "10:43:45.999", type: "SYNC", source: "ERP-Connector", actor: "SYNC-BOT", level: "SUCCESS", message: "ERP backfill batch #4421 completed — 2,400 records ingested.", acknowledged: true },
  { id: "evt-006", time: "10:44:11.201", type: "POLICY", source: "Warden", actor: "WARDEN-AI", level: "INFO", message: "Governance policy v3.2.1 enforced on Arc [arc_8374].", acknowledged: false },
  { id: "evt-007", time: "10:44:55.003", type: "ALERT", source: "Edge-Node-004", actor: "NODE-AGENT", level: "ERROR", message: "Node [E-004] failed health-check. Auto-recovery sequence triggered.", acknowledged: false },
  { id: "evt-008", time: "10:45:30.600", type: "HANDSHAKE", source: "Edge-Node-005", actor: "NODE-AGENT", level: "INFO", message: "TLS handshake completed. Node [E-005] online.", acknowledged: false },
];

export const checklistSteps = [
  { id: 1, title: "Edge Registration", description: "Register edge nodes with QEL Identity Provider.", status: "completed" },
  { id: 2, title: "Schema Bootstrap", description: "Initialize schema registry and validate definitions.", status: "completed" },
  { id: 3, title: "License Silo", description: "Provision isolated license silos for compliant usage.", status: "in-progress" },
  { id: 4, title: "ERP Backfill", description: "Configure triggers for legacy ERP data synchronization.", status: "pending" },
  { id: 5, title: "Observability", description: "Verify telemetry pipelines and dashboard access.", status: "pending" },
  { id: 6, title: "Production Cutover", description: "Finalize economic fit and switch traffic.", status: "locked" },
];
