from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, IntEnum
from typing import Any


class EpistemicStatus(str, Enum):
    OBSERVATION = "OBSERVATION"
    MEASUREMENT = "MEASUREMENT"
    CLAIM = "CLAIM"
    FACT = "FACT"
    INFERENCE = "INFERENCE"
    PREDICTION = "PREDICTION"
    SIMULATION = "SIMULATION"
    DECISION = "DECISION"


class MappingType(str, Enum):
    EXACT = "EXACT"
    EQUIVALENT = "EQUIVALENT"
    NARROWER = "NARROWER"
    BROADER = "BROADER"
    PARTIAL = "PARTIAL"
    DERIVED = "DERIVED"
    CONTEXTUAL = "CONTEXTUAL"
    UNRESOLVED = "UNRESOLVED"


class EffectClass(IntEnum):
    E0 = 0
    E1 = 1
    E2 = 2
    E3 = 3
    E4 = 4
    E5 = 5
    E6 = 6
    E7 = 7
    E8 = 8
    E9 = 9


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    FAILED = "FAILED"
    QUARANTINED = "QUARANTINED"


@dataclass(frozen=True)
class AuthorityRef:
    authority_id: str
    authority_type: str
    source: str
    scope: tuple[str, ...]
    effective_from: str
    effective_until: str | None = None


@dataclass(frozen=True)
class EvidenceRef:
    evidence_id: str
    evidence_type: str
    source: str
    custodian: str
    timestamp: str
    integrity_ref: str
    content_locator: str
    visibility: str
    verification_status: VerificationStatus


@dataclass(frozen=True)
class Intent:
    intent_id: str
    actor: str
    action: str
    object_refs: tuple[str, ...]
    desired_transition: tuple[str, str]
    authority_refs: tuple[str, ...]
    required_capabilities: tuple[str, ...]
    parameters: tuple[tuple[str, Any], ...] = ()
    constraints: tuple[str, ...] = ()
    semantic_confidence: float = 1.0


@dataclass(frozen=True)
class Capability:
    capability_id: str
    action_type: str
    provider: str
    input_schema: str
    output_schema: str
    effect_class: EffectClass
    authority_requirements: tuple[str, ...]
    evidence_requirements: tuple[str, ...]
    side_effects: tuple[str, ...]
    version: str


@dataclass(frozen=True)
class NodeManifest:
    node_id: str
    qel_versions: tuple[str, ...]
    conformance_target: str
    namespaces: tuple[str, ...]
    capabilities: tuple[Capability, ...]
    accepted_evidence_types: tuple[str, ...]
    authority_models: tuple[str, ...]
    federation_support: bool
    security_profile: str


@dataclass(frozen=True)
class Mapping:
    mapping_id: str
    source_namespace: str
    source_object: str
    target_qel_id: str
    mapping_type: MappingType
    transformation: str | None
    applicability: str
    confidence: float
    maintainer: str
    validation_status: VerificationStatus
    version: str


@dataclass(frozen=True)
class SemanticDiff:
    left: str
    right: str
    shared_meaning: str
    differences: tuple[str, ...]
    risk: str
    mapping_type: MappingType
    safe_for_automatic_translation: bool
    required_resolution: str | None


@dataclass(frozen=True)
class Claim:
    claim_id: str
    claimant: str
    proposition: str
    epistemic_status: EpistemicStatus = field(default=EpistemicStatus.CLAIM, init=False)


@dataclass(frozen=True)
class Fact:
    fact_id: str
    proposition: str
    established_by: str
    epistemic_status: EpistemicStatus = field(default=EpistemicStatus.FACT, init=False)


@dataclass(frozen=True)
class Transition:
    transition_id: str
    object_ref: str
    from_state: str
    action: str
    to_state: str
    actor: str
    authority_ref: str
    capability_id: str
    evidence_refs: tuple[EvidenceRef, ...]
    timestamp: str
    idempotency_key: str


@dataclass(frozen=True)
class FederationHop:
    node_id: str
    incoming_state: str
    outgoing_state: str
    actor: str
    authority_ref: str
    capability_id: str
    evidence_refs: tuple[EvidenceRef, ...]
    timestamp: str
    commercial_obligation_impact: str | None


@dataclass(frozen=True)
class TransactionManifest:
    transaction_id: str
    quantity: int
    federation_route: tuple[FederationHop, ...]
    current_state: str
    open_exceptions: tuple[str, ...]
    transitions: tuple[Transition, ...] = ()
    claims: tuple[Claim, ...] = ()
    facts: tuple[Fact, ...] = ()


@dataclass(frozen=True)
class FixtureResult:
    fixture_id: str
    passed: bool
    state: str | None = None
    error: Any | None = None
    diagnostics: tuple[tuple[str, Any], ...] = ()
    claims: tuple[Claim, ...] = ()
    facts: tuple[Fact, ...] = ()
