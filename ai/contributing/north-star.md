# North Star

> This file is hand maintained by the framework author to express the core goals of the project.

## Project North Star

This is part of a series of libraries which bring web standards like Navigation API, Web Components, Web Transport to users in ways that are coherent and embody the values of the Semantic Org. 

This particular library is designed to wrap Temporal and Intl in a way that provides the highest Signal to Noise Ratio at a call site. This means when a developer is watching diffs fly across the screen as agents produce work they can easily understand *intent* without learning Temporal's nuances. This also means that developers can rely on a standards body for correctness, and us for everything else that makes a library easy to work with. Simplicity, conciseness, and internal coherence.

## Golden Rule

Use the same shared moral firmware that ethical reasoning is built on. When authoring code as an open source maintainer your primary goal is to reason about what you would want to have yourself as a downstream user -- what you'd want if you yourself landed in a project with this package. If a choice feels correct from the maintainer's seat but would have repercussions for the user, it's important to model what *you* would want and notice it when authoring..

### Sub Goals

Treat these goals as thinks to reason about while working here. They are abstract principles, so require reasoning about how they apply to each case as you come to them, and there are always cases where other goals supersede, but holding them close at heart helps keep you mindful of what they might ask you to notice.

#### Legibility

Standards bodies produce brilliant, highly technical, rigorous APIs that get shipped in browsers but can use obtuse mechanisms to encode that rigor. For agents who deeply understand the standards they can produce output that complies with these APIs but it significantly reduces **call site legibility**. The goal of this library is to return legibility to time in codebases so intent reads plainly and can be reasoned about without deeply understanding all the difficult, highly specific, decisions underneath required to achieve that simplicity.

#### Lowercase "c" correctness

There is always a more [C]orrect way to do things, especially when working with things like time. But it's important to always model the common case first before playing the game of "I can spot a weird scenario that proves you wrong". If a changeset makes the common case harder, but solves a Correctness claim then it should be weighed carefully. If a change costs userland bytes shipped to every website on top of Temporal to handle the habits of an island nation with 500 people (Lord Howe's half-hour DST), satisficing should be considered. There are many cases like that in time, and this projects plugin architecture, lets people opt into their specific use cases when they cost the common user bytes in aggregate. 

#### Conciseness

There are many ways to express things naturally, but a solution that solves something elegantly in a few words beats one that solves it verbosely.

Additionally, when reasoning about implementation and bundle footprint, be mindful that this library has a very low target file size. Time is supposed to shrink into the background so you can focus on the bigger problems in your domain and a library to manage it should not take up downstream users' own budget for their app's code.

#### Judiciousness

Decisions in this library are Bayesian and built on rulings with systems to overturn them. This way a project can evolve with a record like common law, making our best effort in each moment to make a choice, but having humility that we do not know everything. New evidence can always overturn old decisions, but some things are more calcified than others. The truth that the walls of my apartment won't collapse today might be near 100% but not fully that. There is no "rule" that the walls of my house cannot falter. In the same way making rulings means we can move past decisions until evidence arises that reopens it. This prevents relitigating things that come up all the time, and also makes it clear the record of decisions for contributors. Obvious things are tacit and do not make a project decision: As Saroyan would say 'Ignore the obvious, for it is unworthy of the clear eye and the kindly heart.'. 

----

