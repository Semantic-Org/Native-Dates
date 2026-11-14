/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import '@native-dates/plugins/loose';
import { date } from 'native-dates';

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
  const parsed = date(typed.value, { loose: true, dayFirst: true });

  output.innerHTML = `
    <dt>Full date <code>es</code></dt>
    <dd>${start.format('full', 'es')}</dd>
    <dt>Collapsed range <code>es</code></dt>
    <dd>${range.format('long', 'es')}</dd>
    <dt>Month heading <code>es</code></dt>
    <dd>${start.yearMonth.format('long', 'es')}</dd>
    <dt>Day-first input <code>es</code></dt>
    <dd>${parsed ? parsed.format('long', 'es') : 'Unreadable'}</dd>`;
}

for (const control of [day, span, typed]) {
  control.addEventListener('input', render);
}
render();
