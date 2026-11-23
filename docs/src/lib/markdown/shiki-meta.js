export function parseMeta(raw = '') {
  const meta = {};
  raw.replace(/(\w+)="([^"]*)"|(\w+)(?![\w="])/g, (_, key, value, flag) => {
    if (key) { meta[key] = value; }
    else if (flag) { meta[flag] = true; }
    return '';
  });
  return meta;
}

export function transformerFenceMeta() {
  return {
    name: 'native-dates:fence-meta',
    pre(node) {
      const meta = parseMeta(this.options.meta?.__raw);
      if (meta.label) { node.properties['data-label'] = meta.label; }
      if (meta.locale) { node.properties['data-locale'] = meta.locale; }
      if (meta.signature) { this.addClassToHast(node, 'signature'); }
      if (!this.source.trim().includes('\n')) { this.addClassToHast(node, 'is-line'); }
      // strip Shiki's inline colors so CSS theme variables control light and dark backgrounds
      delete node.properties.style;
      node.properties['data-raw'] = this.source;
      return node;
    },
  };
}
