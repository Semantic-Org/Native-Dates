// the cross-library benchmark behind bench.nativedates.dev. data/bench.json is one of its run files
// (runs/<sha>.json in Semantic-Org/Date-Benchmark) copied whole, so every time and ratio on the
// homepage comes from a run and none is typed into copy
import results from '../data/bench.json' with { type: 'json' };

export const BENCH_URL = 'https://bench.nativedates.dev';

const OURS = 'native-dates';
// raw Temporal and Intl run as the benchmark's floor, which is the platform itself and not a library to choose
const FLOOR = 'vanilla-temporal';
const NAMES = { dayjs: 'Day.js', luxon: 'Luxon', moment: 'Moment', tempo: 'Tempo' };

// what the benchmark's audit found wrong with a result, shown under the time it qualifies
export const NOTES = [
  { task: '01_parse_iso', key: 'home.bench.note.invalidDate', applies: (audit) => !audit.rejectsInvalidCalendar },
  { task: '06_zoned_dst_math', key: 'home.bench.note.dst', applies: (audit) => audit.dstAccuracyPct < 100 },
];
const noteFor = (task, audit) => {
  const note = NOTES.find((entry) => entry.task === task && entry.applies(audit));
  return note && { key: note.key, percent: audit.dstAccuracyPct };
};

// ours leads and the others keep the order the benchmark publishes them in
const others = Object.keys(results.scores).filter((id) => id !== FLOOR && id !== OURS);
export const LIBRARIES = [OURS, ...others].map((id) => ({
  id,
  name: NAMES[id] ?? id,
  version: results.field[id].split(' ')[0],
  isOurs: id === OURS,
}));

export const TASKS = Object.entries(results.medians).map(([id, medians]) => {
  const fastest = Math.min(...LIBRARIES.map((library) => medians[library.id]));
  return {
    id,
    times: LIBRARIES.map((library) => ({
      library,
      ms: medians[library.id],
      isFastest: medians[library.id] === fastest,
      note: noteFor(id, results.audits[library.id]),
    })),
  };
});

// a score is a library's mean time against the fastest library in each task, so one score over
// another is how many times longer that library takes, whichever baseline the report is switched to
const score = (id) => results.scores[id].weighted_vs_fastest;
const ratioToOurs = (id) => score(id) / score(OURS);

// how far ahead of the next fastest library we are, which home.bench.title states as fact
export const LEAD = Math.min(...others.map(ratioToOurs));
if (LEAD <= 1) {
  throw new Error(`data/bench.json no longer has ${OURS} fastest overall, so home.bench.title is false. Rewrite the claim before publishing these results.`);
}

export const OVERALL = LIBRARIES.map((library) => ({
  library,
  ratio: ratioToOurs(library.id),
  isNextFastest: !library.isOurs && ratioToOurs(library.id) === LEAD,
}));

export const RUN = {
  rounds: results.rounds,
  chrome: results.chrome_version.split('.')[0],
  measured: new Date(results.timestamp),
};

export const formatMs = (ms) => (ms < 100 ? ms.toFixed(1) : Math.round(ms).toLocaleString('en-US'));

export const formatRatio = (ratio) => (ratio === 1 ? '1' : ratio.toFixed(1));
