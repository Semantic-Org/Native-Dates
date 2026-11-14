/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { date, days } from 'native-dates';

const dayInput = document.querySelector('#day');
const count = document.querySelector('#count');
const output = document.querySelector('#output');

// isolate each right-to-left run so digits and range dashes stay in Arabic order
const rtl = (text) => `<bdi dir="rtl">${text}</bdi>`;

function render() {
  const total = Number(count.value);
  if (!dayInput.value || !(total >= 1)) { return; }
  const day = date(dayInput.value);
  const span = day.to(day.plus(4, 'days'));

  const rows = [
    ['Six-way plural', 'ar', rtl(days(total).format('long', 'ar'))],
    [
      'Eastern digits',
      'ar-EG',
      `${rtl(day.format('long', 'ar-EG'))} <span class="muted">·</span> ${rtl(span.format('long', 'ar-EG'))}`,
    ],
    ['Maghrebi form', 'ar-MA', rtl(day.format('long', 'ar-MA'))],
    [
      'Umm al-Qura Hijri',
      'ar-SA-u-ca-islamic-umalqura',
      `${rtl(day.format('long', 'ar-SA-u-ca-islamic-umalqura'))} <span class="muted">·</span> ${rtl(day.monthDay.format('long', 'ar-EG'))}`,
    ],
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
