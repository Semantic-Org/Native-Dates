import { describe, expect, it } from 'vitest';

import { checkMarkdownStructure } from './ai.js';

describe('ai gate markdown structure', () => {
  it('accepts quoted YAML frontmatter scalars containing colons and braces', () => {
    const doc = [
      '---',
      'title: Plugins Guide',
      'description: "Use { loose: true } and configure({ dayFirst: true }) safely."',
      'keywords: ["@native-dates/plugins", loose]',
      'audience: usage',
      'skill: native-dates-plugins',
      'type: skill',
      '---',
      '',
      '# Plugins Guide',
      '',
      '| Col A | Col B |',
      '|---|---|',
      '| 1 | 2 |',
      '',
    ].join('\n');

    expect(checkMarkdownStructure(doc)).toEqual([]);
  });

  it('flags invalid unquoted YAML mappings in frontmatter', () => {
    const broken = [
      '---',
      'title: Plugins Guide',
      'description: Use { loose: true } without quotes',
      '---',
      '',
      '# Plugins Guide',
    ].join('\n');

    const findings = checkMarkdownStructure(broken);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/^L1: invalid YAML frontmatter/);
  });
});
