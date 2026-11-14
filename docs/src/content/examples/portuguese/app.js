/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import '@native-dates/plugins/loose';
import { date } from 'native-dates';

const day = document.querySelector('#day');
const clock = document.querySelector('#clock');
const span = document.querySelector('#span');
const typed = document.querySelector('#typed');
const output = document.querySelector('#output');

function render() {
  if (!day.value || !clock.value || span.value === '') {
    return;
  }
  const start = date(day.value);
  const moment = start.at(clock.value, 'America/Sao_Paulo');
  const range = start.to(start.plus(Number(span.value), 'days'));
  const parsed = date(typed.value, { loose: true, dayFirst: true });

  output.innerHTML = `
    <dt>Date and clock <code>pt-BR</code></dt>
    <dd>${moment.format('full', 'pt-BR')}</dd>
    <dt>Collapsed range <code>pt-BR</code></dt>
    <dd>${range.format('long', 'pt-BR')}</dd>
    <dt>Month heading <code>pt-BR</code></dt>
    <dd>${start.yearMonth.format('long', 'pt-BR')}</dd>
    <dt>Day-first input <code>pt-BR</code></dt>
    <dd>${parsed?.format('long', 'pt-BR') ?? 'Unreadable'}</dd>`;
}

for (const control of [day, clock, span, typed]) {
  control.addEventListener('input', render);
}
render();
