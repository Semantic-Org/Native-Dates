/* playground-hide */
// the zone picked in the preview's bar becomes the default zone before the app runs
import './sandbox.js';
/* playground-hide-end */
import { duration } from 'native-dates';

const input = document.querySelector('input');
const output = document.querySelector('#output');

function render() {
  try {
    const length = duration(input.value);
    output.innerHTML = `
      <dt>In words</dt><dd>${length.format()}</dd>
      <dt>In hours</dt><dd>${length.total('hours')}</dd>
      <dt>ISO 8601</dt><dd><code>${length}</code></dd>`;
  }
  catch (error) {
    output.innerHTML = `<dt>Refused</dt><dd class="refused">${error.message}</dd>`;
  }
}

input.addEventListener('input', render);
render();
