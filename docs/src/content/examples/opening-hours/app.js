/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { now, timeRange, today } from 'native-dates';

const PLACES = [
  { name: 'San Francisco coffee bar', zone: 'America/Los_Angeles', open: '06:00', close: '16:00' },
  { name: 'New York diner', zone: 'America/New_York', open: '07:00', close: '23:00' },
  { name: 'London pub', zone: 'Europe/London', open: '12:00', close: '00:30' },
  { name: 'Berlin bakery', zone: 'Europe/Berlin', open: '06:30', close: '15:00' },
  { name: 'Tokyo ramen bar', zone: 'Asia/Tokyo', open: '18:00', close: '02:00' },
];

const input = document.querySelector('input');
const list = document.querySelector('ul');
input.value = now().format('HH:mm');

function render() {
  const moment = today().at(input.value);

  list.innerHTML = PLACES.map((place) => {
    const local = moment.in(place.zone);
    const hours = timeRange(place.open, place.close);
    const isOpen = hours.contains(local.time);
    return `<li>
      <div>
        <b>${place.name}</b>
        <span class="muted">${hours.format()}</span>
      </div>
      <span class="clock">${local.format('time')}</span>
      <span class="badge ${isOpen ? 'open' : 'closed'}">${isOpen ? 'Open' : 'Closed'}</span>
    </li>`;
  }).join('');
}

input.addEventListener('input', render);
render();
