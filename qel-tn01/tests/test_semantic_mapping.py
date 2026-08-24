from dataclasses import replace

from qel_tn01.contracts import MappingType, VerificationStatus
from qel_tn01.errors import QelErrorCode
from qel_tn01.fixtures import LOCAL_MAPPINGS
from qel_tn01.semantic import semantic_diff, validate_mapping
from qel_tn01.trust import digest


def test_factory_released_and_logistics_picked_up_are_partial_not_equivalent():
    diff = semantic_diff("factory:RELEASED", "logistics:PICKED_UP")
    assert diff.mapping_type is MappingType.PARTIAL
    assert diff.safe_for_automatic_translation is False
    assert "physical custody" in diff.differences[0].lower()


def test_grn_created_is_not_custody_accepted():
    diff = semantic_diff("store:GRN_CREATED", "qel:state:accepted")
    assert diff.mapping_type is MappingType.UNRESOLVED
    assert diff.safe_for_automatic_translation is False


def test_poisoned_mapping_digest_is_rejected():
    trusted = LOCAL_MAPPINGS["store:GRN"]
    expected = digest(trusted)
    poisoned = replace(trusted, target_qel_id="qel:state:accepted")
    error = validate_mapping(poisoned, expected)
    assert error.code is QelErrorCode.SIGNATURE_INVALID


def test_local_labels_map_to_canonical_ids_not_other_local_labels():
    assert LOCAL_MAPPINGS["factory:stock_issue"].target_qel_id == "qel:action:custody-release"
    assert LOCAL_MAPPINGS["logistics:pickup"].target_qel_id == "qel:action:custody-accept"
    assert all(m.validation_status is VerificationStatus.VERIFIED for m in LOCAL_MAPPINGS.values())
