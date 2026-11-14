/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { date, days } from 'native-dates';

const dayInput = document.querySelector('#day');
const count = document.querySelector('#count');
const output = document.querySelector('#output');

function render() {
  const total = Number(count.value);
  if (!dayInput.value || !(total >= 1)) { return; }
  const day = date(dayInput.value);
  const span = day.to(day.plus(4, 'days'));

  const rows = [
    ['Month heading', 'ru', day.yearMonth.format('long', 'ru')],
    ['Full date', 'ru', day.format('long', 'ru')],
    ['Date range', 'ru', span.format('long', 'ru')],
    ['Plural count', 'ru', days(total).format('long', 'ru')],
  ];

  output.innerHTML = rows.map(([label, locale, value]) => `
    <li>
      <span class="label">${label} <code>${locale}</code></span>
      <b>${value}</b>
    </li>`).join('');
}

for (const button of document.querySelectorAll('[data-count]')) {
  button.addEventListener('click', () => {
    count.value = button.dataset.count;
    render();
  });
}

dayInput.addEventListener('input', render);
count.addEventListener('input', render);
render();
