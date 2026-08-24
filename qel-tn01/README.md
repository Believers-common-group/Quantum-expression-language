# QEL TN-01

Executable local proof for **QEL Interoperability Proof 001**: a bounded 420-unit Factory → Logistics → Store → Settlement transaction across four independently modeled nodes.

## Run

Install the local package once:

```bash
python -m pip install -e . --no-build-isolation
```

Then run the test suite and proof runner:

```bash
python -m pytest -q
python -m qel_tn01.cli
```

The CLI emits a machine-readable conformance report. `overall: PASS` means the bounded TN-01 interoperability test passed; it is **not** production-readiness, legal-compliance, payment-network, or universal QEL certification.
