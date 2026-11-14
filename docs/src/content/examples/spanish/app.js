/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import '@native-dates/plugins/loose';
import { configure, date } from 'native-dates';

configure({ locale: 'es', dayFirst: true });

const day = document.querySelector('#day');
const span = document.querySelector('#span');
const typed = document.querySelector('#typed');
const output = document.querySelector('#output');

function render() {
  if (!day.value || span.value === '') {
    return;
  }
  const start = date(day.value);
  const range = start.to(start.plus(Number(span.value), 'days'));
  const parsed = date(typed.value, { loose: true });

  output.innerHTML = `
    <dt>Full date <code>.format('full')</code></dt>
    <dd>${start.format('full')}</dd>
    <dt>Collapsed range <code>.format('long')</code></dt>
    <dd>${range.format('long')}</dd>
    <dt>Month heading <code>.yearMonth</code></dt>
    <dd>${start.yearMonth.format('long')}</dd>
    <dt>Day-first input <code>{ loose: true }</code></dt>
    <dd>${parsed ? parsed.format('long') : 'Unreadable'}</dd>`;
}

for (const control of [day, span, typed]) {
  control.addEventListener('input', render);
}
render();
