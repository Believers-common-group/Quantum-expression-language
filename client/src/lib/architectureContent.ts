export const architectureExplainer = {
  title: "Event-Driven Governance: DevOps to QEL",
  subtitle: "Bridging the gap between high-throughput execution and institutional accountability.",
  sections: [
    {
      heading: "The Event-Driven Reality",
      content: "Modern systems are distributed execution fabrics characterized by asynchronous action, decoupled services, and continuous observation. This architecture excels at speed and scale but lacks inherent governance."
    },
    {
      heading: "Functional Layers",
      items: [
        { title: "Event Producers", desc: "Users, devices, sensors. They initiate activity but do not define authority." },
        { title: "Transport Layer", desc: "Queues, buses, streams. They guarantee delivery but move facts, not meaning." },
        { title: "Compute Layer", desc: "Microservices, serverless. They execute logic but cannot explain why a decision was allowed." },
        { title: "Observability Layer", desc: "Logs, metrics, traces. They tell you what happened, not whether it should have happened." }
      ]
    },
    {
      heading: "The Governance Gap",
      content: "Traditional observability answers operational questions (Did it run? Was it fast?). It fails to answer governance questions: Who had authority? Under which license? In what jurisdiction? Who is accountable?"
    },
    {
      heading: "The QEL Solution: Semantic Overlay",
      content: "QEL does not replace event buses or slow down execution. It sits as a semantic overlay. Each significant event emits two artifacts: the operational event (for the system) and the QEL expression (for the institution).",
      primitives: [
        { name: "Actor", desc: "Role/system that initiated action" },
        { name: "Authority", desc: "License/policy permitting action" },
        { name: "Context", desc: "Time, place, constraints" },
        { name: "Intent", desc: "What was intended vs executed" },
        { name: "Evidence", desc: "Links to telemetry (proof)" }
      ]
    },
    {
      heading: "Architectural Upgrade",
      comparison: {
        before: "Event → Service → Outcome → Logs",
        after: "Event → Service → Outcome ↓ QEL Expression"
      },
      benefits: [
        "Audit-ready execution history",
        "Regulatory defensibility",
        "Cross-team clarity (Ops/Legal)",
        "Vendor neutrality",
        "Court-grade evidence"
      ]
    },
    {
      heading: "Phygital Significance",
      content: "In phygital systems (transport, energy), digital events cause physical consequences. QEL ensures these systems remain systems of service, not unchecked power, by making legitimacy explicit."
    }
  ]
};
