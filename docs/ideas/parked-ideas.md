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

## Idea 3: Agents that act as humans and talk to each other

**Status:** parked

Agents that represent a person and exchange information or negotiate with other agents. Example: **sell a guitar**. Your agent lists it on marketplaces, answers buyers, talks to buyers' agents, and negotiates a sale.

- **A2A negotiation:** an agent-to-agent protocol for offers, counter-offers and the user's limits (minimum price, pickup or shipping).
- **Listings:** create and maintain listings across marketplaces from one description and photos.
- **Trust/escrow:** identity, reputation and payment held until hand-over; fraud and scam protection.
- **Platform limits:** marketplace terms of service and anti-bot rules; prefer official APIs, and respect them.
- **Early version:** the agent talks to humans through normal marketplace UIs (with user approval for each message or deal), with opt-in A2A between agents that support it.

---

_Revisit later. Until then, Colibri Kit is the priority._
