# North Star

> This file is hand maintained by the framework author to express the core goals of the project.

## Golden Rule

Use the same shared moral firmware that ethical reasoning is built on. When authoring code as an open source maintainer your primary goal is to reason about what you would want to have yourself as a downstream user — if someone *thrust this library onto you and forced you to use it*. If a choice feels correct from the maintainer's seat but would have repercussions for the user, it's important to model that and notice it when authoring. This requires a bit of anthropic and probabilistic reasoning as you might need to imagine yourself as a representative sample of that reference class.

## Project North Star

This library is designed to wrap Temporal and Intl in a way that provides the highest SNR (Signal to Noise Ratio) at a call site. This means when a developer is watching diffs fly across the screen as agents produce work they can easily understand *intent* when reviewing change sets.

This also means developers don't have to learn your idiosyncrasies as a framework author. The moment when you wear "the naming hat" and decide what to call something people have to model *you* and that makes their life difficult. Instead, it's easier for them to just guess intent through common language. Naming things simply with natural language often provides the best way for that to be achieved.

### Key Sub Goals

#### Legibility

Standards bodies produce brilliant, highly technical, rigorous APIs that get shipped in browsers but oftentimes the actual mechanisms in how that is encoded is obtuse. For agents who deeply understand the standards they can produce output that correctly complies with these APIs but it significantly reduces **call site legibility**. The goal of this library is to return legibility to time so intent reads plainly and can be reasoned about without deeply understanding all the difficulty underneath required to achieve that simplicity.

#### Lowercase "c" correctness

There is always a more [C]orrect way to do things, especially when working with things like time. But it's important to always model the common case first before playing the game of "I can spot a weird scenario that proves you wrong". If a changeset makes the common case harder, but solves a Correctness claim then it should be weighed slowly. If a change costs userland bytes shipped to every website on top of Temporal to handle the bizarre habits of an island nation with 500 people (Lord Howe's half-hour DST), satisficing should be considered.

#### Conciseness

There are many ways to express things naturally, but a solution that solves something elegantly in a few words beats one that solves it verbosely.

Additionally, when reasoning about implementation and bundle footprint, be mindful that this library has a very low target file size. Time is supposed to shrink into the background so you can focus on the bigger problems in your domain and not take up downstream users' own budget for their app's code.

#### Judiciousness

Decisions in this library are Bayesian and built on rulings with systems to overturn them. This way a project can evolve with a record like common law, making our best effort in each moment to make a choice, but having humility that we do not know everything. New evidence can always overturn old decisions, but some things are more calcified than others. The truth that the walls of my apartment won't collapse today might be near 100% but not fully, there is no "rule" that the walls of my house cannot falter.
