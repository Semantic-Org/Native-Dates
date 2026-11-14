/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { configure, date } from 'native-dates';

configure({ locale: 'fr' });

const day = document.querySelector('#day');
const clock = document.querySelector('#clock');
const span = document.querySelector('#span');
const output = document.querySelector('#output');

function render() {
  if (!day.value || !clock.value || span.value === '') {
    return;
  }
  const start = date(day.value);
  const paris = start.at(clock.value, 'Europe/Paris');
  const montreal = start.at(clock.value, 'America/Montreal').locale('fr-CA');
  const range = start.to(start.plus(Number(span.value), 'days'));

  output.innerHTML = `
    <dt>Full date <code>.format('full')</code></dt>
    <dd>${start.format('full')}</dd>
    <dt>France clock <code>.format('long')</code></dt>
    <dd>${paris.format('long')}</dd>
    <dt>Québec clock <code>.locale('fr-CA')</code></dt>
    <dd>${montreal.format('long')}</dd>
    <dt>Collapsed range <code>.text</code></dt>
    <dd>${range.text}</dd>`;
}

for (const control of [day, clock, span]) {
  control.addEventListener('input', render);
}
render();
