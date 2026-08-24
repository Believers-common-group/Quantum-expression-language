import inspect

from qel_tn01.contracts import Intent, Transition
from qel_tn01.errors import QelError, QelErrorCode
from qel_tn01.fixtures import CAP_INVENTORY_RELEASE
from qel_tn01.nodes.factory import FactoryNode, FactoryBatchRecord, DispatchNote
from qel_tn01.nodes.logistics import LogisticsNode, CarrierConsignment, PickupReceipt
from qel_tn01.nodes.store import StoreNode, StoreGRN, StoreAcceptanceRecord
from qel_tn01.nodes.settlement import SettlementNode, PaymentInstruction, CreditConfirmation


def test_nodes_use_distinct_local_record_classes():
    classes = [FactoryBatchRecord, CarrierConsignment, StoreGRN, PaymentInstruction]
    assert len({c.__module__ for c in classes}) == 4
    assert all(len(c.__bases__) == 1 and c.__bases__[0] is object for c in classes)


def test_factory_local_schema_has_dispatch_note_not_consignment():
    assert "dispatch_note_no" in DispatchNote.__dataclass_fields__
    assert "consignment_no" not in DispatchNote.__dataclass_fields__


def test_logistics_local_schema_has_consignment_not_dispatch_note():
    assert "consignment_no" in CarrierConsignment.__dataclass_fields__
    assert "dispatch_note_no" not in CarrierConsignment.__dataclass_fields__


def test_store_distinguishes_grn_from_acceptance():
    assert StoreGRN is not StoreAcceptanceRecord
    assert "received_qty" in StoreGRN.__dataclass_fields__
    assert "accepted_qty" in StoreAcceptanceRecord.__dataclass_fields__


def test_settlement_has_payment_instruction_and_credit_confirmation():
    assert "instruction_id" in PaymentInstruction.__dataclass_fields__
    assert "confirmation_id" in CreditConfirmation.__dataclass_fields__


def test_intent_does_not_execute_without_local_authorization():
    factory = FactoryNode()
    factory.allocate("B420", 420)
    intent = Intent(
        "I-BAD", "actor-a", "qel:action:custody-release", ("B420",),
        ("ALLOCATED", "RELEASED"), ("WRONG_AUTH",), (CAP_INVENTORY_RELEASE,),
    )
    result = factory.release(intent)
    assert isinstance(result, QelError)
    assert result.code is QelErrorCode.AUTHORITY_UNRESOLVED
    assert factory.batches["B420"].state == "ALLOCATED"


def test_network_does_not_import_node_local_business_record_classes():
    import qel_tn01.network as network
    source = inspect.getsource(network)
    forbidden = ("FactoryBatchRecord", "DispatchNote", "CarrierConsignment", "PickupReceipt", "StoreGRN", "StoreAcceptanceRecord", "PaymentInstruction", "CreditConfirmation")
    assert all(name not in source for name in forbidden)


def test_intent_contract_never_gains_authorized_field():
    from qel_tn01.contracts import Intent
    assert "authorized" not in Intent.__dataclass_fields__
