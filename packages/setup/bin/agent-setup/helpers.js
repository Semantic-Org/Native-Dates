// the two @semantic-ui/utils string helpers this command reaches, trimmed to the branches it uses

// fills {name} placeholders, and keeps one it has no value for so a typo in the copy shows itself
export const fill = (template, values = {}) =>
  template.replace(/\{(\w+)\}/g, (placeholder, key) => (values[key] === undefined ? placeholder : String(values[key])));

// 'a', 'a and b', 'a, b, and c'
export const joinWords = (words) =>
  words.length < 3 ? words.join(' and ') : `${words.slice(0, -1).join(', ')}, and ${words[words.length - 1]}`;
