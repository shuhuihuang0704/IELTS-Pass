# Architecture and authentication

Use this reference for persistence, dates, timers, accounts, sessions, password hashing, recovery, and cross-device sync.

## State boundaries

Separate these layers:

- Content: passages, questions, answers, audio, descriptors, vocabulary, and versions.
- Assignment: which stable content IDs belong to a learner on a date.
- Attempt: draft answers, submission, score, feedback, and retry number.
- Learning record: completion, review items, study events, points, and plan progress.
- Presentation: open panels, filters, captions, current question, and responsive layout.

Do not key durable learning state only by array index or visible title. Content reordering must not attach old answers to a different task.

Use a clear local-date policy for daily rollover. Persist ISO dates and test transitions around midnight, time-zone changes, and returning after several days.

## Study-time tracking

Count time only while the document is visible and a learning surface has recent meaningful activity such as answering, typing, playing task audio, recording, or navigating questions. Pause on backgrounding, lock, inactivity, or leaving the learning surface. Save short activity events by skill so daily details can report vocabulary, listening, reading, speaking, and writing separately.

## Account design

- Keep password hashing and session creation on the server.
- Store only a password verifier, never a raw password.
- Use random salts, bounded parameters, constant-time comparison, HttpOnly cookies, secure cookie flags in production, expiry, and session revocation.
- Normalise email and E.164 phone identifiers consistently. For mainland-China-first products, make the `+86` assumption visible and still store a canonical international form.
- Do not offer SMS or email recovery until the service can send and verify a one-time code. Email uses an email message, not an “email SMS”.
- WeChat web login requires an eligible Open Platform application, approved redirect domains, and server-held credentials. Hide the option when it is not configured.

## Edge-runtime password compatibility

Do not assume every Web Crypto implementation accepts the same PBKDF2 iteration count. Some edge runtimes cap the `deriveBits` iteration parameter even though desktop Node accepts it.

Before shipping authentication:

1. Verify password creation and verification in the deployment runtime.
2. Bound parsed iteration counts to prevent pathological work.
3. Use a portable, reviewed implementation when the platform primitive rejects the chosen work factor.
4. Confirm the portable output against a known PBKDF2 implementation or test vector.
5. Preserve compatibility with existing stored hashes; do not fix login by silently changing the iteration metadata or deleting users.

If the hashing format changes, verify the old format, then rehash with the new format after a successful login. Never migrate a password verifier without proving the supplied password.

## Persistence and migration

Use migrations for durable schema changes and make them safe to apply once. Keep new-user defaults separate from migrated-user history. Test new registration, existing login, expired sessions, duplicate identifiers, wrong passwords, corrupted hashes, and concurrent progress saves.

Prefer server-authoritative account identity and durable progress for cross-device use. Device storage remains appropriate for transient drafts and offline queues, but merge explicitly after sign-in and never overwrite newer server progress blindly.

## Secrets and external services

Keep AI keys, OAuth secrets, SMS credentials, and signing keys out of source control and client bundles. Configure them through the hosting environment. Return a clear unavailable state when a service is missing; do not fall back to fabricated AI answers or pretend a message was sent.
