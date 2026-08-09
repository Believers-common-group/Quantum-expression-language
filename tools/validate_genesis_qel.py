#!/usr/bin/env python3
"""Validate Genesis QEL executable expression packs.

Usage:
    python3 tools/validate_genesis_qel.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "genesis" / "executable-profile" / "qel-executable-expression.schema.json"
PACK_PATH = ROOT / "genesis" / "lenseos" / "lenseos-expressions.json"
EXPECTED_CHANGE = "GEN-CHG-20260809-LENSEOS-001"
EXPECTED_SOURCE = "LENSEOS-SOURCE"
EXPECTED_SOURCE_VERSION = "0.1.0"
EXPECTED_IDS = {f"QEL-LNS-{i:03d}" for i in range(1, 7)}
ALLOWED_REGISTRY_REFS = {f"BCR-{i:04d}" for i in range(11, 19)}


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {path}: {exc}") from exc


def main() -> int:
    if not SCHEMA_PATH.exists() or not PACK_PATH.exists():
        print("Genesis QEL schema or LENSEOS expression pack is missing.", file=sys.stderr)
        return 2

    schema = load_json(SCHEMA_PATH)
    pack = load_json(PACK_PATH)

    try:
        from jsonschema import Draft202012Validator
    except ImportError as exc:
        print("jsonschema is required for Genesis QEL validation.", file=sys.stderr)
        raise SystemExit(2) from exc

    errors: list[str] = []
    expressions = pack.get("expressions")
    if not isinstance(expressions, list):
        errors.append("pack.expressions must be an array")
        expressions = []

    if pack.get("change_id") != EXPECTED_CHANGE:
        errors.append(f"pack.change_id must be {EXPECTED_CHANGE}")

    validator = Draft202012Validator(schema)
    seen_ids: set[str] = set()

    for index, expression in enumerate(expressions):
        prefix = f"expressions[{index}]"
        for error in sorted(validator.iter_errors(expression), key=lambda err: list(err.path)):
            path = "/".join(map(str, error.path)) or "<root>"
            errors.append(f"{prefix}/{path}: {error.message}")

        expression_id = expression.get("expression_id")
        if isinstance(expression_id, str):
            if expression_id in seen_ids:
                errors.append(f"duplicate expression_id: {expression_id}")
            seen_ids.add(expression_id)

        if expression.get("change_id") != EXPECTED_CHANGE:
            errors.append(f"{prefix}: wrong change_id")

        lineage = expression.get("lineage", {})
        if lineage.get("source_ref") != EXPECTED_SOURCE:
            errors.append(f"{prefix}: source_ref must be {EXPECTED_SOURCE}")
        if lineage.get("source_version") != EXPECTED_SOURCE_VERSION:
            errors.append(f"{prefix}: source_version must be {EXPECTED_SOURCE_VERSION}")

        refs = set(lineage.get("registry_refs", []))
        unknown_refs = {ref for ref in refs if ref.startswith("BCR-") and ref not in ALLOWED_REGISTRY_REFS}
        if unknown_refs:
            errors.append(f"{prefix}: unexpected LENSEOS Registry refs: {sorted(unknown_refs)}")

        safety = expression.get("safety", {})
        if safety.get("direct_raw_actuation_allowed") is not False:
            errors.append(f"{prefix}: raw actuation must remain forbidden")
        if safety.get("deterministic_safety_required") is not True:
            errors.append(f"{prefix}: deterministic safety must be required")

        under = expression.get("under", {})
        authority_refs = set(under.get("authority_refs", []))
        if safety.get("warden_required") is True and "WARDEN-LENSEOS-001" not in authority_refs:
            errors.append(f"{prefix}: Warden-required expression must reference WARDEN-LENSEOS-001")

        producing = expression.get("producing", {})
        if "evidence" not in producing or "cost" not in producing or "timestamp_mode" not in producing:
            errors.append(f"{prefix}: PRODUCING must preserve evidence, cost and timestamp semantics")

    if seen_ids != EXPECTED_IDS:
        errors.append(f"expression set must be exactly {sorted(EXPECTED_IDS)}; found {sorted(seen_ids)}")

    if errors:
        print("Genesis QEL validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Genesis QEL validation passed: {len(expressions)} LENSEOS expressions checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
