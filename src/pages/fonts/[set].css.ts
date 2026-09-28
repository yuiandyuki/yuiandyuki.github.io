// One cacheable stylesheet per font set, instead of Astro's <Font /> inlining
// ~800 KB of CJK @font-face rules into every page.
//   /fonts/zh.css — Chinese + shared (numbers, italics, code); every page loads it
//   /fonts/ja.css — Japanese glyph shapes and lettering; Japanese pages only
//   /fonts/en.css — English serif and lettering; English pages only
import type { APIRoute, GetStaticPaths } from 'astro';
// The data <Font /> itself renders from. Internal to Astro, so if its shape
// changes on an upgrade, this endpoint fails the build loudly rather than silently.
// @ts-expect-error — virtual module without published types
import { componentDataByCssVariable } from 'virtual:astro:assets/fonts/internal';

const SETS: Record<string, string[]> = {
  zh: ['--font-serif-sc', '--font-sans-sc', '--font-sfx', '--font-brush', '--font-hand', '--font-num', '--font-ital', '--font-mono'],
  ja: ['--font-serif-jp', '--font-sans-jp', '--font-sfx-jp', '--font-brush-jp', '--font-hand-jp'],
  en: ['--font-serif-en', '--font-sfx-en', '--font-hand-en', '--font-sans-en', '--font-balloon-en'],
};

export const getStaticPaths = (() => Object.keys(SETS).map((set) => ({ params: { set } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const data = componentDataByCssVariable as Map<string, { css: string }>;
  const css = SETS[params.set!].map((variable) => {
    const entry = data.get(variable);
    if (!entry) throw new Error(`fonts/${params.set}.css: no font registered for ${variable}`);
    return entry.css;
  });
  return new Response(css.join('\n'), { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
};
