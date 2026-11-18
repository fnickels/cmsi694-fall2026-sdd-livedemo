<!--
Sync Impact Report
- Version change: (unversioned template) → 1.0.0
- Modified principles (template placeholder → new title):
  - [PRINCIPLE_1_NAME] → I. Spec-First Development
  - [PRINCIPLE_2_NAME] → II. Test-First (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. Simplicity (YAGNI)
  - [PRINCIPLE_4_NAME] → IV. Code Quality & Readability
  - [PRINCIPLE_5_NAME] → V. User Experience Consistency
- Added principles: VI. Security & Privacy by Default, VII. Observability
- Added sections: Technology & Architecture Constraints, Development Workflow & Quality Gates
- Removed sections: none
- Deferred TODOs: none
-->
# CMSI 694 SDD Live Demo Fall 2026 Constitution

## Core Principles

### I. Spec-First Development

- Every feature MUST begin as a written specification (`/speckit-specify`) describing user
  value, user scenarios, and measurable acceptance criteria before any code is written.
- Implementation MUST be driven by an approved plan (`/speckit-plan`) and task list
  (`/speckit-tasks`); code that does not trace to a task in `tasks.md` MUST NOT be merged.
- When behavior changes, the spec MUST be updated first; specs and code MUST NOT drift.

Rationale: This project exists to demonstrate Spec-Driven Development; the spec is the source
of truth and code is its derived artifact.

### II. Test-First (NON-NEGOTIABLE)

- Tests MUST be written from the spec's acceptance criteria and MUST fail before the
  implementation that satisfies them is written (Red → Green → Refactor).
- Every user story MUST have at least one automated test proving its acceptance scenario.
- Every API endpoint MUST have contract tests covering success and documented error responses.
- The full test suite MUST pass before a change is merged.

Rationale: Tests derived from specs are the executable proof that the implementation
matches the specification.

### III. Simplicity (YAGNI)

- Build only what the current spec requires; speculative features, abstractions, and
  configuration MUST NOT be added.
- Prefer the standard library and platform features over new dependencies; each new
  dependency MUST be justified in the plan.
- Any added complexity (extra layers, services, patterns) MUST be recorded and justified
  in the plan's Complexity Tracking section.

Rationale: A small, understandable codebase is easier to teach, review, and evolve.

### IV. Code Quality & Readability

- Code MUST pass the project's configured linter and formatter with zero errors.
- Names MUST be descriptive; functions MUST have a single clear responsibility.
- Comments explain *why*, not *what*; dead code and commented-out code MUST be removed.
- Every change MUST be reviewed (human or agent-assisted) against this constitution
  before merge.

Rationale: Readable code lowers the cost of every future change and makes the demo
approachable for students.

### V. User Experience Consistency

- The frontend MUST use a single shared set of UI components, layout, and styling
  conventions; one-off styles for existing patterns are not permitted.
- User-facing errors MUST be clear, actionable, and consistent in tone and format.
- Interactive UI MUST meet WCAG 2.1 AA basics: keyboard navigable, labeled inputs,
  sufficient color contrast.
- API responses MUST follow one consistent structure for data and errors.

Rationale: Consistency makes the product predictable for users and the codebase
predictable for contributors.

### VI. Security & Privacy by Default

- Secrets, credentials, and API keys MUST NOT be committed; configuration MUST come from
  environment variables or a secrets store.
- All external input (requests, forms, query parameters) MUST be validated and sanitized
  at the API boundary.
- Collect only the personal data a spec explicitly requires; personal data MUST NOT be
  written to logs.
- Dependencies MUST be kept free of known high/critical vulnerabilities.

Rationale: Security and privacy are far cheaper to build in than to retrofit.

### VII. Observability

- The API MUST emit structured logs (e.g., JSON) with timestamp, level, and request
  correlation ID.
- Errors MUST be logged with enough context to diagnose them without reproducing.
- The API MUST expose a health-check endpoint.

Rationale: A system that cannot be observed cannot be debugged, demonstrated, or trusted.

## Technology & Architecture Constraints

- The application is a web app composed of a frontend and a separate API backend that
  communicate over HTTP using JSON.
- The specific language, framework, and storage choices are decided per feature in
  `/speckit-plan` and MUST comply with Principle III (Simplicity).
- The frontend MUST NOT access data stores directly; all data flows through the API.
- The application MUST be runnable locally with documented, minimal setup steps in the
  README.

## Development Workflow & Quality Gates

- Workflow order: `/speckit-specify` → `/speckit-clarify` (as needed) → `/speckit-plan`
  → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
- Each feature is developed on its own branch and merged via pull request.
- A pull request MUST NOT be merged unless:
  1. The plan's Constitution Check passes (or violations are justified).
  2. All tests pass and new behavior is covered by tests (Principle II).
  3. Linting and formatting pass (Principle IV).
  4. No secrets or unvalidated inputs are introduced (Principle VI).
- Commits SHOULD follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, ...).

## Governance

- This constitution supersedes all other project practices and guidance. Where a
  conflict exists, this document wins.
- Amendments MUST be made via `/speckit-constitution`, documented in a pull request with
  rationale, and approved by the project maintainer before merge.
- Versioning follows semantic versioning:
  - MAJOR: removal or backward-incompatible redefinition of a principle or governance rule.
  - MINOR: a new principle or section, or materially expanded guidance.
  - PATCH: clarifications, wording, or typo fixes with no semantic change.
- Compliance is verified at plan time (Constitution Check in `/speckit-plan`), at analysis
  time (`/speckit-analyze`), and during pull request review. Unjustified violations block
  merge.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
