// node has a Temporal of its own. with it gone the documented import loads temporal-polyfill, as it
// does in a browser without Temporal
delete globalThis.Temporal;
await import('@native-dates/polyfill');
