import json

from qel_tn01.report import run_conformance


def main() -> int:
    report = run_conformance()
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["overall"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
