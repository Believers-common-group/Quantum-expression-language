export const qelCore = {
  title: "Quantum Expression Language",
  subtitle: "A neutral, versioned language for expressing verifiable events with authority, consent, evidence, and provenance.",
  definition: "Quantum Expression Language (QEL) is a formal, neutral, and auditable language for expressing observations, actions, and attestations that carry economic, legal, governance, or ethical significance.",
  principles: [
    { title: "Neutrality", desc: "No vendor, platform, or implementer can redefine QEL’s core meaning." },
    { title: "Backward Interpretability", desc: "Expressions must remain parseable and semantically interpretable decades later." },
    { title: "Authority & Consent First", desc: "No expression involving people/rights is valid without explicit authority." },
    { title: "Additive Evolution", desc: "The language evolves by addition, not redefinition." },
    { title: "Auditability by Construction", desc: "Every expression carries lineage, provenance, and evidence hooks." }
  ],
  primitives: [
    { name: "actor", desc: "Who is acting or asserting" },
    { name: "object", desc: "What is being acted upon or described" },
    { name: "place", desc: "Where the observation or action applies" },
    { name: "time", desc: "When it was observed or issued" },
    { name: "authority", desc: "Under what right, license, or mandate" },
    { name: "consent", desc: "Who consented, to what scope, or absence thereof" },
    { name: "evidence", desc: "Proof artifacts, hashes, references" },
    { name: "provenance", desc: "Lineage to prior state or expression" },
    { name: "signatures", desc: "Cryptographic attestations" }
  ]
};

export const qelThesis = {
  abstract: "Modern intelligence systems operate at scale, speed, and opacity that exceed the capacity of existing governance frameworks. QEL provides the missing semantic foundation required to make intelligence governable—without centralization, without coercion, and without sacrificing future adaptability.",
  alignmentChain: [
    { stage: "Perception", responsibility: "Model Scientists", criteria: "Tokenization must preserve canonical entities." },
    { stage: "Pre-Training", responsibility: "Research Ops", criteria: "Data lineage documented; artifacts labeled non-authoritative." },
    { stage: "Fine-Tuning", responsibility: "ML Engineers", criteria: "Task-specific evaluations; no direct granting of authority." },
    { stage: "Preference", responsibility: "Designers", criteria: "Preference models marked as advisory." },
    { stage: "Evaluation", responsibility: "QA & Auditors", criteria: "Benchmarks include robustness and interpretability." }
  ],
  constitutional: {
    title: "Constitutional Cyber Governance",
    premise: "Ensuring that the exercise of power in digital systems remains subject to constitutional principles: Legality, Authority, Jurisdiction, Due Process, Accountability, Reviewability, and Continuity.",
    mapping: [
      { principle: "Rule of Law", qel: "Authority primitive; explicit statutory basis." },
      { principle: "Separation of Powers", qel: "Records execution; does not decide legality." },
      { principle: "Due Process", qel: "Expression chains preserve reasoning; context records constraints." },
      { principle: "Jurisdiction", qel: "Place + Network Context; authority scope explicit." }
    ]
  }
};

export const qelArchitecture = {
  layers: [
    { level: 8, name: "Constitutional / Judicial Review", role: "Institutional Reality" },
    { level: 7, name: "Statutory & Regulatory Frameworks", role: "Legal Basis" },
    { level: 6, name: "Bureaucratic Machinery", role: "IAS-style Administration" },
    { level: 5, name: "Control & Enforcement", role: "License Logic" },
    { level: 4, name: "Records, Files & Registries", role: "Persistence" },
    { level: 3, name: "Process, Workflow & Coordination", role: "Orchestration" },
    { level: 2, name: "Telemetry, Inspection & Reporting", role: "Observability" },
    { level: 1, name: "Human & Device Execution", role: "Reality" }
  ],
  phygital: {
    definition: "A phygital transport system is a continuously coupled physical–digital system where physical assets are sensed, controlled, and optimized by digital intelligence under institutional authority.",
    role: "QEL functions as a foundational systems layer for the design, control, and distribution of phygital transport systems."
  }
};

export const qelUseCases = [
  {
    title: "NCLT Restructuring",
    desc: "A QEL-Based Licensing framework for NCLT Restructuring and Corporate Rehabilitation.",
    points: [
      "Authority fragmented across RP, CoC, auditors",
      "Decisions spread across filings/emails",
      "QRL (QEL Restructuring License) as authority envelope"
    ]
  },
  {
    title: "Textile SCM Automation",
    desc: "Soil → Shelf Observability-First Automation.",
    points: [
      "Automation executes, QEL observes",
      "Authority remains human/licensed",
      "Every automated action validates authority first"
    ]
  },
  {
    title: "Bureaucratic Governance",
    desc: "IAS-Style Administrative System Integration.",
    points: [
      "Files as QEL Expression Chains",
      "Authority without Identity Capture",
      "Contextual Discretion Recording"
    ]
  }
];
