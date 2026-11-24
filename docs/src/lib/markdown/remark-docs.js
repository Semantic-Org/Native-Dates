import { existsSync, readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

import { DEFAULT_LOCALE, localePath } from '../locales.js';
import { englishTwin, headingsOf, localeFromPath, plural, t } from './i18n.js';
import { esc, inline } from './inline.js';
import { parseMeta } from './shiki-meta.js';

// custom markdown directives and fences used across docs pages:
//   :::note|tip|warning|danger[Title], :::steps, :::entry, :::truth, and :kind[method]
//   ```js title="app.js", ```js locale="fr" label="Français", ```js signature, ```params (YAML), and ```returns (YAML)
const ICONS = {
  note:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  tip:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01"/></svg>',
  danger:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
};
const CALLOUTS = new Set(Object.keys(ICONS));

const el = (tag, props, children = []) => ({ type: `docs-${tag}`, data: { hName: tag, hProperties: props }, children });
const html = (value) => ({ type: 'html', value });

function paramRow(p, code) {
  const flag = p.required ? `<span class="param-flag">${esc(t(code, 'api.required'))}</span>` : '';
  const def = p.default !== undefined
    ? `<span class="param-default">${t(code, 'api.default', { value: `<code>${esc(p.default)}</code>` })}</span>`
    : '';
  const nested = p.options?.length
    ? `<details><summary>${
      esc(plural(code, 'api.options', p.options.length, { count: p.options.length }))
    }</summary><div class="params">${p.options.map((option) => paramRow(option, code)).join('')}</div></details>`
    : '';
  return `<div class="param"><div class="param-head"><span class="param-name">${esc(p.name)}</span>`
    + `<span class="param-type">${esc(p.type ?? '')}</span>${flag}${def}</div>`
    + `${p.description ? `<p>${inline(p.description, code)}</p>` : ''}${nested}</div>`;
}

const paramsBlock = (yaml, code) =>
  html(`<div class="params">${(parseYaml(yaml) ?? []).map((param) => paramRow(param, code)).join('')}</div>`);
const returnsBlock = (yaml, code) => {
  const r = parseYaml(yaml) ?? {};
  return html(
    `<div class="returns"><span class="param-type">${esc(r.type ?? '')}</span>${
      r.description ? `<p>${inline(r.description, code)}</p>` : ''
    }</div>`,
  );
};

const copyButton = () => el('button', { className: ['copy'], type: 'button', dataCopy: '' });

function codeBlock(node) {
  const meta = parseMeta(node.meta ?? '');
  if (meta.signature) { return node; }
  const head = meta.title
    ? [
      el('div', { className: ['code-head'] }, [
        el('span', { className: ['code-file'] }, [{ type: 'text', value: meta.title }]),
        copyButton(),
      ]),
    ]
    : [];
  return el('div', { className: ['code'] }, [...head, node]);
}

// group consecutive labeled or locale-tagged fences into one tabbed block sharing a .swap height container
function variantsBlock(nodes, code) {
  return el('div', { className: ['code'], dataVariants: '' }, [
    el('div', { className: ['code-head'] }, [
      el('div', { role: 'tablist', ariaLabel: t(code, 'page.codeExamples'), dataVariantTabs: '' }),
      copyButton(),
    ]),
    el('div', { className: ['swap'] }, nodes),
  ]);
}

const isVariant = (n) => n?.type === 'code' && /\b(?:label|locale)="/.test(n.meta ?? '');

function transformChildren(parent, code) {
  if (!parent.children) { return; }
  const out = [];
  for (let i = 0; i < parent.children.length; i++) {
    const node = parent.children[i];
    if (isVariant(node)) {
      const group = [node];
      while (isVariant(parent.children[i + 1])) { group.push(parent.children[++i]); }
      out.push(variantsBlock(group, code));
      continue;
    }
    if (node.type === 'code') {
      if (node.lang === 'params') { out.push(paramsBlock(node.value, code)); }
      else if (node.lang === 'returns') { out.push(returnsBlock(node.value, code)); }
      else { out.push(codeBlock(node)); }
      continue;
    }
    out.push(transformNode(node, code));
  }
  parent.children = out;
}

function transformNode(node, code) {
  if (node.type === 'containerDirective') {
    const label = node.children[0]?.data?.directiveLabel ? node.children.shift() : null;
    transformChildren(node, code);
    if (CALLOUTS.has(node.name)) {
      if (label) { label.data = { hName: 'p', hProperties: { className: ['callout-title'] } }; }
      return el('div', { className: ['callout'], dataKind: node.name }, [
        html(ICONS[node.name]),
        el('div', {}, label ? [label, ...node.children] : node.children),
      ]);
    }
    if (node.name === 'steps') {
      const list = node.children.find((c) => c.type === 'list');
      if (list) { list.data = { hProperties: { className: ['steps'] } }; }
      return list ?? el('div', {}, node.children);
    }
    if (node.name === 'entry') { return el('section', { className: ['entry'] }, node.children); }
    if (node.name === 'truth') { return el('div', { className: ['truth'] }, node.children); }
    return el('div', { className: [node.name] }, node.children);
  }
  if (node.type === 'textDirective' && node.name === 'kind') {
    // store the kind label in data-kind so Astro's TOC heading text excludes the badge
    const kind = node.children.map((c) => c.value ?? '').join('');
    return el('span', { className: ['kind'], dataKind: kind });
  }
  // trim trailing space before :kind[...] so heading slugs do not end with a hyphen ('now-')
  if (node.type === 'heading') {
    transformChildren(node, code);
    const last = node.children.at(-1);
    const before = node.children.at(-2);
    if (last?.data?.hProperties?.className?.includes('kind') && before?.type === 'text') {
      before.value = before.value.trimEnd();
    }
    if (before?.value === '') { node.children.splice(-2, 1); }
    return node;
  }
  // restore unknown directives to plain text so prose colons like 10:30 or og:image survive remark-directive
  if (node.type === 'textDirective' || node.type === 'leafDirective') {
    const text = node.children.map((c) => c.value ?? '').join('');
    const value = `${node.type === 'leafDirective' ? '::' : ':'}${node.name}${text ? `[${text}]` : ''}`;
    return node.type === 'leafDirective'
      ? { type: 'paragraph', children: [{ type: 'text', value }] }
      : { type: 'text', value };
  }
  transformChildren(node, code);
  return node;
}

// prefix internal markdown links in translated files so translations can keep root-relative URLs
function localizeLinks(node, code) {
  if (node.type === 'link') { node.url = localePath(node.url, code); }
  node.children?.forEach((child) => localizeLinks(child, code));
}

function collectHeadings(node, out = []) {
  if (node.type === 'heading') { out.push(node); }
  node.children?.forEach((child) => collectHeadings(child, out));
  return out;
}

// assign English heading IDs to translated headings before rehypeHeadingIds runs so cross-page
// hash links and language switches keep working across locales
function preserveEnglishHeadingIds(tree, filePath) {
  const twin = englishTwin(filePath);
  if (!twin || !existsSync(twin)) { return; }
  const english = headingsOf(readFileSync(twin, 'utf8'));
  const translated = collectHeadings(tree);
  if (translated.length !== english.length || translated.some((h, i) => h.depth !== english[i].depth)) { return; }
  translated.forEach((heading, i) => {
    heading.data = { ...heading.data, hProperties: { ...heading.data?.hProperties, id: english[i].id } };
  });
}

export function remarkDocs() {
  return (tree, file) => {
    const locale = localeFromPath(file?.path);
    transformChildren(tree, locale.code);
    if (locale.code !== DEFAULT_LOCALE) {
      localizeLinks(tree, locale.code);
      preserveEnglishHeadingIds(tree, file.path);
    }
  };
}
