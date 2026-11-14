/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { date, time } from 'native-dates';

const dayInput = document.querySelector('#day');
const span = document.querySelector('#span');
const clock = document.querySelector('#clock');
const output = document.querySelector('#output');

function render() {
  const length = Number(span.value);
  if (!dayInput.value || !clock.value || !(length >= 1)) { return; }
  const day = date(dayInput.value);
  const range = day.to(day.plus(length, 'days'));
  const periodClock = time(clock.value).format({ hour: 'numeric', minute: '2-digit', hour12: true }, 'ko');

  const rows = [
    ['Full date', 'ko', day.format('full', 'ko')],
    ['Collapsed range', 'ko', range.format('long', 'ko')],
    ['Clock with period', 'ko', periodClock],
    ['Month heading', 'ko', day.yearMonth.format('long', 'ko')],
  ];

  output.innerHTML = rows.map(([label, locale, value]) => `
    <li>
      <span class="label">${label} <code>${locale}</code></span>
      <b>${value}</b>
    </li>`).join('');
}

for (const button of document.querySelectorAll('[data-span]')) {
  button.addEventListener('click', () => {
    span.value = button.dataset.span;
    render();
  });
}

dayInput.addEventListener('input', render);
span.addEventListener('input', render);
clock.addEventListener('input', render);
render();
