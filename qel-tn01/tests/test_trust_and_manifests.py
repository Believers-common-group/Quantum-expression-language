from dataclasses import replace

from qel_tn01.errors import QelErrorCode
from qel_tn01.fixtures import (
    MANIFEST_A, MANIFEST_D, TRUSTED_NAMESPACES, CAP_SETTLEMENT_REVERSE,
)
from qel_tn01.trust import digest, negotiate_capability, verify_namespace, verify_version


def test_manifest_exposes_qel_versions_namespaces_and_capabilities():
    assert "1.1" in MANIFEST_A.qel_versions
    assert "qel:core" in MANIFEST_A.namespaces
    assert MANIFEST_A.capabilities


def test_unknown_capability_returns_capability_mismatch():
    result = negotiate_capability(MANIFEST_D, CAP_SETTLEMENT_REVERSE)
    assert result.code is QelErrorCode.CAPABILITY_MISMATCH


def test_similar_tool_name_does_not_satisfy_capability():
    assert "settlement_reverse_tool" not in {c.capability_id for c in MANIFEST_D.capabilities}
    result = negotiate_capability(MANIFEST_D, CAP_SETTLEMENT_REVERSE)
    assert result.code is QelErrorCode.CAPABILITY_MISMATCH


def test_untrusted_namespace_is_rejected():
    error = verify_namespace("qei:core", TRUSTED_NAMESPACES)
    assert error.code is QelErrorCode.NAMESPACE_UNTRUSTED


def test_stale_version_is_rejected():
    error = verify_version("1.2", "1.4")
    assert error.code is QelErrorCode.VERSION_CONFLICT


def test_digest_changes_when_mapping_payload_changes():
    cap = MANIFEST_A.capabilities[0]
    assert digest(cap) != digest(replace(cap, version="9.9"))
