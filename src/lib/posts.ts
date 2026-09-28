import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, localePath, type Lang } from '../i18n';

export type Entry = CollectionEntry<'posts'>;
export type Translation = CollectionEntry<'translations'>;

/**
 * A post as seen from one language: when a translation exists its words replace
 * the original's; otherwise the Chinese original shows through (contentLang 'zh').
 */
export type Post = Entry & {
  lang: Lang; // the page's language
  contentLang: Lang; // the language the words are actually in
  sfxLang: Lang; // sound effects stay as lettered in the original unless translated
  translation?: Translation;
  source: Entry; // the Chinese original, for render() and file paths
};

export const isDraft = (post: Entry) =>
  post.data.draft || (post.filePath ?? '').startsWith('drafts/');

const folder = (filePath = '') => filePath.replace(/\/[^/]*$/, '');
const translationLang = (t: Translation) => (t.filePath ?? '').match(/index\.(en|ja)\.md$/)?.[1] as Lang | undefined;

/** Posts visible in this build, newest first, as seen from `lang`. Drafts only exist in `astro dev`. */
export async function getPosts({ lang = DEFAULT_LANG, includeUnlisted = false }: { lang?: Lang; includeUnlisted?: boolean } = {}): Promise<Post[]> {
  const entries = (await getCollection('posts', (post) => import.meta.env.DEV || !isDraft(post)))
    .filter((post) => includeUnlisted || !post.data.unlisted)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const byFolder = new Map<string, Translation>();
  if (lang !== DEFAULT_LANG) {
    for (const t of await getCollection('translations')) {
      if (translationLang(t) === lang) byFolder.set(folder(t.filePath), t);
    }
  }

  return entries.map((entry) => {
    const translation = byFolder.get(folder(entry.filePath));
    if (!translation) return { ...entry, lang, contentLang: DEFAULT_LANG, sfxLang: DEFAULT_LANG, source: entry };
    const tr = translation.data;
    return {
      ...entry,
      data: {
        ...entry.data,
        title: tr.title,
        description: tr.description,
        kind: tr.kind ?? entry.data.kind,
        balloon: tr.balloon,
        // Sound effects stay as drawn unless the translation letters its own.
        sfx: tr.sfx ?? entry.data.sfx,
        aori: tr.aori,
      },
      lang,
      contentLang: lang,
      sfxLang: tr.sfx ? lang : DEFAULT_LANG,
      translation,
      source: entry,
    };
  });
}

export const postUrl = (post: Post) => localePath(post.lang, `/p/${post.id}/`);

export function groupByYear(posts: Post[]) {
  const years = new Map<number, Post[]>();
  for (const post of posts) {
    const year = ymd(post.data.date).year;
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return [...years.entries()];
}

export function tagCounts(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
}

// Dates are shown in the author's timezone, so a local build and the CI build
// (which runs in UTC) print the same day.
export const TIME_ZONE = 'Asia/Tokyo';
const ymdFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function ymd(d: Date) {
  const [year, month, day] = ymdFormat.format(d).split('-').map(Number);
  return { year, month, day };
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d: Date) => {
  const { year, month, day } = ymd(d);
  return `${year}-${pad(month)}-${pad(day)}`;
};
