from qel_tn01.errors import QelErrorCode
from qel_tn01.failures import run_failure_fixture


def diag(result):
    return dict(result.diagnostics)


def test_f01_quantity_mismatch_is_partial_receipt_delta_four():
    r = run_failure_fixture("F01")
    assert r.passed and r.state == "PARTIAL_RECEIPT"
    assert r.error.code is QelErrorCode.STATE_CONFLICT
    assert diag(r)["delta"] == 4
    assert diag(r)["full_obligation_settled"] is False


def test_f02_competing_delivery_claims_remain_claims():
    r = run_failure_fixture("F02")
    assert r.passed and r.state == "DELIVERY_UNVERIFIED"
    assert {c.proposition for c in r.claims} == {"DELIVERED", "NOT_RECEIVED"}
    assert r.facts == ()


def test_f03_duplicate_execution_has_no_second_effect():
    r = run_failure_fixture("F03")
    assert r.passed
    assert r.error.code is QelErrorCode.DUPLICATE_EFFECT
    assert diag(r)["second_effect_count"] == 0


def test_f04_stale_pack_is_version_conflict():
    r = run_failure_fixture("F04")
    assert r.passed
    assert r.error.code is QelErrorCode.VERSION_CONFLICT


def test_f05_unknown_capability_is_rejected():
    r = run_failure_fixture("F05")
    assert r.passed
    assert r.error.code is QelErrorCode.CAPABILITY_MISMATCH
