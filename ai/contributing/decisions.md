# Decisions: Package Design Log

Append-only log of adjudicated decisions governing what `native-dates` exports and how it behaves: semantics, public API names, option shapes, bundle ceilings, and constraints on future surface. Entries are dated, and the latest entry on a topic supersedes earlier ones while preserving prior entries for context.

**Inclusion test.** Record decisions here when they bind package behavior across multiple changes. One-off implementation choices belong in the PR, and subjective repository conventions (CI, docs workflow, release process) belong in [`project-decisions.md`](project-decisions.md). Ask: *Does someone modifying this package two years from now need to follow this rule?*

**Prose style.** Direct, factual specification prose. State what the package does first, why it was chosen, and what alternative was rejected. Omit PR numbers and conversational session filler, and quote the maintainer verbatim when exact phrasing carries the decision.

**Entry format.** `## <Kind> <YYYY-MM-DD>: <one-sentence decision>`, followed by the rationale, closing with `(<score>, reopen: <observable condition>)`. Kinds: `Ruled`, `Amended`, `Corrected`, `Reverted`, `VOID`, and `Lean` (guidance for future API surface).

**Confidence scores.** Each score (`ruled at 60`) is the maintainer's 0-100 confidence at decision time, never an agent's estimate. A score of 70 reflects a 30% chance of reversal given new evidence:

- **90+:** Settled. Do not reopen without strong new empirical evidence.
- **~60:** Active working decision. Raise it if its reopen condition occurs.
- **<40:** Provisional default awaiting real-world usage data.
- **`stamped`:** Decided in conversation without a numeric score. Treat as settled unless its reopen clause triggers.
- **`(agent-ruled at N, veto-eligible)`:** Delegated agent decision within maintainer-approved bounds, subject to maintainer veto.

**Reopening a decision.** Showing with concrete evidence that a decision's `reopen:` condition has been met is explicitly invited. Reopening a decision whose condition has not been met requires evidence not considered in the original entry, or a clear usability hazard that would turn away a new user of the package.

---

## Ruled 2026-11-19: Step to adjacent unit boundaries with `startOfNext()` and `startOfPrevious()` rather than overloading `next()` and `previous()`

`CalendarDate`, `DateTime`, and `Time` expose `startOfNext(unit, firstDay?)` and `startOfPrevious(unit, firstDay?)` to return the start of the enclosing unit's next or previous sibling (`date('2026-11-16').startOfNext('month')` is `'2026-12-01'`, `datetime('2026-11-16T09:30').startOfNext('month')` is December 1 at `00:00`). On `CalendarDate` and `DateTime`, weekday names such as `'wednesday'` are also accepted and return the start of that upcoming or most recent weekday, whereas numeric weekdays are rejected as `unknownUnit` so misplaced counts like `startOfNext(2, 'months')` do not silently resolve to Tuesday. Overloading `next('month')` and `previous('month')` was rejected after a clean-room naming pass because `DateTime.prototype.next('friday')` preserves the time of day (`09:30`) while a unit boundary resets the clock to `00:00`, and cold readers split on whether `next('month')` means the 1st of next month or `plus(1, 'month')`. (stamped, reopen: user studies or downstream issue reports show callers consistently expecting numeric weekdays or `MonthDay` targets in `startOfNext()`)
