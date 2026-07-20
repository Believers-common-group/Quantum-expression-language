from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .canonicalize import canonical_json, payload_digest
from .validate import load_schema, validate_expression


def read_expression(path: str) -> dict[str, Any]:
    with Path(path).open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError("QEL expression must be a JSON object")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(prog="qel")
    parser.add_argument("command", choices=["validate", "canonicalize", "hash", "verify-digest"])
    parser.add_argument("file")
    parser.add_argument("--schema")
    args = parser.parse_args()

    expression = read_expression(args.file)

    if args.command == "canonicalize":
        print(canonical_json(expression))
        return 0

    if args.command == "hash":
        print(payload_digest(expression))
        return 0

    result = validate_expression(expression, load_schema(args.schema))

    if args.command == "verify-digest":
        print("valid" if result.digest_matches else "invalid")
        return 0 if result.digest_matches else 1

    if result.valid:
        print("valid")
        return 0

    print("invalid")
    for error in result.errors:
        print(f"- {error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
