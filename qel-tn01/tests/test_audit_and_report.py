import json
import subprocess
import sys

from qel_tn01.audit import reconstruct
from qel_tn01.fixtures import LOCAL_MAPPINGS
from qel_tn01.network import run_happy_path
from qel_tn01.report import run_conformance


EXPECTED_CHECKS = {
    "semantic_conformance",
    "state_transition_conformance",
    "epistemic_separation",
    "authority_separation",
    "capability_negotiation",
    "federation_reconstruction",
    "evidence_portability",
    "semantic_diff_correctness",
    "security_fixtures",
    "exception_reconciliation",
}


def portable_inputs(manifest):
    authority_refs = tuple(t.authority_ref for t in manifest.transitions)
    evidence_refs = tuple(e for t in manifest.transitions for e in t.evidence_refs)
    return tuple(LOCAL_MAPPINGS.values()), authority_refs, evidence_refs


def test_independent_auditor_reconstructs_transaction_without_nodes():
    manifest = run_happy_path()
    mappings, authority_refs, evidence_refs = portable_inputs(manifest)
    summary = reconstruct(manifest, mappings, authority_refs, evidence_refs)
    assert summary.ordered_quantity == 420
    assert summary.released is True
    assert summary.custody_taken is True
    assert summary.received is True
    assert summary.accepted is True
    assert summary.obligation_verified is True
    assert summary.settled is True


def test_conformance_report_has_all_required_checks_and_fixtures():
    report = run_conformance()
    assert report["proof"] == "QEL Interoperability Proof 001"
    assert report["transaction_id"] == "QEL-TN01-TX-0001"
    assert report["overall"] == "PASS"
    assert set(report["checks"]) == EXPECTED_CHECKS
    assert set(report["fixtures"]) == {f"F{i:02d}" for i in range(1, 11)}
    assert all(v["status"] == "PASS" for v in report["fixtures"].values())


def test_cli_emits_parseable_json_and_zero_exit():
    result = subprocess.run([sys.executable, "-m", "qel_tn01.cli"], text=True, capture_output=True)
    assert result.returncode == 0, result.stderr
    parsed = json.loads(result.stdout)
    assert parsed["overall"] == "PASS"


def test_audit_module_has_no_node_dependencies():
    import inspect
    import qel_tn01.audit as audit
    source = inspect.getsource(audit)
    assert "qel_tn01.nodes" not in source
