import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

// generates 1200x630 Open Graph PNGs via Satori and Sharp with bundled font files so host fonts are not required
const require = createRequire(import.meta.url);
const font = (pkg, file) => readFileSync(require.resolve(`${pkg}/files/${file}`));
const FONTS = [
  {
    name: 'Sans',
    weight: 500,
    style: 'normal',
    data: font('@fontsource/schibsted-grotesk', 'schibsted-grotesk-latin-500-normal.woff'),
  },
  {
    name: 'Sans',
    weight: 700,
    style: 'normal',
    data: font('@fontsource/schibsted-grotesk', 'schibsted-grotesk-latin-700-normal.woff'),
  },
  {
    name: 'Mono',
    weight: 400,
    style: 'normal',
    data: font('@fontsource/fragment-mono', 'fragment-mono-latin-400-normal.woff'),
  },
];

const C = { bg: '#000000', text: '#ececec', text2: '#b4b4b4', text3: '#7c7c7c', line: '#1a1a22', accent: '#b296ff' };
const MARK = `data:image/svg+xml;utf8,${
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.1" stroke="#b296ff" stroke-width="1.8"/><path d="M12 4.6v1.2M19.4 12h-1.2M12 19.4v-1.2M4.6 12h1.2" stroke="#b296ff" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/><path d="M12 12V6.5" stroke="#ececec" stroke-width="1.5" stroke-linecap="round" transform="rotate(60 12 12)"/><path d="M12 12V8.6" stroke="#ececec" stroke-width="2.4" stroke-linecap="round" transform="rotate(305 12 12)"/></svg>',
  )
}`;

const h = (type, style, children = []) => ({ type, props: { style, children } });
const plainText = (s = '') => s.replace(/`/g, '');

const fit = (s, max = 104) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max)).replace(/[,;:]$/, '')}…`);

export async function renderCard({ title, lede, section, symbol = false }) {
  const rules = h('div', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex' }, [
    ...Array.from(
      { length: 12 },
      (_, i) =>
        h('div', { position: 'absolute', top: 0, height: 630, left: 96 * (i + 1), width: 1, background: C.line }),
    ),
    h('div', {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 1200,
      height: 630,
      backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 15%, #000000 62%)',
    }),
  ]);
  const tree = h('div', {
    display: 'flex',
    width: 1200,
    height: 630,
    background: C.bg,
    fontFamily: 'Sans',
    color: C.text,
  }, [
    rules,
    // use absolute insets instead of padding so content paints above the rules and avoids Satori's padding sizing quirk
    h('div', {
      position: 'absolute',
      top: 72,
      right: 72,
      bottom: 64,
      left: 72,
      display: 'flex',
      flexDirection: 'column',
    }, [
      h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
        { type: 'img', props: { src: MARK, width: 44, height: 44 } },
        h('div', { fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }, 'native-dates'),
      ]),
      h('div', { display: 'flex', flexGrow: 1 }),
      h(
        'div',
        { display: 'flex', flexDirection: 'column', width: 1040 },
        [
          section
            ? h('div', { display: 'flex', fontSize: 28, color: C.accent, fontWeight: 500, marginBottom: 16 }, section)
            : null,
          h('div', {
            display: 'flex',
            fontSize: symbol ? 84 : 76,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: symbol ? -2 : -2.5,
            fontFamily: symbol ? 'Mono' : 'Sans',
          }, title),
          lede
            ? h('div', {
              display: 'flex',
              marginTop: 22,
              fontSize: 32,
              lineHeight: 1.4,
              color: C.text2,
              fontWeight: 500,
            }, fit(plainText(lede)))
            : null,
        ].filter(Boolean),
      ),
    ]),
  ]);
  const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
