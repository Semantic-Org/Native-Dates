/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { tomorrow } from 'native-dates';

import { CITIES } from './cities.js';

const input = document.querySelector('input');
const summary = document.querySelector('#summary');
const list = document.querySelector('ul');

function render() {
  // tomorrow, at the time typed, where this app is running
  const meeting = tomorrow().at(input.value);
  summary.textContent = meeting.format('full');

  list.innerHTML = CITIES.map((zone) => {
    const there = meeting.in(zone);
    const sameDay = there.date.equals(meeting.date);
    return `<li>
      <code>${zone}</code>
      <b>${there.format('time')}</b>
      <span class="muted">${sameDay ? '' : there.format({ weekday: 'long' })}</span>
    </li>`;
  }).join('');
}

input.addEventListener('input', render);
render();
