# Product and learning model

Use this reference for plans, progression, completion, attempts, review, notes, or rewards.

## Personalised plans

- Let the learner choose either a study duration or an exam date. Treat these as two ways to derive one plan horizon, not two simultaneous requirements.
- Target band must change task difficulty, linguistic density, distractor quality, answer precision, speaking depth, and feedback expectations—not only estimated minutes.
- Difficulty should rise within the learner's selected route. A Band 6 route can progress from supported to independent Band 6 work; a Band 8 route starts harder and also increases.
- Keep all four skills represented when frequency changes. Reducing weekly test frequency must not accidentally remove speaking, writing, or another skill.
- Version generated plans. If settings change, preserve completed history and regenerate only future assignments.

## Daily task ledger

Represent each assigned task with a stable task ID, assignment date, content version, skill, required item count, and completion evidence.

- Recommended order for a general daily route: vocabulary, listening, reading, speaking; add writing according to the chosen plan.
- A first-time learner has no yesterday section.
- Carry-over must point to yesterday's actual task and content version. Do not regenerate today's content behind a “finish yesterday” button.
- Do not duplicate the same unfinished task across multiple days. Maintain one carry-over record until completed or explicitly dismissed by product policy.
- After the required day is complete, optional extra study may be added without changing the base completion above 100%.

## Completion rules

Define completion as a predicate over evidence, for example:

```text
task_complete = all_required_items_submitted
day_complete  = all_required_daily_tasks_complete
```

Partial progress can be shown numerically, but a checkmark means the complete predicate is true. Opening a task, playing audio, or clicking a manual “completed” control is not sufficient.

Awards must be idempotent. Store an award ledger keyed by event and task/day ID so reloads and retries do not grant points twice. Rankings are optional; never fabricate other users.

## Independent attempts

Key answers and submission state by `user + content set + unit + attempt`.

- Text 1 must never display Text 2 questions, transcript, answers, or completion state.
- Submitting one listening task unlocks only that task's review content.
- “Try again” creates a blank active attempt with neutral input styling. Keep earlier attempts in collapsed history.
- Allow partial submission when the product calls for it, but score unanswered items explicitly and do not mark the full unit complete until its required predicate is met.

## Review and notes

Review is a learning queue, not a dump of titles and answers.

Vocabulary notes should retain the headword or phrase, Chinese meaning, part of speech, an example sentence, source context, and review schedule.

Reading question notes should support:

1. The relevant original sentence or full paragraph when the question depends on paragraph-level matching.
2. The question and all options where options exist.
3. A concealed correct answer that the learner intentionally reveals.
4. A specific explanation and source locator.

Listening question notes should support:

1. A playable audio window containing the answer and enough surrounding confusing context.
2. The question and all options where options exist.
3. A concealed correct answer and explanation.

Do not save only a question title. Categorise notes by vocabulary, listening, reading, speaking, and writing. Each note expands independently; one card's state must not expand its neighbour.

## Review scheduling

Use a spaced-review model with due dates and performance updates. A practical first version can schedule lapses and uncertain items at short intervals, then expand intervals after successful recall. Store the schedule as data so the algorithm can change without losing the item history.
