from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

from .canonicalize import payload_digest


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    errors: tuple[str, ...]
    digest_matches: bool


def default_schema_path() -> Path:
    return Path(__file__).resolve().parents[3] / "qel-spec" / "core" / "qel-core.schema.json"


def load_schema(path: str | Path | None = None) -> dict[str, Any]:
    schema_path = Path(path) if path else default_schema_path()
    with schema_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_expression(expression: dict[str, Any], schema: dict[str, Any]) -> ValidationResult:
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = tuple(
        f"{'.'.join(str(part) for part in error.absolute_path) or '<root>'}: {error.message}"
        for error in sorted(validator.iter_errors(expression), key=lambda item: list(item.absolute_path))
    )

    expected = payload_digest(expression)
    proofs = expression.get("proof", [])
    digest_matches = bool(proofs) and all(proof.get("payload_digest") == expected for proof in proofs)

    if not digest_matches:
        errors = (*errors, "proof: payload_digest does not match canonical payload")

    return ValidationResult(valid=not errors, errors=errors, digest_matches=digest_matches)
