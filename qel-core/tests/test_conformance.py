from __future__ import annotations

import json
from pathlib import Path

from qel_core.canonicalize import canonical_json, payload_digest
from qel_core.validate import load_schema, validate_expression

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / "qel-spec"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_voi_pilot_vectors_are_valid_and_digest_stable():
    schema = load_schema(SPEC / "core" / "qel-core.schema.json")
    files = sorted((SPEC / "examples" / "voi").glob("*.json"))
    assert len(files) == 5

    for path in files:
        expression = load(path)
        result = validate_expression(expression, schema)
        assert result.valid, f"{path.name}: {result.errors}"
        assert canonical_json(expression) == canonical_json(load(path))
        assert expression["proof"][0]["payload_digest"] == payload_digest(expression)


def test_invalid_vectors_fail():
    schema = load_schema(SPEC / "core" / "qel-core.schema.json")
    files = sorted((SPEC / "tests" / "invalid").glob("*.json"))
    assert files
    for path in files:
        assert not validate_expression(load(path), schema).valid, path.name
