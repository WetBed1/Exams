# AOSC 105 Test 2 practice exam

A buildless browser application with 50 prewritten questions, following the uploaded study guide's 40% multiple choice, 40% short answer, and 20% map skills weighting.

The interface includes practice and delayed-feedback exam modes, question navigation, flags, saved drafts, first-response locking, answer explanations, partial credit, results, attempt history, and answer exports. Progress stays in the current browser's local storage. Diagrams use original schematic educational data.

Multiple-choice and structured map answers are automatically scored. Written answers are explicitly self-checked against the frozen rubric. The application does not claim to evaluate free text with AI or exact-keyword matching. Exported answers include the grading context for subsequent instructor or assistant review.

## Check

Run `node scripts/check.mjs` for question-bank integrity and meaningful scoring checks, including midnight conversions, wind-from direction, partial credit, total weights, and pending written checks. Run `node --check dist/app.mjs` for browser-module syntax.

## Files

- `dist/index.html`, `dist/styles.css`, and `dist/app.mjs`: interface and interaction.
- `dist/logic.mjs`: deterministic scoring and input normalization.
- `dist/bank.json`: frozen question bank, explanations, and rubrics.
- `dist/assets/`: schematic map and observation diagrams.
- `.openai/hosting.json`: Site identity and static output location.

There are no external runtime dependencies or credentials in the source.


## Reviewed version 2.0

The expanded bank has 20 multiple-choice, 20 written, and 10 map questions, worth 2 points each. This preserves 40/40/20 percent and 100 total points. See [the accuracy review](audit/exam2-review.md) for refinements and a mapping of every study-guide objective to question numbers, and [the coverage data](audit/coverage.json).

The revised 50-question attempt uses a separate browser save key, preserving any older 40-question progress. The instructor's guide controls topic scope; exact practice rubrics and suggested completion time are not official exam requirements.

[Open the interactive exam](https://aosc105-test2-practice-isaac.wetbed.chatgpt.site/) (ChatGPT sign-in may be required).
