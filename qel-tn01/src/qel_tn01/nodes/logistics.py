from dataclasses import dataclass

from qel_tn01.contracts import EvidenceRef, Intent, Transition, VerificationStatus
from qel_tn01.errors import QelError, QelErrorCode
from qel_tn01.fixtures import CAP_CUSTODY_ACCEPT, CAP_SHIPMENT_TRANSIT, MANIFEST_B, NODE_B
from qel_tn01.trust import digest


@dataclass
class CarrierConsignment:
    consignment_no: str
    units_manifested: int
    custody_flag: bool
    transport_status: str


@dataclass
class PickupReceipt:
    pickup_ref: str
    consignment_no: str
    scanned_units: int


class LogisticsNode:
    def __init__(self) -> None:
        self.consignments: dict[str, CarrierConsignment] = {}
        self.pickups: dict[str, PickupReceipt] = {}
        self._effects: dict[str, Transition] = {}

    def manifest(self):
        return MANIFEST_B

    def authorize(self, intent: Intent) -> QelError | None:
        if "CARRIER_OPERATOR" in intent.authority_refs and any(cap in intent.required_capabilities for cap in (CAP_CUSTODY_ACCEPT, CAP_SHIPMENT_TRANSIT)):
            return None
        return QelError(QelErrorCode.AUTHORITY_UNRESOLVED, intent.intent_id, "CARRIER_OPERATOR", ",".join(intent.authority_refs), "HIGH", False, ("REQUEST_CARRIER_OPERATOR",))

    def accept_custody(self, intent: Intent, qty: int) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        consignment_no = f"CN-{batch}"
        rec = CarrierConsignment(consignment_no, qty, True, "PICKED_UP")
        self.consignments[consignment_no] = rec
        pickup = PickupReceipt(f"PU-{batch}", consignment_no, qty)
        self.pickups[pickup.pickup_ref] = pickup
        evidence = EvidenceRef(f"E-{pickup.pickup_ref}", "HANDOVER_SCAN", NODE_B, NODE_B, "2026-08-24T00:00:02Z", digest(pickup), f"carrier-signed://receipt/{pickup.pickup_ref}", "FEDERATED", VerificationStatus.VERIFIED)
        t = Transition(f"T-{pickup.pickup_ref}", batch, "RELEASED", "qel:action:custody-accept", "IN_CUSTODY", intent.actor, "CARRIER_OPERATOR", CAP_CUSTODY_ACCEPT, (evidence,), "2026-08-24T00:00:02Z", f"custody:{intent.intent_id}:{batch}")
        self._effects[t.idempotency_key] = t
        return t

    def mark_in_transit(self, intent: Intent) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        consignment = self.consignments[f"CN-{batch}"]
        consignment.transport_status = "IN_TRANSIT"
        evidence = EvidenceRef(f"E-TRANSIT-{batch}", "TRANSIT_EVENT", NODE_B, NODE_B, "2026-08-24T00:00:03Z", digest(consignment), f"carrier-signed://receipt/transit-{batch}", "FEDERATED", VerificationStatus.VERIFIED)
        t = Transition(f"T-TRANSIT-{batch}", batch, "IN_CUSTODY", "qel:action:shipment-transit", "IN_TRANSIT", intent.actor, "CARRIER_OPERATOR", CAP_SHIPMENT_TRANSIT, (evidence,), "2026-08-24T00:00:03Z", f"transit:{intent.intent_id}:{batch}")
        self._effects[t.idempotency_key] = t
        return t
