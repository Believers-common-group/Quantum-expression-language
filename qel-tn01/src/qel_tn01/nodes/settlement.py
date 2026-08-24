from dataclasses import dataclass

from qel_tn01.contracts import EvidenceRef, Intent, Transition, VerificationStatus
from qel_tn01.errors import QelError, QelErrorCode
from qel_tn01.fixtures import CAP_OBLIGATION_VERIFY, CAP_PAYMENT_INITIATE, CAP_SETTLEMENT_CONFIRM, MANIFEST_D, NODE_D
from qel_tn01.trust import digest


@dataclass
class PaymentInstruction:
    instruction_id: str
    obligation_ref: str
    amount_units: int
    status_code: str


@dataclass
class CreditConfirmation:
    confirmation_id: str
    instruction_id: str
    credited_units: int


class SettlementNode:
    def __init__(self) -> None:
        self.instructions: dict[str, PaymentInstruction] = {}
        self.confirmations: dict[str, CreditConfirmation] = {}
        self.obligations: dict[str, str] = {}

    def manifest(self):
        return MANIFEST_D

    def authorize(self, intent: Intent) -> QelError | None:
        required = "SETTLEMENT_OPERATOR" if CAP_OBLIGATION_VERIFY in intent.required_capabilities else "PAYMENT_AUTHORITY"
        if required in intent.authority_refs:
            return None
        return QelError(QelErrorCode.AUTHORITY_UNRESOLVED, intent.intent_id, required, ",".join(intent.authority_refs), "HIGH", False, ("REQUEST_SETTLEMENT_AUTHORITY",))

    def verify_obligation(self, intent: Intent, qty: int) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        self.obligations[batch] = "VERIFIED"
        evidence = EvidenceRef(f"E-OBL-{batch}", "ACCEPTANCE_PROOF", NODE_D, NODE_D, "2026-08-24T00:00:06Z", digest((batch, qty, "VERIFIED")), f"payment-sim://receipt/obligation-{batch}", "FEDERATED", VerificationStatus.VERIFIED)
        return Transition(f"T-OBL-{batch}", batch, "ACCEPTED", "qel:action:obligation-verify", "OBLIGATION_VERIFIED", intent.actor, "SETTLEMENT_OPERATOR", CAP_OBLIGATION_VERIFY, (evidence,), "2026-08-24T00:00:06Z", f"obligation:{intent.intent_id}:{batch}")

    def initiate_payment(self, intent: Intent, qty: int) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        p = PaymentInstruction(f"PI-{batch}", f"OBL-{batch}", qty, "INITIATED")
        self.instructions[p.instruction_id] = p
        evidence = EvidenceRef(f"E-{p.instruction_id}", "PAYMENT_INSTRUCTION", NODE_D, NODE_D, "2026-08-24T00:00:07Z", digest(p), f"payment-sim://receipt/{p.instruction_id}", "RESTRICTED", VerificationStatus.VERIFIED)
        return Transition(f"T-{p.instruction_id}", batch, "OBLIGATION_VERIFIED", "qel:action:payment-initiate", "PAYMENT_INITIATED", intent.actor, "PAYMENT_AUTHORITY", CAP_PAYMENT_INITIATE, (evidence,), "2026-08-24T00:00:07Z", f"payment:{intent.intent_id}:{batch}")

    def confirm_settlement(self, intent: Intent, qty: int) -> Transition | QelError:
        error = self.authorize(intent)
        if error:
            return error
        batch = intent.object_refs[0]
        p = self.instructions[f"PI-{batch}"]
        p.status_code = "SETTLED"
        c = CreditConfirmation(f"CC-{batch}", p.instruction_id, qty)
        self.confirmations[c.confirmation_id] = c
        evidence = EvidenceRef(f"E-{c.confirmation_id}", "CREDIT_CONFIRMATION", NODE_D, NODE_D, "2026-08-24T00:00:08Z", digest(c), f"payment-sim://receipt/{c.confirmation_id}", "RESTRICTED", VerificationStatus.VERIFIED)
        return Transition(f"T-{c.confirmation_id}", batch, "PAYMENT_INITIATED", "qel:action:settlement-confirm", "SETTLED", intent.actor, "PAYMENT_AUTHORITY", CAP_SETTLEMENT_CONFIRM, (evidence,), "2026-08-24T00:00:08Z", f"settle:{intent.intent_id}:{batch}")
