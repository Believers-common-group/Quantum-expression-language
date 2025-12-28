# BNR ARCHITECTURE DIAGRAMS & IMPLEMENTATION GUIDE

---

## DIAGRAM 1: EVENT FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BNR TRUTH LEDGER                              │
│  (Append-only, cryptographically sealed event record)                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↑ (Events promoted to intent)
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ↓                                         ↓
  ┌──────────────┐                        ┌──────────────┐
  │ ARC Stream 1 │                        │ ARC Stream N │
  │ Manufacturing│                        │ Governance   │
  └──────┬───────┘                        └──────┬───────┘
         │                                        │
         ├────────────────────┬───────────────────┤
         │                    │                   │
         ↓                    ↓                   ↓
  ┌─────────────────────────────────────────────────┐
  │      Location Event Buses (Per-Location)        │
  │                                                  │
  │  Kafka Topic: events.LOC-FACTORY-DELHI-01       │
  │  ├─ Partition 0: Events for device group 0      │
  │  ├─ Partition 1: Events for device group 1      │
  │  └─ Partition N: ...                            │
  │                                                  │
  │  Kafka Topic: events.LOC-WAREHOUSE-BNG-01       │
  │  └─ Partitions...                               │
  └────────────────┬────────────────────────────────┘
                   │ (Subscribed & filtered)
        ┌──────────┴──────────┬───────────┬─────────┐
        │                     │           │         │
        ↓                     ↓           ↓         ↓
  ┌──────────────┐  ┌──────────────┐  ...    ┌──────────────┐
  │  Collector 1 │  │  Collector 2 │         │  Collector N │
  │ (Edge-01)    │  │ (Edge-02)    │         │ (Edge-03)    │
  └──────┬───────┘  └──────┬───────┘         └──────┬───────┘
         │                 │                        │
    Normalizes         Buffers              Signs & publishes
    Validates          Encrypts
    Timestamps         Retries
    Signs
         │                 │                        │
         └─────────────────┴────────────────────────┤
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ↓                                     ↓
  ┌──────────────┐                    ┌──────────────┐
  │  Sensors     │                    │  Operators   │
  │  IoT Devices │ Untrusted Signals  │  Terminals   │
  │  Meters      │ (Raw, unsigned)    │  APIs        │
  └──────────────┘                    └──────────────┘
```

---

## DIAGRAM 2: COLLECTOR DEVICE STATE MACHINE

```
                        ┌─────────────┐
                        │    INIT     │
                        └──────┬──────┘
                               │
                      (load firmware hash)
                               │
                               ↓
                    ┌──────────────────┐
                    │   REGISTERING    │
                    │ (await authority)│
                    └──────────┬───────┘
                               │
                    (policy sync complete)
                               │
                               ↓
                    ┌──────────────────┐
                    │  POLICY_LOADED   │
                    │ (ready to poll)  │
                    └──────────┬───────┘
                               │
                    (device auth ok)
                               │
                               ↓
        ┌──────────────────────────────────────────┐
        │          OPERATIONAL                     │
        │  ┌──────────────────────────────────┐   │
        │  │ Poll devices every 100ms         │   │
        │  ├──────────────────────────────────┤   │
        │  │ • Read raw signals               │   │
        │  │ • Auth each device (HMAC+nonce)  │   │
        │  │ • Normalize to canonical event   │   │
        │  │ • Enforce local policy           │   │
        │  │ • Ensure monotonic timestamps    │   │
        │  │ • Sign with RS256                │   │
        │  │ • Buffer or flush to Kafka       │   │
        │  │ • Emit heartbeat every 60s       │   │
        │  │ • Sync policy every 1h           │   │
        │  └──────────────────────────────────┘   │
        └──────────────┬────────────┬──────────────┘
                       │            │
              (anomaly detected)    (shutdown signal)
                       │            │
                       ↓            ↓
                ┌────────────┐   ┌─────────────┐
                │  ANOMALY   │   │  SHUTDOWN   │
                │ (log + esc)│   │ (flush all) │
                └────────────┘   └─────────────┘
```

---

## DIAGRAM 3: EVENT → INTENT PROMOTION FLOW

```
Event Arrives at ARC
    │
    ├─ Verify signature ──→ Reject if invalid
    │
    ├─ Check allowed_event_types ──→ Drop if not subscribed
    │
    ├─ Match against PROMOTION_RULES
    │
    ├─ Rule 1: sensor.temperature > 85°C
    │  └─ Condition: TRUE ──→ Intent: COOLING_REQUIRED (HIGH)
    │
    ├─ Rule 2: sensor.temperature > 100°C
    │  └─ Condition: TRUE ──→ Intent: EMERGENCY_SHUTDOWN (CRITICAL)
    │
    ├─ Rule 3: machine.state_change (running → error)
    │  └─ Condition: TRUE ──→ Intent: MAINTENANCE_REQUIRED (HIGH)
    │
    ├─ Rule 4: payment.request.amount > 100,000
    │  └─ Condition: TRUE ──→ Intent: PAYMENT_REQUIRES_APPROVAL (HIGH)
    │
    └─ Rule N: ... condition evaluation ...
       └─ Match ──→ Create Intent
                   ├─ intent_id: UUID
                   ├─ event_id: (source event)
                   ├─ arc_id: (escalation authority)
                   ├─ status: "pending"
                   ├─ priority: (from rule)
                   └─ Emit to intent queue
                   └─ Schedule auto-action (if defined)

No Rule Matched
    └─ Event remains INFORMATIONAL (no action)
```

---

## DIAGRAM 4: AUTHORITY HIERARCHY & CERTIFICATE CHAIN

```
                    ┌──────────────────────┐
                    │  BNR_ROOT_AUTHORITY  │
                    │  (Offline HSM)       │
                    │  Root Public Key     │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ↓                  ↓                  ↓
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │ ARC-MANU     │  │ ARC-SUPPLY   │  │ ARC-GOVN     │
      │ Authority    │  │ Authority    │  │ Authority    │
      │ Cert         │  │ Cert         │  │ Cert         │
      │ (validity:   │  │ (validity:   │  │ (validity:   │
      │  1 year)     │  │  1 year)     │  │  1 year)     │
      └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
             │                 │                  │
       ┌─────┴──────┐      ...                ...
       │            │
       ↓            ↓
  ┌─────────┐  ┌──────────────┐
  │Loc-Fac  │  │Loc-Warehouse │
  │-Delhi   │  │ -Bangalore   │
  │Cert     │  │ Cert         │
  │(6 mo)   │  │ (6 mo)       │
  └────┬────┘  └──────────────┘
       │
   ┌───┴────┐
   │        │
   ↓        ↓
┌───────┐┌───────┐
│Coll-  ││Coll-  │
│Edge01 ││Edge02 │
│Cred   ││Cred   │
│(90d)  ││(90d)  │
└───┬───┘└───────┘
    │
    ├─ Private Key (encrypted)
    ├─ Device Credentials
    └─ Policy Profile
```

---

## DIAGRAM 5: OFFLINE BUFFER SYNC STATE MACHINE

```
Network Operational
    │
    ├─ Events published to Kafka
    ├─ Heartbeat sent every 60s
    └─ Status: ONLINE
    
        ↓ (Network loss detected)

Network Unreachable
    │
    ├─ Events buffered to SQLite (local)
    ├─ Buffer marked as "pending"
    ├─ Retention: max 50,000 events
    └─ Status: OFFLINE_BUFFERING
    
        ↑ (Network restored)

Sync Phase
    │
    ├─ Replay SQLite → Kafka
    ├─ Verify each event (signature still valid)
    ├─ Check buffer hasn't expired
    ├─ Count synced + failed
    └─ Mark synced_at timestamp
    
        ↓

Sync Complete
    │
    ├─ Emit: offline_sync_complete
    │        ├─ synced_count: N
    │        ├─ failed_count: M
    │        └─ total: N+M
    ├─ Status: ONLINE_VALIDATED
    └─ Resume normal operation
```

---

## DIAGRAM 6: WARDEN ANOMALY DETECTION PIPELINE

```
Event Stream (from Location Bus)
    │
    ↓
Anomaly Detection Engine
    │
    ├─ Rule 1: Statistical (Temperature spike)
    │  ├─ Compute Z-score = (value - mean) / stddev
    │  ├─ If |Z| > 3.0 → Anomaly
    │  └─ Severity: HIGH
    │
    ├─ Rule 2: Rate (Auth failures spike)
    │  ├─ Count failures in 5-minute window
    │  ├─ If count > 2x baseline → Anomaly
    │  └─ Severity: CRITICAL
    │
    ├─ Rule 3: Absence (Device silent)
    │  ├─ Check if device_id sent event in 90s
    │  ├─ If missing → Anomaly
    │  └─ Severity: MEDIUM
    │
    └─ Rule 4: Sequence (State transition invalid)
       ├─ Check if transition is allowed
       ├─ E.g., error → running (not allowed)
       └─ Severity: HIGH

Anomaly Detected
    │
    ├─ Emit governance_event: 'warden_anomaly_detected'
    ├─ Include:
    │  ├─ anomaly_id
    │  ├─ rule_id
    │  ├─ severity
    │  ├─ event_id
    │  └─ score (0.0 to 1.0)
    │
    └─ Execute action:
       ├─ emit_governance_event (log)
       ├─ escalate_to_arc (create intent)
       ├─ trigger_auto_mitigation (action)
       └─ [configurable]
```

---

## QUICK-START IMPLEMENTATION GUIDE

### Phase 1: Setup (Week 1)

**Prerequisites:**
- Kafka cluster (3+ brokers, TLS enabled)
- PostgreSQL or SQLite for policy store
- OpenSSL/PKCS11 for crypto
- TypeScript runtime (Node.js 18+)

**Checklist:**
- [ ] Install Kafka cluster
- [ ] Create root CA certificate (offline, HSM-backed)
- [ ] Initialize location bus topic per location
- [ ] Set up device credential store
- [ ] Deploy location authority service

```bash
# Example: Create location bus topic
kafka-topics.sh --create \
  --bootstrap-servers kafka-1:9092 \
  --topic events.LOC-FACTORY-DELHI-01 \
  --partitions 12 \
  --replication-factor 3 \
  --config retention.ms=604800000 \
  --config compression.type=snappy \
  --config min.insync.replicas=2
```

---

### Phase 2: Collector Firmware (Week 2-3)

**Build Steps:**

1. **Implement firmware bootstrap:**
   - Load and verify firmware signature
   - Initialize crypto context
   - Establish auth channel to location authority

2. **Implement device registration:**
   - Accept device_id + device_class
   - Store shared_secret (encrypted)
   - Register in policy_cache.device_registry

3. **Implement polling loop:**
   - Read from devices every 100ms
   - Authenticate each signal
   - Normalize to canonical event
   - Enforce local policy
   - Sign with RS256
   - Buffer/publish to Kafka

**Sample Collector Startup:**

```typescript
import { BNRCollector } from './collector';

const collector = new BNRCollector();

// Boot sequence
await collector.initHardware();
await collector.verifyFirmwareSignature();
await collector.loadPolicyFromAuthority('LOC-FACTORY-DELHI-01');
await collector.registerDevices([
  { device_id: 'SENSOR-TEMP-001', device_class: 'loom_sensor' },
  { device_id: 'METER-PWR-001', device_class: 'power_meter' }
]);

// Run
await collector.run();
```

---

### Phase 3: Event Validation (Week 3)

**Implement:**
- Signature verification (JWS)
- Schema validation (JSON-Schema)
- Temporal ordering checks
- Payload integrity checks

**Test Scenarios:**
- ✓ Valid event signed → passes
- ✓ Forged signature → rejected
- ✓ Stale timestamp → rejected
- ✓ Malformed payload → rejected
- ✓ Device auth fails → event dropped

---

### Phase 4: Location Bus Producer (Week 4)

**Implement:**
- Kafka producer client
- Batch buffering (threshold: 1000 events or 5 min)
- Partition key strategy (by device_id)
- Error handling + retries
- Compression (snappy)

**Test Scenarios:**
- ✓ Normal publishing (online)
- ✓ Offline buffering (SQLite)
- ✓ Sync on restore (replay + validate)
- ✓ Buffer overflow (drop oldest)

---

### Phase 5: ARC Subscription (Week 5)

**Implement:**
- Kafka consumer per ARC
- Dynamic event filtering
- Intent promotion engine
- Signature verification at consumption

**Test Scenarios:**
- ✓ ARC subscribes to allowed event types
- ✓ Unsigned events dropped
- ✓ Events filtered by policy
- ✓ Intent promotion triggers correctly

---

### Phase 6: Forensic Audit (Week 6)

**Implement:**
- Append-only audit log (PostgreSQL)
- Event replay API
- Merkle tree batch verification
- Chain of custody validation

**Test Scenarios:**
- ✓ Audit log tamper-evident
- ✓ Replay recovers exact event history
- ✓ Merkle proof validates batch integrity
- ✓ Chain verification passes

---

### Phase 7: Warden Anomaly Detection (Week 7)

**Implement:**
- Real-time statistical models
- Rate anomaly detection
- Absence/silence detection
- Governance event escalation

**Test Scenarios:**
- ✓ Temperature spike detected
- ✓ Auth failure rate spike detected
- ✓ Silent device detected after 90s
- ✓ Invalid state transition caught

---

## DEPLOYMENT TOPOLOGY

### Single Datacenter (Dev/Test)

```
┌────────────────────────────────────┐
│     BNR Deployment (Single DC)     │
│                                    │
│  ┌────────────────────────────┐   │
│  │ Location Authority Service │   │
│  │ (policy distribution)      │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ Kafka Broker 1,2,3         │   │
│  │ (events.LOC-*-01 topics)   │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ PostgreSQL                 │   │
│  │ (audit log, policy store)  │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ Prometheus + Grafana       │   │
│  │ (monitoring)               │   │
│  └────────────────────────────┘   │
│                                    │
│  Collectors (Edge)                 │
│  • COLL-FACTORY-01 (offline OK)    │
│  • COLL-WAREHOUSE-01 (online)      │
│  • COLL-RETAIL-01 (online)         │
└────────────────────────────────────┘
```

### Multi-Datacenter (Production)

```
┌─────────────────────────────────────┐
│        BNR Multi-DC Topology        │
│                                     │
│  Data Center 1 (Primary)            │
│  ┌──────────────────────────────┐  │
│  │ Location Authority (Active)  │  │
│  │ Kafka (Primary)              │  │
│  │ PostgreSQL (Primary)         │  │
│  │ Warden Engine (Active)       │  │
│  └──────────────────────────────┘  │
│                                     │
│           (Cross-DC replication)    │
│                   ↕                  │
│                                     │
│  Data Center 2 (Standby)            │
│  ┌──────────────────────────────┐  │
│  │ Location Authority (Standby) │  │
│  │ Kafka (Standby)              │  │
│  │ PostgreSQL (Standby)         │  │
│  │ Warden Engine (Monitoring)   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Regional Collectors (Edge)         │
│  • Publish to primary DC            │
│  • Fallback to secondary if needed  │
└─────────────────────────────────────┘
```

---

## MONITORING & ALERTING CHECKLIST

### Key Metrics

**Collectors:**
- Events per second (EPS) per location
- Buffer fill level (%)
- Kafka publish latency (ms)
- Device auth failure rate (%)
- Offline duration (minutes)

**Location Bus:**
- Consumer lag per ARC (events behind)
- End-to-end latency (device → ARC receipt)
- Partition rebalance frequency

**Intents:**
- Promotion rate (events → intents)
- Intent resolution time (pending → closed)
- Auto-action execution success rate

**Anomalies:**
- Detections per hour (by rule)
- False positive rate (%)
- Time to escalation (ms)

### Alert Rules

```yaml
- alert: CollectorBufferFull
  expr: collector_buffer_fill_percent > 90
  for: 5m
  severity: critical
  action: escalate_to_location_authority

- alert: ConsumerLagHigh
  expr: kafka_consumer_lag > 10000
  for: 10m
  severity: high
  action: page_arc_operator

- alert: AnomalyDetectionRateSpike
  expr: rate(warden_anomalies_detected[5m]) > baseline * 3
  for: 1m
  severity: critical
  action: escalate_to_governance_arc

- alert: OfflineBufferExpiring
  expr: collector_offline_buffer_age_hours > 22
  for: 5m
  severity: medium
  action: force_sync_attempt
```

---

## CONFIGURATION EXAMPLE (production-factory.yaml)

```yaml
location:
  id: LOC-FACTORY-DELHI-01
  type: manufacturing_plant
  governing_arc: ARC-MANUFACTURING
  timezone: Asia/Kolkata

kafka:
  bootstrap_servers:
    - kafka-1.factory.internal:9092
    - kafka-2.factory.internal:9092
    - kafka-3.factory.internal:9092
  topic_pattern: events.{location_id}
  partitions: 12
  replication_factor: 3
  retention_days: 7
  compression: snappy

collectors:
  - id: COLL-FACTORY-01
    hardware: industrial_ipc
    location_id: LOC-FACTORY-DELHI-01
    devices:
      - id: SENSOR-TEMP-001
        class: loom_sensor
        poll_interval_ms: 1000
      - id: METER-PWR-001
        class: power_meter
        poll_interval_ms: 5000
    policy_profile: manufacturing_standard_v2
    buffer_max_events: 50000
    buffer_flush_threshold: 1000
    offline_buffer_enabled: true

warden:
  enabled: true
  rules:
    - id: WARDEN-TEMP-SPIKE
      event_type: sensor.temperature
      detection_type: statistical_anomaly
      window_size: 100
      threshold_stddev: 3
      severity: high
    - id: WARDEN-DEVICE-SILENT
      event_type: null
      detection_type: absence
      expected_interval_seconds: 60
      tolerance_seconds: 30
      severity: medium

audit:
  enabled: true
  backend: postgresql
  log_all_events: true
  merkle_tree_batching: true
  retention_days: 90
```

---

## NEXT CHECKPOINT

**All 10 layers now operational. Ready for:**

1. ✅ Collector deployment to 50+ locations
2. ✅ ARC integration (Manufacturing, Supply, Governance)
3. ✅ Intent → Action workflow (Governance Decision Engine)
4. ✅ Cross-location coordination (Multi-ARC scenarios)
5. ✅ Genesis account binding
6. ✅ RiverOS execution environment

**Lock in:**
- [ ] Governance Decision Engine (intents → actions)
- [ ] Multi-ARC coordination protocol
- [ ] Action execution framework
- [ ] Authority rotation & key management
- [ ] Disaster recovery & failover

Which layer next?

