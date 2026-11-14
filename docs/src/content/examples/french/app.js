/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { date } from 'native-dates';

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
  const montreal = start.at(clock.value, 'America/Montreal');
  const range = start.to(start.plus(Number(span.value), 'days'));

  output.innerHTML = `
    <dt>Full date <code>fr</code></dt>
    <dd>${start.format('full', 'fr')}</dd>
    <dt>France clock <code>fr</code></dt>
    <dd>${paris.format('long', 'fr')}</dd>
    <dt>Québec clock <code>fr-CA</code></dt>
    <dd>${montreal.format('long', 'fr-CA')}</dd>
    <dt>Collapsed range <code>fr</code></dt>
    <dd>${range.format('long', 'fr')}</dd>`;
}

for (const control of [day, clock, span]) {
  control.addEventListener('input', render);
}
render();
