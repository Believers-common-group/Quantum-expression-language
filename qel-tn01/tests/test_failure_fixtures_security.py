from qel_tn01.errors import QelErrorCode
from qel_tn01.failures import run_failure_fixture


def diag(result):
    return dict(result.diagnostics)


def test_f06_mapping_poisoning_is_quarantined():
    r = run_failure_fixture("F06")
    assert r.passed and r.error.code is QelErrorCode.SIGNATURE_INVALID
    assert diag(r)["quarantine"] is True


def test_f07_namespace_spoofing_is_rejected():
    r = run_failure_fixture("F07")
    assert r.passed and r.error.code is QelErrorCode.NAMESPACE_UNTRUSTED


def test_f08_authority_substitution_blocks_execution():
    r = run_failure_fixture("F08")
    assert r.passed and r.error.code is QelErrorCode.AUTHORITY_UNRESOLVED
    assert diag(r)["executed"] is False


def test_f09_embedded_instruction_remains_content_not_intent():
    r = run_failure_fixture("F09")
    assert r.passed
    assert diag(r)["content_classification"] == "CONTENT"
    assert diag(r)["intent_emitted"] is False
    assert diag(r)["executed"] is False


def test_f10_version_rollback_is_detected():
    r = run_failure_fixture("F10")
    assert r.passed and r.error.code is QelErrorCode.VERSION_CONFLICT
    assert diag(r)["rollback_detected"] is True
