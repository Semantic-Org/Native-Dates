# North Star: User Needs and Verified Claims

> status: stub (2026-11-19). Mission statement draft below for the maintainer to refine before finalizing verified claims.

Records what application developers need from `native-dates` and the claims backed up with concrete evidence.

## Mission

`native-dates` gives JavaScript's native `Temporal` and `Intl` standards plain-English nouns and natural-language callsites (`today().plus(2, 'days').at('9am').in('Europe/Berlin')`). Calendar math, time zones, daylight transitions, and localization stay delegated to the browser's standards-committee implementations rather than userland tables or runtime dependencies.

## To Populate

- **User needs:** Concrete problems and failure modes developers run into with `Date`, raw `Temporal`, and legacy date libraries, written in plain user terms rather than internal architecture terms.
- **Verified claims:** How `native-dates` addresses each need along with its proof (passing test, measured Brotli size or benchmark number, [`decisions.md`](decisions.md) entry, or [`plan/roadmap.md`](plan/roadmap.md) row). Omit any claim without proof.
