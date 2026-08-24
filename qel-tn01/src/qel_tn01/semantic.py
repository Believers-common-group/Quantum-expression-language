from .contracts import Mapping, MappingType, SemanticDiff
from .errors import QelError
from .trust import verify_digest


def validate_mapping(mapping: Mapping, trusted_digest: str) -> QelError | None:
    return verify_digest(mapping, trusted_digest)


def semantic_diff(left: str, right: str) -> SemanticDiff:
    if {left, right} == {"factory:RELEASED", "logistics:PICKED_UP"}:
        return SemanticDiff(
            left=left,
            right=right,
            shared_meaning="goods are in transfer workflow",
            differences=("PICKED_UP additionally asserts physical custody by carrier",),
            risk="premature custody attribution",
            mapping_type=MappingType.PARTIAL,
            safe_for_automatic_translation=False,
            required_resolution="CUSTODY_EVIDENCE",
        )
    if {left, right} == {"store:GRN_CREATED", "qel:state:accepted"}:
        return SemanticDiff(
            left=left,
            right=right,
            shared_meaning="store-side receipt workflow",
            differences=("GRN creation does not establish commercial acceptance",),
            risk="premature commercial obligation",
            mapping_type=MappingType.UNRESOLVED,
            safe_for_automatic_translation=False,
            required_resolution="SIGNED_ACCEPTANCE",
        )
    if left == right:
        return SemanticDiff(left, right, left, (), "NONE", MappingType.EXACT, True, None)
    return SemanticDiff(left, right, "unknown", ("no validated mapping",), "semantic ambiguity", MappingType.UNRESOLVED, False, "REVIEW")
