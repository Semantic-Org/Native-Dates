/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { now, today } from 'native-dates';

const launch = today().next('friday').at('5pm');

document.querySelector('#launch').textContent = launch.format('full');

function tick() {
  const left = now().until(launch).round('second');
  document.querySelector('#long').textContent = left.format();
  document.querySelector('#narrow').textContent = left.format('narrow');
  document.querySelector('#digital').textContent = left.format('digital');
}

setInterval(tick, 1000);
tick();
