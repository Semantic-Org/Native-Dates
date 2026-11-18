// scans minified bundle output for surviving developer prose literals and maps each back to its source line
import { parse } from 'acorn';
import { normalize } from 'node:path';

// shortest explanation observed across Semantic packages: 18 chars and 3 words
const MIN_PROSE_LENGTH = 18;
const MIN_PROSE_WORDS = 3;
const TEMPLATE_PLACEHOLDER = '${…}';
const WORD_PATTERN = /^[A-Za-z][A-Za-z']*[A-Za-z]$/;
const OPERATOR_PATTERN = /^(=|==|===|=>|!=|!==|&&|\|\||\?\?)$/;

export const isProse = (text) => {
  const withoutCodeSpans = text.replaceAll(TEMPLATE_PLACEHOLDER, '').replace(/`[^`]*`/g, '');
  const tokens = withoutCodeSpans.split(/\s+/).filter(Boolean);
  const words = tokens.filter((token) => WORD_PATTERN.test(token.replace(/^[("'`]+/, '').replace(/[)"'`.,:?!]+$/, '')));
  return text.length >= MIN_PROSE_LENGTH
    && words.length >= MIN_PROSE_WORDS
    && !tokens.some((token) => OPERATOR_PATTERN.test(token));
};

// every string and template literal in the code with the offset it opens at
export function literals(code) {
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node?.type !== 'string') { return; }
    if (node.type === 'Literal' && typeof node.value === 'string') {
      found.push({ text: node.value, offset: node.start });
    }
    if (node.type === 'TemplateLiteral') {
      found.push({
        text: node.quasis.map((piece) => piece.value.cooked).join(TEMPLATE_PLACEHOLDER),
        offset: node.start,
      });
    }
    Object.values(node).forEach(walk);
  };
  walk(parse(code, { ecmaVersion: 'latest', sourceType: 'module' }));
  return found;
}

export const sentences = (code) => [...new Set(literals(code).map(({ text }) => text).filter(isProse))];

// self-check so a broken AST walker cannot silently pass production prose checks
if (sentences("log('developer explanation string', `value ${1} inside template`)").length !== 2) {
  throw new Error('tools/gates/prose.js self-check failed to detect prose literals');
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// the standard base64 vlq mappings, decoded to [generatedColumn, source, line, column] segments
// per generated line. read here so a source map costs no dependency
function decodeMappings(mappings) {
  const lines = [];
  let source = 0;
  let line = 0;
  let column = 0;
  for (const group of mappings.split(';')) {
    const segments = [];
    let generated = 0;
    for (const segment of group.split(',')) {
      if (!segment) { continue; }
      const fields = [];
      let value = 0;
      let shift = 0;
      for (const char of segment) {
        const digit = BASE64.indexOf(char);
        value += (digit & 31) << shift;
        if (digit & 32) {
          shift += 5;
          continue;
        }
        fields.push(value & 1 ? -(value >>> 1) : value >>> 1);
        value = 0;
        shift = 0;
      }
      generated += fields[0];
      if (fields.length < 4) { continue; }
      source += fields[1];
      line += fields[2];
      column += fields[3];
      segments.push([generated, source, line, column]);
    }
    lines.push(segments);
  }
  return lines;
}

// an offset in the generated code to its source as { file, line, column }, one-based, or null
// where the map has no segment before it
export function sourceLocator(map, code) {
  const lines = decodeMappings(map.mappings);
  const starts = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\n') { starts.push(i + 1); }
  }
  return (offset) => {
    let line = 0;
    while (line + 1 < starts.length && starts[line + 1] <= offset) { line++; }
    const column = offset - starts[line];
    let hit = null;
    for (const segment of lines[line] ?? []) {
      if (segment[0] > column) { break; }
      hit = segment;
    }
    return hit ? { file: normalize(map.sources[hit[1]]), line: hit[2] + 1, column: hit[3] + 1 } : null;
  };
}
