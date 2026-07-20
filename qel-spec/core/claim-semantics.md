# QEL Claim Semantics

## Expression model

A QEL expression is an immutable statement issued by an identifiable issuer. It may describe an observation, action, state transition, authorization, or attestation.

## Required distinction of roles

- `issuer`: entity issuing and signing the expression.
- `actor`: entity that performed the described action, when applicable.
- `subject`: entity or object about which the claim is made.
- `observer`: entity or device that witnessed or measured the occurrence, when applicable.
- `beneficiary`: entity receiving the entitlement or outcome, when applicable.

An issuer may occupy another role, but the roles must not be silently conflated.

## Lifecycle

Core lifecycle states are:

- `proposed`
- `asserted`
- `attested`
- `verified`
- `accepted`
- `disputed`
- `corrected`
- `revoked`
- `superseded`
- `rejected`

`verified` means that defined verification procedures completed; it does not mean universal factual truth.

## Time

- `occurred_at`: time of the described real-world occurrence.
- `observed_at`: time the occurrence was measured or witnessed.
- `issued_at`: time the expression was created.
- `effective_from` and `effective_until`: optional legal or operational validity interval.

## Relationships

Expressions may be connected using `authorizes`, `caused_by`, `attests`, `corrects`, `disputes`, `revokes`, and `supersedes`.

Historical expressions are never mutated to hide correction or revocation. A new expression records the new institutional state.

## Validation layers

A consumer must evaluate separately:

1. schema validity;
2. canonicalization and digest integrity;
3. proof verification;
4. authority scope and validity;
5. evidence sufficiency;
6. policy acceptance;
7. dispute and supersession state.
