/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { configure, date, timeRange } from 'native-dates';

configure({ locale: 'ja' });

const dayInput = document.querySelector('#day');
const start = document.querySelector('#start');
const end = document.querySelector('#end');
const output = document.querySelector('#output');

function render() {
  if (!dayInput.value || !start.value || !end.value) { return; }
  const day = date(dayInput.value);
  const span = day.to(day.plus(4, 'days'));
  const shift = timeRange(start.value, end.value);

  const rows = [
    ['Full date', ".format('full')", day.format('full')],
    ['Month heading', '.yearMonth.text', day.yearMonth.text],
    ['Date span', '.text', span.text],
    ['Overnight shift', '.text', shift.text],
    ['Imperial era', 'ja-u-ca-japanese', day.format('long', 'ja-u-ca-japanese')],
  ];

  output.innerHTML = rows.map(([label, locale, value]) => `
    <li>
      <span class="label">${label} <code>${locale}</code></span>
      <b>${value}</b>
    </li>`).join('');
}

for (const button of document.querySelectorAll('[data-date]')) {
  button.addEventListener('click', () => {
    dayInput.value = button.dataset.date;
    render();
  });
}

dayInput.addEventListener('input', render);
start.addEventListener('input', render);
end.addEventListener('input', render);
render();
