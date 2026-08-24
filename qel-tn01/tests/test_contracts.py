from qel_tn01.contracts import (
    Claim, Fact, Intent, EffectClass, EpistemicStatus,
    TransactionManifest, FederationHop,
)


def test_claim_and_fact_are_distinct_types():
    claim = Claim(claim_id="C1", claimant="carrier", proposition="DELIVERED")
    fact = Fact(fact_id="F1", proposition="ACCEPTED", established_by="store")
    assert claim.epistemic_status is EpistemicStatus.CLAIM
    assert fact.epistemic_status is EpistemicStatus.FACT
    assert type(claim) is not type(fact)


def test_intent_contains_no_authorized_flag():
    intent = Intent(
        intent_id="I1", actor="A1", action="qel:action:release",
        object_refs=("B420",), desired_transition=("ALLOCATED", "RELEASED"),
        authority_refs=("AUTH-1",), required_capabilities=("CAP-1",),
    )
    assert not hasattr(intent, "authorized")


def test_effect_class_values_are_stable():
    assert EffectClass.E4.value == 4
    assert EffectClass.E6.value == 6
    assert EffectClass.E7.value == 7


def test_federation_route_is_ordered():
    route = (
        FederationHop("A", "ALLOCATED", "RELEASED", "actor-a", "auth-a", "cap-a", (), "2026-08-24T00:00:01Z", None),
        FederationHop("B", "RELEASED", "IN_CUSTODY", "actor-b", "auth-b", "cap-b", (), "2026-08-24T00:00:02Z", None),
    )
    manifest = TransactionManifest("QEL-TN01-TX-0001", 420, route, "IN_CUSTODY", ())
    assert [hop.node_id for hop in manifest.federation_route] == ["A", "B"]
