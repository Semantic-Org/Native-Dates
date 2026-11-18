## Bundle Size

### 🔵 Core Grew +14 Bytes Brotli (Bug Sized)

PRs between 0-50 bytes are typical for bug fixes.

### Packages Changed
| bundle | brotli | Δ minified | Δ brotli |
|---|---:|---:|---:|
| native-dates (full) | 14,077 B | +53 B | +14 B 🔵 |

<details>
<summary>Where the bytes went (minified)</summary>

| file | native-dates (full) |
|---|---:|
| `src/calendar-date.js` | +53 B |

</details>

<details>
<summary>All bundles (6)</summary>

| bundle | minified | gzip | brotli | Δ brotli |
|---|---:|---:|---:|---:|
| import { now } | 48,964 B | 13,732 B | 12,553 B | +24 B 🔵 |
| native-dates (full) | 53,826 B | 15,447 B | 14,077 B | +14 B 🔵 |
| plugins/legacy-date | 1,515 B | 354 B | 304 B | −5 B 🟢 |
| plugins/loose | 955 B | 386 B | 349 B | +6 B 🔵 |
| plugins/zones | 1,893 B | 789 B | 734 B | +36 B 🔵 |
| core + all plugins | 58,189 B | 16,979 B | 15,442 B | +30 B 🔵 |

Dev prose folded out: 3,003 B

</details>

<sub>base main at [`c9bccab`](https://github.com/Semantic-Org/Native-Dates/commit/c9bccab9b526913437cfc036729ad01713e444e2) · `size-report.json`</sub>