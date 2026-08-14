# Security Architecture v1

Status: DESIGN ONLY.

## Trust boundaries

- browser/user session
- application API
- background worker/orchestrator
- model/provider adapters
- external source adapters
- durable state/evidence store
- future publishing adapter

## Core rules

1. the client cannot directly set verified, Guardian-pass, approved, or published states
2. external credentials are never stored in prompts, artifacts, source records, Git, or user-visible diagnostics
3. each adapter receives only the permissions needed for its specific role
4. model agents never receive a generic unrestricted action interface
5. source/evidence records are normalized and minimized before downstream use
6. review and schedule records reference immutable artifact versions
7. sensitive state-changing actions are audit logged
8. globally disabling an external action path takes precedence over scheduled work

## Single-user MVP authentication

The first release may use a simple single-owner authentication model, but authenticated identity and review actor must still be explicit. “Single user” does not mean “no authentication boundary” in a network deployment.

## Data protection

Separate operational user/account data from research evidence. Retain only fields needed for the product workflow, apply the configured retention period, and avoid storing unnecessary third-party media bytes.

## Agent boundary

Agents cannot grant themselves new tools, change roster size, bypass stale checks, or elevate a candidate state. The Orchestrator and deterministic services validate every artifact/state transition.

## Future security review gate

Before production deployment, verify the chosen hosting, authentication, credential storage, network egress, backup, retention, and incident-recovery configuration against this design.
