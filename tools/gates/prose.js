// scans minified bundle output for surviving developer prose literals
import { parse } from 'acorn';

// shortest explanation observed across Semantic packages: 18 chars and 3 words
const MIN_PROSE_LENGTH = 18;
const MIN_PROSE_WORDS = 3;
const TEMPLATE_PLACEHOLDER = '${…}';
const WORD_PATTERN = /^[A-Za-z][A-Za-z']*[A-Za-z]$/;
const OPERATOR_PATTERN = /^(=|==|===|=>|!=|!==|&&|\|\||\?\?)$/;

const isProseLiteral = (text) => {
  const withoutCodeSpans = text.replaceAll(TEMPLATE_PLACEHOLDER, '').replace(/`[^`]*`/g, '');
  const tokens = withoutCodeSpans.split(/\s+/).filter(Boolean);
  const words = tokens.filter((token) => WORD_PATTERN.test(token.replace(/^[("'`]+/, '').replace(/[)"'`.,:?!]+$/, '')));
  return text.length >= MIN_PROSE_LENGTH
    && words.length >= MIN_PROSE_WORDS
    && !tokens.some((token) => OPERATOR_PATTERN.test(token));
};

function extractLiterals(rootNode) {
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node?.type !== 'string') { return; }
    if (node.type === 'Literal' && typeof node.value === 'string') {
      found.push(node.value);
    }
    if (node.type === 'TemplateLiteral') {
      found.push(node.quasis.map((piece) => piece.value.cooked).join(TEMPLATE_PLACEHOLDER));
    }
    Object.values(node).forEach(walk);
  };
  walk(rootNode);
  return found;
}

export const sentences = (code) => [
  ...new Set(extractLiterals(parse(code, { ecmaVersion: 'latest', sourceType: 'module' })).filter(isProseLiteral)),
];

// self-check so a broken AST walker cannot silently pass production prose checks
if (sentences("log('developer explanation string', `value ${1} inside template`)").length !== 2) {
  throw new Error('tools/gates/prose.js self-check failed to detect prose literals');
}
