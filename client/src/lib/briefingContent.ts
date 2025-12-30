export const briefingContent = {
  title: "QEL Platform Briefing & API Spec",
  subtitle: "Technical directives for Engineering Teams & AI Agents building QEL-compliant systems.",
  overview: "This platform serves as the Governance Control Plane. It does not replace your existing message buses (Kafka, RabbitMQ) or compute layers (K8s, Lambda). Instead, it acts as a sidecar authority that validates, records, and signs actions.",
  
  deploymentModel: {
    title: "Hybrid Data Center / Edge Deployment",
    steps: [
      { step: 1, action: "Deploy QEL Sidecars", desc: "Deploy the QEL Agent (The Warden) alongside your existing services in your Data Center." },
      { step: 2, action: "Connect Telemetry", desc: "Pipe OpenTelemetry traces to the QEL Ingestion Endpoint." },
      { step: 3, action: "Define Arcs", desc: "Use this Workspace to define 'Arcs' (Governance Workflows) that map to your business processes." },
      { step: 4, action: "Generate Client Libs", desc: "Download the generated SDKs for your specific Arcs to enforce rules at compile time." }
    ]
  },

  apiEndpoints: [
    {
      method: "POST",
      path: "/v1/govern/event",
      summary: "Submit an Event for Governance",
      desc: "The primary entry point. Services send raw events here to be wrapped in a QEL Expression.",
      payload: "{\n  \"actor_id\": \"service-billing-01\",\n  \"action\": \"charge_customer\",\n  \"resource\": \"invoice_123\",\n  \"context\": { \"jurisdiction\": \"EU-GDPR\" }\n}"
    },
    {
      method: "GET",
      path: "/v1/arcs/{id}/policy",
      summary: "Fetch Active Governance Policy",
      desc: "Services call this on startup to know which rules apply to them (e.g., 'Requires 2FA for transactions > $10k').",
      payload: "Response: JSON Schema of validation rules."
    },
    {
      method: "POST",
      path: "/v1/audit/verify",
      summary: "Cryptographic Verification",
      desc: "Auditors use this to verify the signature chain of a specific event ID.",
      payload: "{ \"event_id\": \"evt_998877\", \"merkle_proof\": true }"
    },
    {
      method: "GET",
      path: "/v1/warden/health",
      summary: "Warden Sidecar Status",
      desc: "Health check for the local governance agent running in your data center.",
      payload: "200 OK { \"status\": \"enforcing\", \"sync_lag_ms\": 12 }"
    }
  ],

  aiPrompt: {
    title: "Prompt for AI/Dev Team",
    content: "You are building a QEL-compliant service. Your goal is NOT to write business logic, but to write the 'Governance Wrapper'. \n\n1. For every critical function, implement a 'Pre-Flight Check' that calls `QEL.authorize(action)`. \n2. If authorized, execute the logic.\n3. Finally, emit a `QEL.attest(result)` event.\n\nDo not hardcode permissions. Fetch them from the /policy endpoint."
  }
};
