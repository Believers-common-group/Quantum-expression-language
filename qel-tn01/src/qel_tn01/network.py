from __future__ import annotations

from qel_tn01.contracts import Capability, FederationHop, Intent, TransactionManifest, Transition
from qel_tn01.errors import QelError
from qel_tn01.fixtures import (
    CAP_CUSTODY_ACCEPT, CAP_INVENTORY_RELEASE, CAP_OBLIGATION_VERIFY,
    CAP_PAYMENT_INITIATE, CAP_SETTLEMENT_CONFIRM, CAP_SHIPMENT_TRANSIT,
    CAP_STORE_ACCEPT, CAP_STORE_RECEIVE, FIXTURE_QUANTITY,
    MANIFEST_A, MANIFEST_B, MANIFEST_C, MANIFEST_D,
    NODE_A, NODE_B, NODE_C, NODE_D, TRANSACTION_ID,
)
from qel_tn01.nodes.factory import FactoryNode
from qel_tn01.nodes.logistics import LogisticsNode
from qel_tn01.nodes.settlement import SettlementNode
from qel_tn01.nodes.store import StoreNode
from qel_tn01.trust import negotiate_capability


def build_release_intent(batch_ref: str = "B420") -> Intent:
    return Intent(
        "I-RELEASE", "actor-factory", "qel:action:custody-release", (batch_ref,),
        ("ALLOCATED", "RELEASED"), ("DISPATCH_AUTHORITY",), (CAP_INVENTORY_RELEASE,),
    )


def _intent(intent_id: str, actor: str, action: str, batch: str, transition: tuple[str, str], authority: str, capability: str) -> Intent:
    return Intent(intent_id, actor, action, (batch,), transition, (authority,), (capability,))


def _require_capability(manifest, capability_id: str) -> Capability:
    resolved = negotiate_capability(manifest, capability_id)
    if isinstance(resolved, QelError):
        raise RuntimeError(resolved.code.value)
    return resolved


def _require_transition(value: Transition | QelError) -> Transition:
    if isinstance(value, QelError):
        raise RuntimeError(value.code.value)
    return value


def run_happy_path() -> TransactionManifest:
    batch = "B420"
    factory = FactoryNode()
    logistics = LogisticsNode()
    store = StoreNode()
    settlement = SettlementNode()
    factory.allocate(batch, FIXTURE_QUANTITY)

    _require_capability(MANIFEST_A, CAP_INVENTORY_RELEASE)
    t_release = _require_transition(factory.release(build_release_intent(batch)))

    _require_capability(MANIFEST_B, CAP_CUSTODY_ACCEPT)
    t_custody = _require_transition(logistics.accept_custody(
        _intent("I-CUSTODY", "actor-carrier", "qel:action:custody-accept", batch, ("RELEASED", "IN_CUSTODY"), "CARRIER_OPERATOR", CAP_CUSTODY_ACCEPT),
        FIXTURE_QUANTITY,
    ))
    _require_capability(MANIFEST_B, CAP_SHIPMENT_TRANSIT)
    t_transit = _require_transition(logistics.mark_in_transit(
        _intent("I-TRANSIT", "actor-carrier", "qel:action:shipment-transit", batch, ("IN_CUSTODY", "IN_TRANSIT"), "CARRIER_OPERATOR", CAP_SHIPMENT_TRANSIT)
    ))

    _require_capability(MANIFEST_C, CAP_STORE_RECEIVE)
    t_receive = _require_transition(store.receive(
        _intent("I-RECEIVE", "actor-store-receiver", "qel:action:physical-receive", batch, ("IN_TRANSIT", "RECEIVED"), "RECEIVING_OPERATOR", CAP_STORE_RECEIVE),
        FIXTURE_QUANTITY,
    ))
    _require_capability(MANIFEST_C, CAP_STORE_ACCEPT)
    t_accept = _require_transition(store.accept(
        _intent("I-ACCEPT", "actor-store-manager", "qel:action:commercial-accept", batch, ("RECEIVED", "ACCEPTED"), "LOCATION_MANAGER", CAP_STORE_ACCEPT)
    ))

    _require_capability(MANIFEST_D, CAP_OBLIGATION_VERIFY)
    t_obligation = _require_transition(settlement.verify_obligation(
        _intent("I-OBLIGATION", "actor-settlement", "qel:action:obligation-verify", batch, ("ACCEPTED", "OBLIGATION_VERIFIED"), "SETTLEMENT_OPERATOR", CAP_OBLIGATION_VERIFY),
        FIXTURE_QUANTITY,
    ))
    _require_capability(MANIFEST_D, CAP_PAYMENT_INITIATE)
    t_payment = _require_transition(settlement.initiate_payment(
        _intent("I-PAYMENT", "actor-payment", "qel:action:payment-initiate", batch, ("OBLIGATION_VERIFIED", "PAYMENT_INITIATED"), "PAYMENT_AUTHORITY", CAP_PAYMENT_INITIATE),
        FIXTURE_QUANTITY,
    ))
    _require_capability(MANIFEST_D, CAP_SETTLEMENT_CONFIRM)
    t_settle = _require_transition(settlement.confirm_settlement(
        _intent("I-SETTLE", "actor-payment", "qel:action:settlement-confirm", batch, ("PAYMENT_INITIATED", "SETTLED"), "PAYMENT_AUTHORITY", CAP_SETTLEMENT_CONFIRM),
        FIXTURE_QUANTITY,
    ))

    route = (
        FederationHop(NODE_A, "ALLOCATED", "RELEASED", t_release.actor, t_release.authority_ref, t_release.capability_id, t_release.evidence_refs, t_release.timestamp, None),
        FederationHop(NODE_B, "RELEASED", "IN_TRANSIT", t_transit.actor, t_transit.authority_ref, t_transit.capability_id, t_custody.evidence_refs + t_transit.evidence_refs, t_transit.timestamp, None),
        FederationHop(NODE_C, "IN_TRANSIT", "ACCEPTED", t_accept.actor, t_accept.authority_ref, t_accept.capability_id, t_receive.evidence_refs + t_accept.evidence_refs, t_accept.timestamp, "OBLIGATION_ACTIVATED"),
        FederationHop(NODE_D, "ACCEPTED", "SETTLED", t_settle.actor, t_settle.authority_ref, t_settle.capability_id, t_obligation.evidence_refs + t_payment.evidence_refs + t_settle.evidence_refs, t_settle.timestamp, "OBLIGATION_SETTLED"),
    )
    transitions = (t_release, t_custody, t_transit, t_receive, t_accept, t_obligation, t_payment, t_settle)
    return TransactionManifest(TRANSACTION_ID, FIXTURE_QUANTITY, route, "SETTLED", (), transitions)
