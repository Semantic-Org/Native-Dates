/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { today, weekdayNames, yearMonth } from 'native-dates';

const heading = document.querySelector('#month');
const header = document.querySelector('#weekdays');
const cells = document.querySelector('#days');

let current = yearMonth(today());

header.innerHTML = weekdayNames('short').map((name) => `<span>${name}</span>`).join('');

function render() {
  heading.textContent = current.format('long');
  const grid = current.start.startOf('week').to(current.end.endOf('week'));

  cells.innerHTML = grid.every('day').map((day) => {
    const classes = [
      day.month !== current.month ? 'outside' : '',
      day.isWeekend() ? 'weekend' : '',
      day.isToday() ? 'today' : '',
    ].filter(Boolean).join(' ');
    return `<span class="${classes}">${day.day}</span>`;
  }).join('');
}

document.querySelector('#prev').addEventListener('click', () => {
  current = current.minus(1, 'month');
  render();
});
document.querySelector('#today').addEventListener('click', () => {
  current = yearMonth(today());
  render();
});
document.querySelector('#next').addEventListener('click', () => {
  current = current.plus(1, 'month');
  render();
});

render();
