// Helpers for the manga-panel design: dates, labels, title lettering, scenes.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hashString, sfxLetters } from '../plugins/rehype-manga.mjs';
import { ymd, type Post } from './posts';
import { tagLabel, type Lang } from '../i18n';

export { hashString, sfxLetters };

const pad = (n: number) => String(n).padStart(2, '0');

export const dotDate = (d: Date) => {
  const { year, month, day } = ymd(d);
  return `${year}.${pad(month)}.${pad(day)}`;
};

const DEFAULT_KIND: Record<Lang, string> = { zh: '随笔', en: 'Essay', ja: '随筆' };
/** The tag a post's kind label comes from (if it comes from a tag), for linking. */
export const kindTag = (post: Post) => (post.data.kind ? undefined : post.data.tags[0]);
/** The small label on a post's panel, in the page's language. */
export const kindOf = (post: Post) =>
  post.data.kind ?? (post.data.tags[0] ? tagLabel(post.data.tags[0], post.lang) : DEFAULT_KIND[post.lang]);

export const seedOf = (post: Post) => hashString(post.id) % 9973;

const TONES = ['speed', 'focus', 'tone', 'sky'] as const;
export type Tone = (typeof TONES)[number] | 'night' | 'red';
export const toneOf = (post: Post): Tone => post.data.tone ?? TONES[hashString(post.id) % TONES.length];

/** "读《秋夜》：一株是枣树…" → main 读《秋夜》, sub 一株是枣树… */
export function splitTitle(title: string) {
  const m = title.match(/^(.+?)[：:]\s*(.+)$/) ?? title.match(/^(.+?)——(.+)$/);
  return m ? { main: m[1].trim(), sub: m[2].trim() } : { main: title.trim(), sub: '' };
}

const CJK_OR_PUNCT = /^[　-〿぀-ヿ㐀-䶿一-鿿＀-￯「」『』《》〈〉·…—]+$/u;
/** Titles that can be set top-to-bottom without sideways Latin. */
export const isVerticalFriendly = (s: string) => CJK_OR_PUNCT.test(s.replace(/\s/g, ''));

const OPENERS = /^[《「『（〈【“]+$/u;
const CLOSERS = /^[》」』）〉】”、，。！？：；…—ー]+$/u;

/**
 * Splits a vertical title into `count` columns without breaking words:
 * 为什么又开始写博客 → 为什么 / 又开始 / 写博客. Brackets stay with their word.
 */
export function titleColumns(text: string, count: number, locale = 'zh'): string[] {
  if (count <= 1) return [text];
  const words: string[] = [];
  for (const { segment } of new Intl.Segmenter(locale, { granularity: 'word' }).segment(text)) {
    if (CLOSERS.test(segment) && words.length) words[words.length - 1] += segment;
    else if (words.length && OPENERS.test(words[words.length - 1])) words[words.length - 1] += segment;
    else words.push(segment);
  }
  const target = Math.ceil([...text].length / count);
  const columns: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && [...current].length + [...word].length > target && columns.length < count - 1) {
      columns.push(current);
      current = '';
    }
    current += word;
  }
  columns.push(current);
  return columns;
}

/** Characters per column and font size for a vertical title in a box of the given height. */
export function verticalFit(s: string, boxHeight: number, maxSize: number) {
  const len = [...s.replace(/\s/g, '')].length;
  const perColumn = len <= 4 ? len : len <= 9 ? 3 : len <= 16 ? 4 : 5;
  const size = Math.min(maxSize, Math.floor(boxHeight / (perColumn * 1.04)));
  return { perColumn, size };
}

/**
 * Inline markup for a post's own scene SVG (scene: ./scene.svg), or null for a
 * built-in scene. Inlined so it inherits currentColor and flips with the theme.
 */
export function customScene(post: Post): string | null {
  const scene = post.data.scene;
  if (!scene || !scene.endsWith('.svg') || !post.filePath) return null;
  const file = resolve(dirname(resolve(post.filePath)), scene);
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8')
    .replace(/<\?xml[\s\S]*?\?>/, '')
    // Drop the root's own sizing so it fills the panel, anchored to the bottom edge.
    .replace(/<svg\b([^>]*)>/, (_, attrs: string) =>
      `<svg${attrs.replace(/\s(width|height|preserveAspectRatio|class)="[^"]*"/g, '')} class="scene-svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">`);
}

export const builtinScene = (post: Post) => {
  const scene = post.data.scene;
  return scene && !scene.endsWith('.svg') ? (scene as 'pole' | 'trees' | 'tv' | 'calendar') : undefined;
};

/** Total characters written across published posts (for the nixie counter). */
export function wordCount(posts: Post[]) {
  const CJK = /[㐀-䶿一-鿿豈-﫿぀-ヿ]/g;
  let total = 0;
  for (const post of posts) {
    const body = (post.body ?? '').replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
    total += (body.match(CJK) ?? []).length + (body.replace(CJK, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  }
  return total;
}
