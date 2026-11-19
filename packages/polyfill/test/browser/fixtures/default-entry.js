import '@native-dates/polyfill';
import { today } from 'native-dates';

export const launch = today().plus(30, 'days');
