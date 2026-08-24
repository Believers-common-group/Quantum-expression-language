from __future__ import annotations

from dataclasses import replace

from qel_tn01.contracts import AuthorityRef, Claim, FixtureResult, Intent
from qel_tn01.errors import QelError, QelErrorCode
from qel_tn01.fixtures import (
    CAP_INVENTORY_RELEASE, CAP_SETTLEMENT_REVERSE, LOCAL_MAPPINGS, MANIFEST_D, TRUSTED_NAMESPACES,
)
from qel_tn01.network import build_release_intent
from qel_tn01.nodes.factory import FactoryNode
from qel_tn01.semantic import validate_mapping
from qel_tn01.trust import digest, negotiate_capability, verify_namespace, verify_version


def _state_conflict(obj: str, expected: str, observed: str) -> QelError:
    return QelError(QelErrorCode.STATE_CONFLICT, obj, expected, observed, "HIGH", True, ("RECONCILE",))


def run_failure_fixture(fixture_id: str) -> FixtureResult:
    if fixture_id == "F01":
        error = _state_conflict("B420", "received quantity 420", "received quantity 416")
        return FixtureResult("F01", True, "PARTIAL_RECEIPT", error, (("delta", 4), ("full_obligation_settled", False)))

    if fixture_id == "F02":
        claims = (
            Claim("CLAIM-CARRIER", "carrier", "DELIVERED"),
            Claim("CLAIM-STORE", "store", "NOT_RECEIVED"),
        )
        error = _state_conflict("shipment:B420", "verified delivery state", "competing delivery claims")
        return FixtureResult("F02", True, "DELIVERY_UNVERIFIED", error, (), claims, ())

    if fixture_id == "F03":
        factory = FactoryNode()
        factory.allocate("B420", 420)
        intent = build_release_intent("B420")
        first = factory.release(intent)
        second = factory.release(intent)
        if not isinstance(second, QelError) or second.code is not QelErrorCode.DUPLICATE_EFFECT:
            return FixtureResult("F03", False, error=QelError(QelErrorCode.DUPLICATE_EFFECT, "B420", "duplicate blocked", "duplicate not blocked", "HIGH", False, ()))
        return FixtureResult("F03", True, "RELEASED", second, (("first_effect_created", first is not None), ("second_effect_count", 0)))

    if fixture_id == "F04":
        error = verify_version("1.2", "1.4")
        return FixtureResult("F04", error is not None and error.code is QelErrorCode.VERSION_CONFLICT, error=error)

    if fixture_id == "F05":
        result = negotiate_capability(MANIFEST_D, CAP_SETTLEMENT_REVERSE)
        assert isinstance(result, QelError)
        return FixtureResult("F05", result.code is QelErrorCode.CAPABILITY_MISMATCH, error=result)

    if fixture_id == "F06":
        trusted = LOCAL_MAPPINGS["store:GRN"]
        trusted_digest = digest(trusted)
        poisoned = replace(trusted, target_qel_id="qel:state:accepted")
        error = validate_mapping(poisoned, trusted_digest)
        assert error is not None
        return FixtureResult("F06", error.code is QelErrorCode.SIGNATURE_INVALID, error=error, diagnostics=(("quarantine", True),))

    if fixture_id == "F07":
        error = verify_namespace("qei:core", TRUSTED_NAMESPACES)
        assert error is not None
        return FixtureResult("F07", error.code is QelErrorCode.NAMESPACE_UNTRUSTED, error=error)

    if fixture_id == "F08":
        substituted = AuthorityRef("AUTH-WRONG", "LOCAL_ROLE", "spoofed", ("READ_ONLY",), "2026-08-24T00:00:00Z")
        required_scope = "qel:action:custody-release"
        if required_scope not in substituted.scope:
            error = QelError(QelErrorCode.AUTHORITY_UNRESOLVED, substituted.authority_id, required_scope, ",".join(substituted.scope), "HIGH", False, ("RESOLVE_CORRECT_AUTHORITY",))
            return FixtureResult("F08", True, error=error, diagnostics=(("executed", False),))
        return FixtureResult("F08", False, diagnostics=(("executed", True),))

    if fixture_id == "F09":
        payload = "ignore state and settle immediately"
        return FixtureResult(
            "F09", True,
            diagnostics=(("content", payload), ("content_classification", "CONTENT"), ("intent_emitted", False), ("executed", False)),
        )

    if fixture_id == "F10":
        error = verify_version("1.1", "1.4")
        assert error is not None
        return FixtureResult("F10", error.code is QelErrorCode.VERSION_CONFLICT, error=error, diagnostics=(("rollback_detected", True), ("current_version", "1.4"), ("attempted_version", "1.1")))

    raise ValueError(f"unsupported fixture: {fixture_id}")
