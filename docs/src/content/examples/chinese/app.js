/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { date } from 'native-dates';

const dayInput = document.querySelector('#day');
const clock = document.querySelector('#clock');
const output = document.querySelector('#output');

function render() {
  if (!dayInput.value || !clock.value) { return; }
  const day = date(dayInput.value);
  const moment = day.at(clock.value, 'Asia/Shanghai');
  const periodClock = moment.format({ hour: 'numeric', minute: '2-digit', hour12: true }, 'zh-CN');

  const rows = [
    ['Gregorian', 'zh-CN', day.format('full', 'zh-CN')],
    ['Day period', 'zh-CN', periodClock],
    ['Lunar calendar', 'zh-CN-u-ca-chinese', day.format('long', 'zh-CN-u-ca-chinese')],
    ['Minguo era', 'zh-TW-u-ca-roc', day.format('long', 'zh-TW-u-ca-roc')],
    ['Civil anniversary', 'zh-CN', day.monthDay.format('long', 'zh-CN')],
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
clock.addEventListener('input', render);
render();
