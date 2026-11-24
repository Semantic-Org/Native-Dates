import { isScriptFile, PlaygroundPreview, PlaygroundProject } from '@semantic-ui/playground';
import { createEditor, intelligence } from '@semantic-ui/playground/editor';

import { ui } from './strings.js';

const EDITOR_THEME = `
  /* nest under .cm-editor so two-class specificity ties CodeMirror's base theme and wins by source order */
  .cm-editor {
    height: 100%; background: var(--code-bg); color: var(--text);
    &.cm-focused { outline: none; }
    /* pad .cm-scroller so gutter numbers and code lines stay aligned */
    .cm-scroller {
      padding: 12px 0;
      font-family: var(--font-mono); font-size: var(--code-fs); line-height: var(--code-lh);
      font-variant-ligatures: none; font-feature-settings: 'liga' 0, 'calt' 0;
    }
    .cm-content { padding: 0; caret-color: var(--accent); }
    .cm-line { padding: 0 20px 0 12px; }
    .cm-gutters { background: var(--code-bg); color: var(--text-4); border-right: 1px solid var(--line); }
    .cm-lineNumbers .cm-gutterElement { padding: 0 10px 0 14px; min-width: 32px; }
    .cm-activeLine { background: color-mix(in oklab, var(--accent) 5%, transparent); }
    .cm-activeLineGutter { background: transparent; color: var(--text-2); }
    .cm-cursor, .cm-dropCursor { border-left: 2px solid var(--accent); }
    .cm-selectionBackground, &.cm-focused .cm-selectionBackground { background: color-mix(in oklab, var(--accent) 22%, transparent); }
    .cm-matchingBracket { background: var(--surface-3); outline: 1px solid var(--line-3); }
    .cm-foldPlaceholder { background: var(--surface-3); border: 0; color: var(--text-3); }
    .tok-keyword, .tok-operatorKeyword, .tok-controlKeyword, .tok-moduleKeyword { color: var(--c-coral); }
    .tok-string, .tok-string2, .tok-special.tok-string { color: var(--c-string); }
    .tok-comment, .tok-lineComment, .tok-blockComment { color: var(--c-comment); font-style: italic; }
    .tok-number, .tok-bool, .tok-null, .tok-atom { color: var(--c-blue); }
    .tok-propertyName, .tok-attributeName { color: var(--c-blue); }
    .tok-variableName.tok-definition, .tok-function, .tok-variableName2 { color: var(--c-violet); }
    .tok-typeName, .tok-className, .tok-tagName { color: var(--c-green); }
    .tok-punctuation, .tok-operator, .tok-bracket { color: var(--text-2); }

    /* match .cm-panel.cm-search specificity so search panel overrides win by source order */
    .cm-panels { background: var(--code-head); color: var(--text-2); }
    .cm-panels-top { border-bottom: 1px solid var(--line); }
    .cm-panel.cm-search {
      position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
      padding: 10px 44px 10px 12px; font: 400 var(--fs-xs)/var(--lh-xs) var(--font-sans);
    }
    .cm-panel.cm-search br { display: block; flex-basis: 100%; height: 0; content: ''; }
    .cm-panel.cm-search .cm-textfield {
      width: 220px; height: 28px; margin: 0; padding: 0 10px;
      border: 1px solid var(--line-2); border-radius: var(--r-2); background: var(--bg); color: var(--text);
      font: 400 var(--code-fs)/1 var(--font-mono);
    }
    .cm-panel.cm-search .cm-textfield:focus { outline: none; border-color: var(--accent); }
    .cm-panel.cm-search .cm-button {
      height: 28px; margin: 0; padding: 0 10px;
      border: 1px solid var(--line-2); border-radius: var(--r-2); background: var(--surface-2); background-image: none;
      color: var(--text-2); font: 500 var(--fs-xs)/1 var(--font-sans); cursor: pointer;
    }
    .cm-panel.cm-search .cm-button:hover { color: var(--text); background: var(--surface-3); }
    .cm-panel.cm-search label { display: inline-flex; align-items: center; gap: 6px; color: var(--text-3); font-size: var(--fs-xs); }
    .cm-panel.cm-search input[type=checkbox] { margin: 0; accent-color: var(--accent); }
    .cm-panel.cm-search button[name=close] {
      position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 28px; height: 28px;
      border: 0; border-radius: var(--r-2); background: none; color: var(--text-3); font-size: 18px; line-height: 1; cursor: pointer;
    }
    .cm-panel.cm-search button[name=close]:hover { color: var(--text); background: var(--surface-3); }
    .cm-searchMatch { background: color-mix(in oklab, var(--accent) 22%, transparent); outline: 1px solid var(--accent-line); }
    .cm-searchMatch.cm-searchMatch-selected { background: color-mix(in oklab, var(--accent) 45%, transparent); }

    /* double .cm-tooltip specificity to beat CodeMirror's light and dark base themes */
    .cm-tooltip.cm-tooltip {
      z-index: 500;
      border: 1px solid var(--line-2);
      border-radius: var(--r-3);
      padding: 10px 12px;
      background: var(--bevel-soft), var(--surface-2);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: var(--fs-2xs);
      line-height: 1.5;
      box-shadow: 0 16px 40px -12px oklch(0 0 0 / 0.72), 0 0 0 1px oklch(1 0 0 / 0.03);
    }
    .cm-tooltip.cm-tooltip-autocomplete {
      min-width: 280px;
      max-width: 440px;
      padding: 4px;
    }
    .cm-tooltip.cm-tooltip-autocomplete > ul {
      list-style: none;
      margin: 0;
      padding: 0;
      padding-inline-start: 0;
      /* 9 rows at 26px each so items never slice cleanly in half at the scroll edge */
      max-height: 234px;
      overflow-y: auto;
      scroll-padding-block: 4px;
      font-family: var(--font-mono);
    }
    .cm-tooltip.cm-tooltip-autocomplete > ul > li {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      margin: 0;
      padding: 3px 8px;
      border-radius: var(--r-2);
      font-family: var(--font-mono);
      font-size: var(--code-sm-fs);
      line-height: 20px;
      color: var(--text-2);
      cursor: pointer;
    }
    .cm-tooltip.cm-tooltip-autocomplete > ul > li:hover {
      background: var(--surface-3);
      color: var(--text);
    }
    .cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected="true"] {
      background: var(--accent-wash);
      box-shadow: inset 0 0 0 1px var(--accent-line);
      color: var(--text);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionMatchedText {
      text-decoration: none;
      color: var(--accent-strong);
      font-weight: 600;
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionLabel {
      flex-shrink: 0;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionDetail {
      flex: 1 1 0;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: right;
      color: var(--text-3);
      font-size: var(--fs-3xs);
      font-style: normal;
      margin-left: auto;
      padding-left: 12px;
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon {
      box-sizing: border-box;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      margin: 0;
      border-radius: var(--r-1);
      font-size: 10px;
      font-weight: 600;
      font-style: normal;
      line-height: 1;
      opacity: 1;
      background: var(--surface-3);
      color: var(--text-3);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon::after { display: block; text-align: center; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-function {
      background: color-mix(in oklab, var(--c-violet) 16%, transparent); color: var(--c-violet);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-function::after { content: 'f'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-method {
      background: color-mix(in oklab, var(--c-violet) 16%, transparent); color: var(--c-violet);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-method::after { content: 'm'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-variable {
      background: color-mix(in oklab, var(--c-blue) 16%, transparent); color: var(--c-blue);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-variable::after { content: 'v'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-property {
      background: color-mix(in oklab, var(--c-blue) 16%, transparent); color: var(--c-blue);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-property::after { content: 'p'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-constant {
      background: color-mix(in oklab, var(--c-amber) 18%, transparent); color: var(--c-amber);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-constant::after { content: 'c'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-keyword {
      background: color-mix(in oklab, var(--c-coral) 16%, transparent); color: var(--c-coral);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-keyword::after { content: 'k'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-enum {
      background: color-mix(in oklab, var(--c-coral) 16%, transparent); color: var(--c-coral);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-enum::after { content: 'e'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-type,
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-class,
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-interface,
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-namespace {
      background: color-mix(in oklab, var(--c-green) 16%, transparent); color: var(--c-green);
    }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-type::after { content: 't'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-class::after { content: 'c'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-interface::after { content: 'i'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-namespace::after { content: 'n'; }
    .cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon-text::after { content: 'a'; font-size: 10px; }

    .cm-tooltip.cm-completionInfo {
      max-width: 420px;
      padding: 10px 12px;
      white-space: normal;
    }
    .cm-tooltip.cm-completionInfo.cm-completionInfo-right { margin-left: 6px; }
    .cm-tooltip.cm-completionInfo.cm-completionInfo-left { margin-right: 6px; }

    .cm-intelligence-hover,
    .cm-intelligence-info,
    .cm-intelligence-signature {
      max-width: 420px;
      font-family: var(--font-sans);
      font-size: var(--fs-2xs);
      line-height: 1.5;
      color: var(--text-2);
    }
    .cm-intelligence-hover > code,
    .cm-intelligence-info > code,
    .cm-intelligence-signature > code {
      display: block;
      font-family: var(--font-mono);
      font-size: var(--code-sm-fs);
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--text);
    }
    .cm-intelligence-docs {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
      font-size: var(--fs-2xs);
      line-height: 1.5;
      color: var(--text-2);
    }
    .cm-intelligence-docs p,
    .cm-intelligence-docs ul { margin: 0; font-size: inherit; line-height: inherit; }
    .cm-intelligence-docs p + p,
    .cm-intelligence-docs p + ul,
    .cm-intelligence-docs ul + p { margin-top: 6px; }
    .cm-intelligence-docs ul { padding-inline-start: 16px; }
    /* TypeScript keeps the leading hyphen on @param descriptions, which markdown parses as a one-item list */
    .cm-intelligence-docs ul:has(> li:only-child) { list-style: none; padding-inline-start: 0; }
    .cm-intelligence-docs li { margin: 0; font-size: inherit; line-height: inherit; color: inherit; }
    .cm-intelligence-docs li + li { margin-top: 3px; }
    .cm-intelligence-docs strong { color: var(--text); font-weight: 600; }
    /* reset prose inline-code pill metrics inside compact tooltips */
    .cm-intelligence-docs code {
      font-family: var(--font-mono);
      font-size: 0.92em;
      line-height: inherit;
      padding: 1px 4px;
      margin: 0;
      border-radius: var(--r-1);
      background: var(--surface-3);
      box-shadow: none;
      color: var(--text);
      white-space: normal;
    }
    .cm-intelligence-docs pre {
      margin: 6px 0 0;
      padding: 6px 8px;
      border: 1px solid var(--line);
      border-radius: var(--r-2);
      background: var(--code-bg);
      font-family: var(--font-mono);
      font-size: var(--fs-3xs);
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--text);
    }
    .cm-intelligence-docs a,
    .cm-intelligence-links a {
      color: var(--accent-strong);
      text-decoration: none;
    }
    .cm-intelligence-docs a:hover,
    .cm-intelligence-links a:hover { text-decoration: underline; text-underline-offset: 3px; }
    .cm-intelligence-shape {
      display: block;
      margin-top: 8px;
      padding: 6px 8px;
      border: 1px solid var(--line);
      border-radius: var(--r-2);
      background: var(--code-bg);
      max-height: 140px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: var(--fs-3xs);
      line-height: 1.5;
      white-space: pre-wrap;
      color: var(--text-2);
    }
    .cm-intelligence-links {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin-top: 8px;
      padding-top: 7px;
      border-top: 1px solid var(--line);
      font-family: var(--font-sans);
      font-size: var(--fs-2xs);
      font-weight: 500;
    }
    .cm-intelligence-links a::after {
      content: '\\00a0\\2197';
      font-size: 0.9em;
      opacity: 0.72;
    }
    .cm-signature-activeParameter {
      color: var(--accent-strong);
      font-weight: 600;
    }
  }
  :root[data-theme='light'] .cm-editor .cm-tooltip.cm-tooltip {
    background: var(--bg);
    box-shadow: 0 12px 32px -12px oklch(0.3 0.03 265 / 0.28), 0 0 0 1px oklch(0.3 0.03 265 / 0.06);
  }
`;

const localePrefix = () => {
  const lang = document.documentElement.lang?.toLowerCase();
  return lang && lang !== 'en' ? `/${lang}` : '';
};

const resolveLink = (url) => url.replace(/^https:\/\/nativedates\.dev(?=\/)/, localePrefix());

export function mountPlayground(root) {
  const { files: FILES, tabs: TABS, importMap } = JSON.parse(root.querySelector('[data-pg-files]').textContent);
  const $ = (s) => root.querySelector(s);
  const status = $('[data-pg-status]');
  const say = (text, error = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  };

  // create the iframe in JS since browsers restore an HTML-parsed iframe's last URL across reload, pointing at a dead session
  const frame = document.createElement('iframe');
  frame.className = 'pg-frame';
  frame.title = ui('playground.preview');
  $('[data-pg-frame]').replaceWith(frame);

  const project = new PlaygroundProject({ files: FILES, importMap, fallback: 'index.html' });
  root.project = project;

  let started = 0;
  project.on('buildStart', () => {
    started = performance.now();
    say(ui('playground.building'));
  });
  project.on('buildError', (error) => say(ui('playground.buildError', { message: error.message }), true));
  project.on('buildDone', () => say(ui('playground.built', { ms: Math.round(performance.now() - started) })));

  // pass ?zone= via the preview URL for the hidden setup import from lib/examples.js
  const preview = new PlaygroundPreview({ project, frame, path: '/' });
  preview.on('error', ({ message }) => say(ui('playground.runtimeError', { message }), true));
  $('[data-pg-reload]').addEventListener('click', () => preview.reload());
  const zones = $('[data-pg-zone]');
  zones.addEventListener('change', () => preview.navigate(zones.value ? `/?zone=${encodeURIComponent(zones.value)}` : '/'));

  root.querySelector('[data-pg-static]')?.remove();

  const tabs = $('[data-pg-tabs]');
  const editor = createEditor({
    parent: $('[data-pg-editor]'),
    // continuous numbering avoids a gap after hidden setup lines
    lineNumbers: root.dataset.lineNumbers === 'off' ? false : 'continuous',
    theme: EDITOR_THEME,
    getFileExtensions: (fileName) => {
      if (!isScriptFile(fileName)) { return []; }
      return intelligence({
        fileName,
        completions: (file, offset) => project.getCompletions(file, offset),
        completionDetail: (file, offset, name) => project.getCompletionDetail(file, offset, name),
        signatures: (file, offset) => project.getSignatureHelp(file, offset),
        hover: (file, offset) => project.getHover(file, offset),
        resolveLink,
      });
    },
    onChange: (name, content) => {
      project.editFile(name, content);
    },
  });
  const open = (name) => {
    editor.openFile(name, project.getFile(name)?.content ?? FILES[name]);
    tabs.querySelectorAll('[role=tab]').forEach((t) => {
      const on = t.dataset.file === name;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
  };
  tabs.innerHTML = TABS.map((name) =>
    `<button class="code-tab" role="tab" type="button" data-file="${name}">${name}</button>`
  ).join('');
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('[data-file]');
    if (t) { open(t.dataset.file); }
  });
  tabs.addEventListener('keydown', (e) => {
    const all = [...tabs.querySelectorAll('[role=tab]')];
    const i = all.indexOf(document.activeElement);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: all.length - 1 }[e.key];
    if (i < 0 || to === undefined) { return; }
    e.preventDefault();
    const t = all[(to + all.length) % all.length];
    open(t.dataset.file);
    t.focus();
  });
  open(TABS[0]);

  project.build();
}
