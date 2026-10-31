# Parked ideas (revisit later)

Source: a conversation with friends on 2026-10-30. These are **parked**: written down so they aren't lost, not being worked on. **Colibri Kit remains the primary focus.**

---

## Idea 1: C → Rust rewrite system

**Status:** parked

C programs need rewriting in Rust for memory safety. The idea is a *system* for migrating C to Rust step by step, not a magic one-click compiler.

- **Inventory:** map the C codebase (modules, call graph, globals, unsafe hot spots, build system) and rank modules by risk and value.
- **FFI wrap:** put a stable C ABI boundary around each module so Rust and C can coexist during the migration.
- **Module-by-module rewrite:** rewrite one module at a time into idiomatic Rust behind the same interface. AI-assisted drafts, human-reviewed.
- **Tests:** characterization tests on the C version first, then the same tests (plus fuzzing) against the Rust version to prove equivalence.
- **Unsafe gate:** CI policy that tracks and limits `unsafe` blocks; every one needs a justification and review.
- **Scope:** a multi-month product track, not a side feature.

## Idea 2: Android device agent ("open claw")

**Status:** parked · separate from Colibri

An Android-based device or app where an agent lives on the phone and can act like a human on it: place and answer calls, use the mic and speaker, send SMS, and operate apps.

- **Permissions:** accessibility services, notification access, default dialer and SMS roles, runtime permissions, and what the Play Store allows versus sideloading or a custom ROM.
- **Telephony/VoIP:** native Telephony and InCallService versus a VoIP stack; real-time speech in and out on calls.
- **Consent and safety:** explicit user consent for outbound calls and messages, disclosure that an AI is speaking where the law requires it, audit log and a kill switch.
- **Scope:** its own project, separate from Colibri Kit.

## Idea 3: Agent-native ecosystem (agent-only apps and dual-mode platforms)

**Status:** parked

**Core insight:** agents that act for people need apps built *for agents*, not human websites they have to scrape. Picture an **agent-targeted ecosystem**: agent-only applications and agent-to-agent (A2A) protocols, plus **dual-mode platforms** where the same service has a **Human Mode** and an **Agent Mode**.

- **Agent-native apps and protocols (A2A commerce):** structured listings, offers and counter-offers, negotiation within limits the owner sets, agreements, payment and hand-over, all through machine-readable APIs and protocols.
- **Dual-mode platforms:** e.g. an "eBay Agent Mode + Human Mode". One marketplace, one inventory, two front doors: a UI for people and an API/protocol for agents. Agents get structured data, identity, reputation and rate limits designed for them, not anti-bot walls.
- **Identity, reputation, trust:** verified agent identity tied to a real owner, a reputation history, escrow, dispute handling and audit logs, so agents can safely trade with agents.
- **Ecosystem we might help create:** standards, SDKs and reference apps that let platforms add an Agent Mode and let new agent-only apps exist, rather than one-off automation of existing human sites.
- **Scenario (not the product definition):** *selling a guitar*. Your agent publishes a structured listing to agent-mode marketplaces, negotiates with buyers' agents within your limits, and closes through escrow, while humans can still see and buy it in Human Mode.
- **Bridge for today:** where no agent mode exists yet, an assisted agent works through the human UI with the owner's approval for each step, under the platform's terms of service. That's a stopgap, not the vision.

---

_Revisit later. Until then, Colibri Kit is the priority._
