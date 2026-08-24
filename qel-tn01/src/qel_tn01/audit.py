from __future__ import annotations

from dataclasses import dataclass

from qel_tn01.contracts import AuthorityRef, EvidenceRef, Mapping, TransactionManifest


@dataclass(frozen=True)
class AuditSummary:
    ordered_quantity: int
    released: bool
    custody_taken: bool
    received: bool
    accepted: bool
    obligation_verified: bool
    settled: bool
    unresolved_exceptions: tuple[str, ...]
    authority_refs_seen: tuple[str, ...]
    evidence_refs_seen: tuple[str, ...]


def reconstruct(
    manifest: TransactionManifest,
    mappings: tuple[Mapping, ...],
    authority_refs: tuple[str | AuthorityRef, ...],
    evidence_refs: tuple[EvidenceRef, ...],
) -> AuditSummary:
    transitions = tuple((t.from_state, t.to_state) for t in manifest.transitions)
    authority_ids = tuple(a.authority_id if isinstance(a, AuthorityRef) else a for a in authority_refs)
    evidence_ids = tuple(e.evidence_id for e in evidence_refs)
    return AuditSummary(
        ordered_quantity=manifest.quantity,
        released=("ALLOCATED", "RELEASED") in transitions,
        custody_taken=("RELEASED", "IN_CUSTODY") in transitions,
        received=("IN_TRANSIT", "RECEIVED") in transitions,
        accepted=("RECEIVED", "ACCEPTED") in transitions,
        obligation_verified=("ACCEPTED", "OBLIGATION_VERIFIED") in transitions,
        settled=("PAYMENT_INITIATED", "SETTLED") in transitions,
        unresolved_exceptions=manifest.open_exceptions,
        authority_refs_seen=authority_ids,
        evidence_refs_seen=evidence_ids,
    )
