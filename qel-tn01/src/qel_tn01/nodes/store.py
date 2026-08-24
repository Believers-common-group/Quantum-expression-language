from dataclasses import dataclass

from qel_tn01.contracts import EvidenceRef, Intent, Transition, VerificationStatus
from qel_tn01.errors import QelError, QelErrorCode
from qel_tn01.fixtures import CAP_STORE_ACCEPT, CAP_STORE_RECEIVE, MANIFEST_C, NODE_C
from qel_tn01.trust import digest


@dataclass
class StoreGRN:
    grn_no: str
    shipment_ref: str
    received_qty: int


@dataclass
class StoreAcceptanceRecord:
    acceptance_no: str
    grn_no: str
    accepted_qty: int
    manager_ref: str


class StoreNode:
    def __init__(self) -> None:
        self.grns: dict[str, StoreGRN] = {}
        self.acceptances: dict[str, StoreAcceptanceRecord] = {}

    def manifest(self):
        return MANIFEST_C

    def authorize(self, intent: Intent) -> QelError | None:
        required = "LOCATION_MANAGER" if CAP_STORE_ACCEPT in intent.required_capabilities else "RECEIVING_OPERATOR"
        if required in intent.authority_refs:
            return None
        return QelError(QelErrorCode.AUTHORITY_UNRESOLVED, intent.intent_id, required, ",".join(intent.authority_refs), "HIGH", False, ("REQUEST_STORE_AUTHORITY",))

    def receive(self, intent: Intent, qty: int) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        grn = StoreGRN(f"GRN-{batch}", f"CN-{batch}", qty)
        self.grns[grn.grn_no] = grn
        evidence = EvidenceRef(f"E-{grn.grn_no}", "GRN", NODE_C, NODE_C, "2026-08-24T00:00:04Z", digest(grn), f"erp-audit://grn/{grn.grn_no}", "FEDERATED", VerificationStatus.VERIFIED)
        return Transition(f"T-{grn.grn_no}", batch, "IN_TRANSIT", "qel:action:physical-receive", "RECEIVED", intent.actor, "RECEIVING_OPERATOR", CAP_STORE_RECEIVE, (evidence,), "2026-08-24T00:00:04Z", f"receive:{intent.intent_id}:{batch}")

    def accept(self, intent: Intent) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        grn = self.grns[f"GRN-{batch}"]
        rec = StoreAcceptanceRecord(f"ACC-{batch}", grn.grn_no, grn.received_qty, intent.actor)
        self.acceptances[rec.acceptance_no] = rec
        evidence = EvidenceRef(f"E-{rec.acceptance_no}", "SIGNED_ACCEPTANCE", NODE_C, NODE_C, "2026-08-24T00:00:05Z", digest(rec), f"erp-audit://acceptance/{rec.acceptance_no}", "FEDERATED", VerificationStatus.VERIFIED)
        return Transition(f"T-{rec.acceptance_no}", batch, "RECEIVED", "qel:action:commercial-accept", "ACCEPTED", intent.actor, "LOCATION_MANAGER", CAP_STORE_ACCEPT, (evidence,), "2026-08-24T00:00:05Z", f"accept:{intent.intent_id}:{batch}")
