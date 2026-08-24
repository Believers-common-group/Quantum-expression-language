from qel_tn01.fixtures import NODE_A, NODE_B, NODE_C, NODE_D
from qel_tn01.network import run_happy_path


def test_full_420_unit_transaction_preserves_four_hops_and_lineage():
    manifest = run_happy_path()
    assert manifest.transaction_id == "QEL-TN01-TX-0001"
    assert manifest.quantity == 420
    assert [h.node_id for h in manifest.federation_route] == [NODE_A, NODE_B, NODE_C, NODE_D]
    assert [h.outgoing_state for h in manifest.federation_route] == ["RELEASED", "IN_TRANSIT", "ACCEPTED", "SETTLED"]
    assert manifest.current_state == "SETTLED"
    assert manifest.open_exceptions == ()


def test_receipt_and_commercial_acceptance_are_distinct_transitions():
    manifest = run_happy_path()
    states = [(t.from_state, t.to_state) for t in manifest.transitions]
    assert ("IN_TRANSIT", "RECEIVED") in states
    assert ("RECEIVED", "ACCEPTED") in states
    assert states.index(("IN_TRANSIT", "RECEIVED")) < states.index(("RECEIVED", "ACCEPTED"))


def test_custody_acceptance_precedes_transit():
    manifest = run_happy_path()
    states = [(t.from_state, t.to_state) for t in manifest.transitions]
    assert states.index(("RELEASED", "IN_CUSTODY")) < states.index(("IN_CUSTODY", "IN_TRANSIT"))
