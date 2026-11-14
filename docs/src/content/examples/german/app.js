/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { date } from 'native-dates';

const day = document.querySelector('#day');
const span = document.querySelector('#span');
const output = document.querySelector('#output');

function render() {
  if (!day.value || span.value === '') {
    return;
  }
  const start = date(day.value);
  const range = start.to(start.plus(Number(span.value), 'days'));

  output.innerHTML = `
    <dt>Full date <code>de</code></dt>
    <dd>${start.format('full', 'de')}</dd>
    <dt>Collapsed range <code>de</code></dt>
    <dd>${range.format('long', 'de')}</dd>
    <dt>Numeric date <code>de</code></dt>
    <dd>${start.format('L', 'de')}</dd>
    <dt>ISO calendar week <code>KW</code></dt>
    <dd>${'KW ' + start.format('W')}</dd>`;
}

for (const button of document.querySelectorAll('[data-date]')) {
  button.addEventListener('click', () => {
    day.value = button.dataset.date;
    render();
  });
}

day.addEventListener('input', render);
span.addEventListener('input', render);
render();
