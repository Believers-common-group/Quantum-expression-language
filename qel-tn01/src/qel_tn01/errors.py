from dataclasses import dataclass
from enum import Enum


class QelErrorCode(str, Enum):
    UNKNOWN_CONCEPT = "QEL_ERR_UNKNOWN_CONCEPT"
    VERSION_CONFLICT = "QEL_ERR_VERSION_CONFLICT"
    MAPPING_AMBIGUOUS = "QEL_ERR_MAPPING_AMBIGUOUS"
    AUTHORITY_UNRESOLVED = "QEL_ERR_AUTHORITY_UNRESOLVED"
    EVIDENCE_INSUFFICIENT = "QEL_ERR_EVIDENCE_INSUFFICIENT"
    STATE_CONFLICT = "QEL_ERR_STATE_CONFLICT"
    NAMESPACE_UNTRUSTED = "QEL_ERR_NAMESPACE_UNTRUSTED"
    CAPABILITY_MISMATCH = "QEL_ERR_CAPABILITY_MISMATCH"
    JURISDICTION_CONFLICT = "QEL_ERR_JURISDICTION_CONFLICT"
    SIGNATURE_INVALID = "QEL_ERR_SIGNATURE_INVALID"
    DUPLICATE_EFFECT = "QEL_ERR_DUPLICATE_EFFECT"


@dataclass(frozen=True)
class QelError:
    code: QelErrorCode
    affected_object: str
    expected_semantics: str
    observed_semantics: str
    severity: str
    recoverable: bool
    resolution_paths: tuple[str, ...]
