from dataclasses import dataclass

from qel_tn01.contracts import EvidenceRef, Intent, Transition, VerificationStatus
from qel_tn01.errors import QelError, QelErrorCode
from qel_tn01.fixtures import CAP_INVENTORY_RELEASE, MANIFEST_A, NODE_A
from qel_tn01.trust import digest


@dataclass
class FactoryBatchRecord:
    batch_code: str
    allocated_qty: int
    state: str


@dataclass
class DispatchNote:
    dispatch_note_no: str
    batch_code: str
    released_qty: int


class FactoryNode:
    def __init__(self) -> None:
        self.batches: dict[str, FactoryBatchRecord] = {}
        self.dispatch_notes: dict[str, DispatchNote] = {}
        self._effects: dict[str, Transition] = {}

    def manifest(self):
        return MANIFEST_A

    def allocate(self, batch_code: str, qty: int) -> FactoryBatchRecord:
        rec = FactoryBatchRecord(batch_code, qty, "ALLOCATED")
        self.batches[batch_code] = rec
        return rec

    def authorize(self, intent: Intent) -> QelError | None:
        if "DISPATCH_AUTHORITY" in intent.authority_refs and CAP_INVENTORY_RELEASE in intent.required_capabilities:
            return None
        return QelError(QelErrorCode.AUTHORITY_UNRESOLVED, intent.intent_id, "DISPATCH_AUTHORITY", ",".join(intent.authority_refs), "HIGH", False, ("REQUEST_DISPATCH_APPROVAL",))

    def release(self, intent: Intent) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch_code = intent.object_refs[0]
        batch = self.batches[batch_code]
        key = f"release:{intent.intent_id}:{batch_code}"
        if key in self._effects:
            return QelError(QelErrorCode.DUPLICATE_EFFECT, key, "one effect", "duplicate effect", "MEDIUM", True, ("USE_EXISTING_TRANSITION",))
        note = DispatchNote(f"DN-{batch_code}", batch_code, batch.allocated_qty)
        self.dispatch_notes[note.dispatch_note_no] = note
        batch.state = "RELEASED"
        evidence = EvidenceRef(
            f"E-{note.dispatch_note_no}", "DISPATCH_CONFIRMATION", NODE_A, NODE_A,
            "2026-08-24T00:00:01Z", digest(note), f"factory://evidence/{note.dispatch_note_no}",
            "FEDERATED", VerificationStatus.VERIFIED,
        )
        transition = Transition(
            f"T-{note.dispatch_note_no}", batch_code, "ALLOCATED", "qel:action:custody-release",
            "RELEASED", intent.actor, "DISPATCH_AUTHORITY", CAP_INVENTORY_RELEASE,
            (evidence,), "2026-08-24T00:00:01Z", key,
        )
        self._effects[key] = transition
        return transition
