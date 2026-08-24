from __future__ import annotations

import hashlib
import json
from dataclasses import fields, is_dataclass
from enum import Enum
from typing import Any

from .contracts import Capability, NodeManifest
from .errors import QelError, QelErrorCode


def _primitive(value: Any) -> Any:
    if is_dataclass(value):
        return {f.name: _primitive(getattr(value, f.name)) for f in fields(value)}
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, tuple):
        return [_primitive(v) for v in value]
    if isinstance(value, list):
        return [_primitive(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _primitive(v) for k, v in sorted(value.items(), key=lambda kv: str(kv[0]))}
    return value


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(_primitive(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def digest(value: Any) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def verify_digest(value: Any, expected_digest: str) -> QelError | None:
    observed = digest(value)
    if observed == expected_digest:
        return None
    return QelError(
        QelErrorCode.SIGNATURE_INVALID,
        "integrity",
        expected_digest,
        observed,
        "HIGH",
        False,
        ("QUARANTINE",),
    )


def verify_namespace(namespace: str, trusted_roots: tuple[str, ...]) -> QelError | None:
    if namespace in trusted_roots or any(namespace.startswith(root + ":") for root in trusted_roots):
        return None
    return QelError(
        QelErrorCode.NAMESPACE_UNTRUSTED,
        namespace,
        "trusted namespace root",
        namespace,
        "HIGH",
        False,
        ("REVIEW_NAMESPACE",),
    )


def _version_tuple(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split("."))


def verify_version(version: str, minimum: str) -> QelError | None:
    if _version_tuple(version) >= _version_tuple(minimum):
        return None
    return QelError(
        QelErrorCode.VERSION_CONFLICT,
        version,
        f">={minimum}",
        version,
        "HIGH",
        True,
        ("UPGRADE", "REVIEW_COMPATIBILITY"),
    )


def negotiate_capability(manifest: NodeManifest, capability_id: str) -> Capability | QelError:
    for capability in manifest.capabilities:
        if capability.capability_id == capability_id:
            return capability
    return QelError(
        QelErrorCode.CAPABILITY_MISMATCH,
        capability_id,
        "published canonical capability",
        "unpublished capability",
        "HIGH",
        False,
        ("DISCOVER_CAPABILITIES",),
    )
