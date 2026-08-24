from __future__ import annotations

from qel_tn01.audit import reconstruct
from qel_tn01.contracts import Intent, MappingType
from qel_tn01.failures import run_failure_fixture
from qel_tn01.fixtures import (
    LOCAL_MAPPINGS, MANIFEST_A, MANIFEST_B, MANIFEST_C, MANIFEST_D,
    NODE_A, NODE_B, NODE_C, NODE_D, TRANSACTION_ID,
)
from qel_tn01.network import run_happy_path
from qel_tn01.semantic import semantic_diff
from qel_tn01.trust import negotiate_capability


def _fixture_json(result):
    payload = {
        "status": "PASS" if result.passed else "FAIL",
        "state": result.state,
        "diagnostics": dict(result.diagnostics),
    }
    if result.error is not None:
        payload["error"] = result.error.code.value
    if result.claims:
        payload["claims"] = [c.proposition for c in result.claims]
    if result.facts:
        payload["facts"] = [f.proposition for f in result.facts]
    return payload


def run_conformance() -> dict:
    manifest = run_happy_path()
    fixture_results = {f"F{i:02d}": run_failure_fixture(f"F{i:02d}") for i in range(1, 11)}
    mappings = tuple(LOCAL_MAPPINGS.values())
    authority_refs = tuple(t.authority_ref for t in manifest.transitions)
    evidence_refs = tuple(e for t in manifest.transitions for e in t.evidence_refs)
    audit = reconstruct(manifest, mappings, authority_refs, evidence_refs)
    diff = semantic_diff("factory:RELEASED", "logistics:PICKED_UP")

    expected_states = (
        ("ALLOCATED", "RELEASED"),
        ("RELEASED", "IN_CUSTODY"),
        ("IN_CUSTODY", "IN_TRANSIT"),
        ("IN_TRANSIT", "RECEIVED"),
        ("RECEIVED", "ACCEPTED"),
        ("ACCEPTED", "OBLIGATION_VERIFIED"),
        ("OBLIGATION_VERIFIED", "PAYMENT_INITIATED"),
        ("PAYMENT_INITIATED", "SETTLED"),
    )
    actual_states = tuple((t.from_state, t.to_state) for t in manifest.transitions)
    f02 = fixture_results["F02"]

    manifests = (MANIFEST_A, MANIFEST_B, MANIFEST_C, MANIFEST_D)
    capability_ok = all(
        not hasattr(negotiate_capability(m, hop.capability_id), "code")
        for m, hop in zip(manifests, manifest.federation_route)
    )

    schemes = {e.content_locator.split(":", 1)[0] for e in evidence_refs}
    checks = {
        "semantic_conformance": all(m.target_qel_id.startswith("qel:") for m in mappings),
        "state_transition_conformance": actual_states == expected_states,
        "epistemic_separation": len(f02.claims) == 2 and not f02.facts,
        "authority_separation": "authorized" not in Intent.__dataclass_fields__ and all(t.authority_ref for t in manifest.transitions),
        "capability_negotiation": capability_ok,
        "federation_reconstruction": [h.node_id for h in manifest.federation_route] == [NODE_A, NODE_B, NODE_C, NODE_D] and audit.settled,
        "evidence_portability": {"factory", "carrier-signed", "erp-audit", "payment-sim"}.issubset(schemes),
        "semantic_diff_correctness": diff.mapping_type is MappingType.PARTIAL and not diff.safe_for_automatic_translation,
        "security_fixtures": all(fixture_results[f"F{i:02d}"].passed for i in range(6, 11)),
        "exception_reconciliation": all(fixture_results[f"F{i:02d}"].passed for i in range(1, 6)),
    }
    return {
        "proof": "QEL Interoperability Proof 001",
        "transaction_id": TRANSACTION_ID,
        "overall": "PASS" if all(checks.values()) else "FAIL",
        "checks": {k: "PASS" if v else "FAIL" for k, v in checks.items()},
        "fixtures": {k: _fixture_json(v) for k, v in fixture_results.items()},
    }
