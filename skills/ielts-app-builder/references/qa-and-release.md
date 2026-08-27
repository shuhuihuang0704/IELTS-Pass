# QA and release

Use this reference before a release, migration, public deployment, authentication change, or broad state-model change.

## Change workflow

1. Restate the user-visible outcome and locate the authoritative state or content.
2. Inspect the current working tree and preserve unrelated changes.
3. Implement the smallest complete vertical slice.
4. Add or update tests for the behavioural invariant, not only displayed wording.
5. Run focused tests, then the production build.
6. Commit one coherent change with a specific message.
7. Publish only after the required authorization and verify deployment status.

For an existing product, do not redesign surrounding surfaces during a focused bug fix.

## High-value test matrix

Test at least the affected rows:

| Dimension | Cases |
|---|---|
| Viewport/input | phone touch, desktop keyboard, narrow browser, long content |
| Learner | first use, existing saved progress, signed out, signed in on another device |
| Date | same day, midnight rollover, missed day, plan setting change |
| Attempt | blank, partial, submitted, retry, historical attempt |
| Content isolation | every passage/task ID opens only its own content and review |
| Media | play, pause, resume, seek, permission denied, missing track, slow load |
| Feedback locks | before submit, after partial submit, after full submit, retry re-lock |
| Authentication | register, correct login, wrong password, legacy hash, expired session |

For time tracking, explicitly test idle foreground time, background time, audio playback, typing, and return from lock screen.

## Production defects

Classify whether the failure is client, server, data, runtime, cache, or configuration. Reproduce against the deployed architecture when possible. A phone-only report may still be a server-runtime defect; record the exact error before changing UI code.

Preserve old data during compatibility fixes. For authentication and migrations, prefer a verified migration path over telling users to register again.

## Sites projects

If `.openai/hosting.json` exists, use the available Sites building and hosting workflows. The deployed archive must come from the same validated commit saved as the site version.

- Keep the existing project ID and source repository.
- Run the production build before saving a version.
- Push the exact commit to both the user's repository and the Site source when both are part of the workflow.
- Public deployment is an external mutation: obtain explicit approval before deploying a saved version publicly.
- Poll the returned deployment until success or failure; do not tell the user a fix is live while it is only saved.
- Reuse the existing public URL and show it after success.

## Release handoff

Tell the user what changed, whether existing data/accounts are preserved, where the result is available, and what single action verifies it. Mention cache refresh only when the release is live and stale assets are plausible.

Do not expose credentials, tokens, internal repository URLs, or secret configuration in logs or handoff text.
