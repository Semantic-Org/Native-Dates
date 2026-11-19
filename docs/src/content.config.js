import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const page = {
  title: z.string(),
  lede: z.string(),
  kind: z.enum(['class', 'function', 'plugin']).optional(),
  import: z.string().optional(),
  // 'core' or a plugin slug measured from package source at build time
  size: z.string().optional(),
  updated: z.coerce.date(),
};
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object(page),
});

// localized pages mirror src/content/docs under translations/<locale>/ (e.g. translations/ja/docs/guides/types-of-time.md)
// and store `source` (hash of the English source from lib/source-hash.js) to detect stale translations
const translations = defineCollection({
  loader: glob({ pattern: '*/**/*.md', base: './src/content/translations' }),
  schema: z.object({
    // coerce to string in case an unquoted hex hash in YAML consists solely of digits
    source: z.coerce.string(),
    reviewed: z.boolean().optional(),
    title: z.string(),
    lede: z.string().optional(),
    description: z.string().optional(),
    try: z.array(z.string()).optional(),
  }).strict(),
});

const examples = defineCollection({
  loader: glob({
    pattern: '*/example.md',
    base: './src/content/examples',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // files displayed as editor tabs in order, while all files in the directory are included in the sandbox build
    tabs: z.array(z.string()),
    try: z.array(z.string()),
    related: z.array(z.object({ title: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { docs, examples, translations };
