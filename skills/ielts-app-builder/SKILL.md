---
name: ielts-app-builder
description: Plan, build, diagnose, and release market-ready IELTS learning apps with adaptive study plans, exam-style practice, feedback, review, progress, audio, and cross-device accounts. Use for IELTS product development or review, not for answering a single IELTS exercise or providing ordinary tutoring.
---

# IELTS App Builder

Build a coherent learning product, not a collection of unrelated IELTS tools. Preserve the user's latest product decisions and existing data before adding features.

## Start from the learning loop

Anchor every feature to this loop:

1. Present a clear daily task.
2. Let the learner answer in an exam-appropriate format.
3. Reveal feedback only at the correct moment.
4. Save errors, uncertain vocabulary, and useful examples for review.
5. Update progress only from completed evidence.

When changing a mature app, first inspect the current implementation, working tree, persistence model, and existing tests. Treat the user's newest request as a delta; do not silently undo earlier interaction decisions.

Read [product-and-learning-model.md](references/product-and-learning-model.md) when work touches plans, progression, completion, carry-over tasks, attempts, notes, or rewards.

## Preserve exam fidelity without overstating provenance

Match IELTS interaction patterns, timing, question families, word limits, and feedback structure. Keep training content provenance separate from format fidelity. Never label generated, reconstructed, or commercially copyrighted material as official or as a real past paper.

Read [content-and-rights.md](references/content-and-rights.md) before importing questions, vocabulary lists, recordings, books, official samples, model answers, or scoring language.

## Design for the actual input mode

Desktop and mobile share data, not necessarily layout. Desktop should support keyboard entry, independent scrolling, visible answer areas, and long-form work. Mobile should support touch targets, audio controls, recording, captions, and a single-column fallback without losing context.

Read [assessment-experience.md](references/assessment-experience.md) for listening, reading, speaking, writing, audio, answer-card, transcript, highlighting, retry, and note-capture behavior.

## Make state explicit

Use stable IDs for plans, tasks, questions, attempts, review items, and content versions. Keep attempts independent. Compute completion from required evidence rather than a user-controlled checkbox. A retry creates a fresh current attempt while retaining prior results.

Read [architecture-and-auth.md](references/architecture-and-auth.md) when work touches persistence, dates, timers, accounts, password hashing, sessions, phone/email login, recovery, cross-device sync, or edge runtimes.

## Validate the user-visible outcome

Test the smallest meaningful change, then the affected learning loop. Check both a new learner and an existing learner with saved state. For production defects, reproduce the real runtime constraint instead of assuming desktop localhost behavior matches a phone accessing the deployed service.

Read [qa-and-release.md](references/qa-and-release.md) before a release, migration, public deployment, authentication change, or broad state-model change.

## Boundaries

- Do not fabricate learner progress, streaks, study time, scores, rankings, citations, or official affiliation.
- Do not count idle page time as study. Require visible foreground state plus recent learning activity.
- Do not expose answers, transcripts, model responses, or feedback before the intended submission point.
- Do not make unavailable integrations appear functional. Hide or clearly label unconfigured AI, SMS, email, WeChat, microphone, or payment capabilities.
- Do not publish, send messages, purchase services, enroll developer accounts, or change access controls without the required user authorization.
- Prefer small, reversible commits and preserve unrelated user changes.
