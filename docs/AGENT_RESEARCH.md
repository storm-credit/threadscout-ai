# Agent-Orchestration Research

Reviewed on 2026-08-08 from the projects' current GitHub repositories. The purpose is to select principles, not copy code or adopt a framework prematurely.

## Evaluation criteria

- explicit state and handoff control
- human approval and interruption
- structured outputs and guardrails
- tracing and auditability
- JavaScript compatibility
- runtime and dependency cost
- ability to keep exactly six named agents
- suitability for a small approval-first product

## LangGraph

Repository: `langchain-ai/langgraph`

Observed strengths:

- low-level stateful orchestration
- durable execution and recovery
- human-in-the-loop interruption
- memory and execution tracing
- graph and subgraph patterns

Adopted principles:

- explicit stage graph
- persistent run state
- bounded loops
- human interruption before irreversible action

Not adopted now:

- runtime dependency
- deployment stack
- framework-specific state types

Reason: the current prototype can validate its contracts with a small deterministic state machine. A framework becomes justified only when runs are long-lived, resumable across processes, or distributed.

## CrewAI

Repository: `crewAIInc/crewAI`

Observed strengths:

- role, goal, tool, and task definitions
- distinction between autonomous crews and controlled flows
- event-driven flow composition
- human review and structured task outputs

Adopted principles:

- every agent has a narrow role and owned artifact
- controlled flow is preferred over free-form agent conversation
- agents do not automatically gain every tool

Not adopted now:

- Python runtime
- free-form crew collaboration
- cloud control plane

Reason: ThreadScout is a JavaScript project and requires central routing, not an autonomous discussion among agents.

## OpenAI Agents SDK for JavaScript/TypeScript

Repository: `openai/openai-agents-js`

Observed strengths:

- lightweight agents with instructions and tools
- agents-as-tools and handoffs
- input/output guardrails
- human-in-the-loop support
- sessions and tracing

Adopted principles:

- tool allowlists per agent
- guardrails at every handoff
- tracing as a first-class requirement
- specialist invocation through a central orchestrator

Deferred:

- package installation and model calls

Reason: the current SDK documentation requires Node.js 22 or later, while ThreadScout currently supports Node.js 20 and has no runtime model dependency. The framework-neutral contracts should be proven first. If the project later moves to Node 22, this is the leading JavaScript adapter candidate.

## Microsoft AutoGen

Repository: `microsoft/autogen`

Current repository status observed:

- maintenance mode
- new users are directed to Microsoft Agent Framework

Decision:

- do not adopt AutoGen for a new implementation

Useful retained lesson:

- agents can be exposed as tools to a coordinator, but tool trust and execution boundaries must be explicit.

## Existing project references

### Karpathy-inspired guidelines

Retained:

- surface assumptions and confusion
- simplicity before abstraction
- surgical changes
- goal-driven verification

### Superpowers

Retained:

- design before implementation
- small plans and verification steps
- independent review
- evidence before completion claims

### agentmemory

Retained:

- durable decision log
- explicit lifecycle and confidence
- searchable evidence instead of repeated re-explanation

## Architecture decision

Build a **framework-neutral, deterministic orchestrator** with a fixed six-agent registry and structured artifact contracts.

Do not add an agent framework dependency during this phase.

Re-evaluate a runtime adapter when at least one of these becomes true:

- real LLM calls are introduced
- runs must resume after process failure
- multiple runs execute concurrently
- cross-process queues are required
- tracing cannot be maintained reliably in the custom state machine

Preferred future evaluation order:

1. OpenAI Agents SDK JS after a Node 22 migration
2. LangGraph.js if durable graph execution is required
3. another framework only after a four-option comparison
