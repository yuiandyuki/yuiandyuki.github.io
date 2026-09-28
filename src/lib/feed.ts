import rss from '@astrojs/rss';
import { render } from 'astro:content';
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { site } from '../site.config';
import { getPosts, postUrl } from './posts';
import { HTML_LANG, t, type Lang } from '../i18n';

// Full-text feed per language. The English and Japanese feeds only carry posts
// that have been translated.
export async function feed(lang: Lang, context: APIContext) {
  const container = await AstroContainer.create();
  const posts = (await getPosts({ lang })).filter((p) => p.contentLang === lang).slice(0, 30);
  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post.translation ?? post.source);
      const html = await container.renderToString(Content);
      return {
        title: post.data.title,
        link: postUrl(post),
        pubDate: post.data.date,
        description: post.data.description,
        categories: post.data.tags,
        // Relative image/links in the body need absolute URLs inside a feed reader.
        content: html.replace(/(src|href)="\/(?!\/)/g, `$1="${site.url}/`),
      };
    }),
  );
  return rss({
    title: site.title,
    description: t(lang).tagline,
    site: context.site ?? site.url,
    items,
    customData: `<language>${HTML_LANG[lang]}</language>`,
  });
}
