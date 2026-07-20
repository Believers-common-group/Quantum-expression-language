from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from typing import Any


def _payload_without_proof(expression: dict[str, Any]) -> dict[str, Any]:
    payload = deepcopy(expression)
    payload.pop("proof", None)
    return payload


def canonical_json(expression: dict[str, Any], *, include_proof: bool = True) -> str:
    value = expression if include_proof else _payload_without_proof(expression)
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def canonical_bytes(expression: dict[str, Any], *, include_proof: bool = True) -> bytes:
    return canonical_json(expression, include_proof=include_proof).encode("utf-8")


def payload_digest(expression: dict[str, Any]) -> str:
    digest = hashlib.sha256(canonical_bytes(expression, include_proof=False)).hexdigest()
    return f"sha256:{digest}"
