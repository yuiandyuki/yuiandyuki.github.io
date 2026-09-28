// Static paths shared by the Chinese pages (at the root) and the /en/ and /ja/ copies.
import { getPosts, tagCounts } from './posts';
import type { Lang } from '../i18n';

export const OTHER_LANGS = ['en', 'ja'] as const;

export async function postPaths(lang: Lang) {
  // Neighbours come from the listed posts only; unlisted posts stand alone.
  const listed = await getPosts({ lang });
  const all = await getPosts({ lang, includeUnlisted: true });
  return all.map((post) => {
    const i = listed.findIndex((p) => p.id === post.id);
    // Newest first: the newer post is the one just before in the list.
    return {
      params: { slug: post.id },
      props: { lang, post, newer: i > 0 ? listed[i - 1] : undefined, older: i >= 0 ? listed[i + 1] : undefined },
    };
  });
}

export async function tagPaths(lang: Lang) {
  const posts = await getPosts({ lang });
  return tagCounts(posts).map(([tag], i) => ({
    params: { tag },
    props: { lang, tag, volume: i + 1, posts: posts.filter((p) => p.data.tags.includes(tag)) },
  }));
}
