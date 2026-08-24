from .contracts import Capability, EffectClass, NodeManifest

NODE_A = "TN01-NODE-A-FACTORY"
NODE_B = "TN01-NODE-B-LOGISTICS"
NODE_C = "TN01-NODE-C-STORE"
NODE_D = "TN01-NODE-D-SETTLEMENT"
TRANSACTION_ID = "QEL-TN01-TX-0001"
FIXTURE_QUANTITY = 420

TRUSTED_NAMESPACES = ("qel:core", "qel:domain", "qel:institution")

CAP_INVENTORY_RELEASE = "qel:capability:inventory:release"
CAP_CUSTODY_ACCEPT = "qel:capability:custody:accept"
CAP_SHIPMENT_TRANSIT = "qel:capability:shipment:transit"
CAP_STORE_RECEIVE = "qel:capability:store:receive"
CAP_STORE_ACCEPT = "qel:capability:store:accept"
CAP_OBLIGATION_VERIFY = "qel:capability:obligation:verify"
CAP_PAYMENT_INITIATE = "qel:capability:payment:initiate"
CAP_SETTLEMENT_CONFIRM = "qel:capability:settlement:confirm"
CAP_SETTLEMENT_REVERSE = "qel:capability:settlement:reverse"


def _cap(capability_id: str, action: str, provider: str, effect: EffectClass, authority: str, evidence: str) -> Capability:
    return Capability(
        capability_id=capability_id,
        action_type=action,
        provider=provider,
        input_schema="qel:core:intent:v1",
        output_schema="qel:core:transition:v1",
        effect_class=effect,
        authority_requirements=(authority,),
        evidence_requirements=(evidence,),
        side_effects=("STATE_CHANGE",) if effect >= EffectClass.E4 else (),
        version="1.1",
    )


MANIFEST_A = NodeManifest(
    NODE_A, ("1.0", "1.1"), "QEL-C5",
    ("qel:core", "qel:domain:manufacturing", "qel:institution:factory-test"),
    (_cap(CAP_INVENTORY_RELEASE, "qel:action:custody-release", NODE_A, EffectClass.E4, "DISPATCH_AUTHORITY", "DISPATCH_CONFIRMATION"),),
    ("SCAN", "PHOTO"), ("LOCAL_RBAC",), True, "SIGNED-MAPPINGS",
)
MANIFEST_B = NodeManifest(
    NODE_B, ("1.0", "1.1"), "QEL-C5",
    ("qel:core", "qel:domain:logistics", "qel:institution:carrier-test"),
    (
        _cap(CAP_CUSTODY_ACCEPT, "qel:action:custody-accept", NODE_B, EffectClass.E4, "CARRIER_OPERATOR", "HANDOVER_SCAN"),
        _cap(CAP_SHIPMENT_TRANSIT, "qel:action:shipment-transit", NODE_B, EffectClass.E4, "CARRIER_OPERATOR", "TRANSIT_EVENT"),
    ),
    ("SCAN", "SIGNATURE", "GEOLOCATION_ATTESTATION"), ("LOCAL_POLICY",), True, "SIGNED-MAPPINGS",
)
MANIFEST_C = NodeManifest(
    NODE_C, ("1.0", "1.1"), "QEL-C5",
    ("qel:core", "qel:domain:retail", "qel:institution:store-test"),
    (
        _cap(CAP_STORE_RECEIVE, "qel:action:physical-receive", NODE_C, EffectClass.E4, "RECEIVING_OPERATOR", "GRN"),
        _cap(CAP_STORE_ACCEPT, "qel:action:commercial-accept", NODE_C, EffectClass.E6, "LOCATION_MANAGER", "SIGNED_ACCEPTANCE"),
    ),
    ("ERP_AUDIT", "SIGNATURE"), ("LOCAL_RBAC",), True, "SIGNED-MAPPINGS",
)
MANIFEST_D = NodeManifest(
    NODE_D, ("1.0", "1.1"), "QEL-C5",
    ("qel:core", "qel:domain:finance", "qel:institution:settlement-test"),
    (
        _cap(CAP_OBLIGATION_VERIFY, "qel:action:obligation-verify", NODE_D, EffectClass.E6, "SETTLEMENT_OPERATOR", "ACCEPTANCE_PROOF"),
        _cap(CAP_PAYMENT_INITIATE, "qel:action:payment-initiate", NODE_D, EffectClass.E7, "PAYMENT_AUTHORITY", "PAYMENT_INSTRUCTION"),
        _cap(CAP_SETTLEMENT_CONFIRM, "qel:action:settlement-confirm", NODE_D, EffectClass.E7, "PAYMENT_AUTHORITY", "CREDIT_CONFIRMATION"),
    ),
    ("PAYMENT_RECEIPT",), ("SIMULATED_BANK_AUTH",), True, "HIGH-ASSURANCE-SIM",
)

from .contracts import Mapping, MappingType, VerificationStatus


def _mapping(local: str, target: str, mapping_type: MappingType = MappingType.EXACT) -> Mapping:
    namespace = local.split(":", 1)[0]
    return Mapping(
        mapping_id=f"map:{local}",
        source_namespace=namespace,
        source_object=local,
        target_qel_id=target,
        mapping_type=mapping_type,
        transformation=None,
        applicability="TN-01",
        confidence=1.0,
        maintainer="BC-QEL-TN01",
        validation_status=VerificationStatus.VERIFIED,
        version="1.1",
    )


LOCAL_MAPPINGS = {
    "factory:dispatch_note": _mapping("factory:dispatch_note", "qel:event:custody-release"),
    "factory:batch_release": _mapping("factory:batch_release", "qel:state:released"),
    "factory:stock_issue": _mapping("factory:stock_issue", "qel:action:custody-release"),
    "logistics:consignment": _mapping("logistics:consignment", "qel:shipment"),
    "logistics:pickup": _mapping("logistics:pickup", "qel:action:custody-accept"),
    "store:GRN": _mapping("store:GRN", "qel:event:physical-receipt"),
    "store:goods_received": _mapping("store:goods_received", "qel:state:received"),
    "store:acceptance": _mapping("store:acceptance", "qel:state:accepted"),
    "settlement:payment_instruction": _mapping("settlement:payment_instruction", "qel:payment"),
    "settlement:credit_confirmation": _mapping("settlement:credit_confirmation", "qel:event:settlement-confirmation"),
}
