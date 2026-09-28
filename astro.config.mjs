// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import remarkCjkFriendly from 'remark-cjk-friendly';
import rehypeKatex from 'rehype-katex';
import { remarkReadingStats } from './src/plugins/remark-reading-stats.mjs';
import { remarkHtmlImages } from './src/plugins/remark-html-images.mjs';
import { rehypeExternalLinks } from './src/plugins/rehype-external-links.mjs';
import { rehypeManga } from './src/plugins/rehype-manga.mjs';
import { mangaBeta, shikiMeta } from './src/plugins/shiki-manga.mjs';

const google = fontProviders.google();
/** @type {{ styles: ['normal'], subsets: [string, ...string[]] }} */
const cjk = { styles: ['normal'], subsets: ['chinese-simplified', 'latin'] };
/** @type {{ styles: ['normal'], subsets: [string, ...string[]] }} */
const jp = { styles: ['normal'], subsets: ['japanese', 'latin'] };

export default defineConfig({
  site: 'https://luvstar.top',
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Self-hosted at build time, so readers who can't reach Google Fonts still get the lettering.
  fonts: [
    { provider: google, name: 'Noto Serif SC', cssVariable: '--font-serif-sc', weights: [400, 700, 900], ...cjk, fallbacks: ['Songti SC', 'STSong', 'SimSun', 'serif'] },
    { provider: google, name: 'Noto Sans SC', cssVariable: '--font-sans-sc', weights: [400, 700, 900], ...cjk, fallbacks: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'] },
    { provider: google, name: 'ZCOOL QingKe HuangYou', cssVariable: '--font-sfx', weights: [400], ...cjk, fallbacks: ['sans-serif'] },
    { provider: google, name: 'Ma Shan Zheng', cssVariable: '--font-brush', weights: [400], ...cjk, fallbacks: ['serif'] },
    { provider: google, name: 'Long Cang', cssVariable: '--font-hand', weights: [400], ...cjk, fallbacks: ['cursive'] },
    { provider: google, name: 'Oswald', cssVariable: '--font-num', weights: ['300 700'], styles: ['normal'], fallbacks: ['sans-serif'] },
    { provider: google, name: 'Noto Serif Display', cssVariable: '--font-ital', weights: [900], styles: ['italic'], fallbacks: ['serif'] },
    { provider: google, name: 'JetBrains Mono', cssVariable: '--font-mono', weights: [400, 700], styles: ['normal'], fallbacks: ['monospace'] },
    // 日本語: Japanese glyph shapes, plus manga lettering (描き文字, brush, handwriting)
    { provider: google, name: 'Noto Serif JP', cssVariable: '--font-serif-jp', weights: [400, 700, 900], ...jp, fallbacks: ['Hiragino Mincho ProN', 'Yu Mincho', 'serif'] },
    { provider: google, name: 'Noto Sans JP', cssVariable: '--font-sans-jp', weights: [400, 700, 900], ...jp, fallbacks: ['Hiragino Sans', 'Yu Gothic', 'sans-serif'] },
    { provider: google, name: 'Dela Gothic One', cssVariable: '--font-sfx-jp', weights: [400], ...jp, fallbacks: ['sans-serif'] },
    { provider: google, name: 'Yuji Syuku', cssVariable: '--font-brush-jp', weights: [400], ...jp, fallbacks: ['serif'] },
    { provider: google, name: 'Yomogi', cssVariable: '--font-hand-jp', weights: [400], ...jp, fallbacks: ['cursive'] },
    // English: a reading serif, comic lettering, handwriting
    { provider: google, name: 'Newsreader', cssVariable: '--font-serif-en', weights: ['400 700'], styles: ['normal', 'italic'], fallbacks: ['Georgia', 'serif'] },
    { provider: google, name: 'Bangers', cssVariable: '--font-sfx-en', weights: [400], styles: ['normal'], fallbacks: ['sans-serif'] },
    { provider: google, name: 'Caveat', cssVariable: '--font-hand-en', weights: ['400 700'], styles: ['normal'], fallbacks: ['cursive'] },
    { provider: google, name: 'Inter', cssVariable: '--font-sans-en', weights: ['400 900'], styles: ['normal'], fallbacks: ['system-ui', 'sans-serif'] },
    { provider: google, name: 'Comic Neue', cssVariable: '--font-balloon-en', weights: [400, 700], styles: ['normal'], fallbacks: ['sans-serif'] },
  ],
  markdown: {
    // The classic remark/rehype pipeline, for KaTeX and the manga transforms.
    processor: unified({
      // cjk-friendly: lets **《书名》** and **「引号」** bold next to Chinese characters.
      remarkPlugins: [remarkCjkFriendly, remarkMath, remarkHtmlImages, remarkReadingStats],
      rehypePlugins: [
        // Ids first: the manga transform links section numbers to them.
        rehypeHeadingIds,
        [rehypeKatex, { strict: false }],
        rehypeManga,
        rehypeExternalLinks,
      ],
      // Keep the author's punctuation exactly as written.
      smartypants: false,
    }),
    // Code sits in a solid-black ベタ panel in both themes, so one ink-on-black theme.
    shikiConfig: { theme: mangaBeta, transformers: [shikiMeta()] },
  },
});
