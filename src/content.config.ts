import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One collection, two homes:
//   src/content/posts/<slug>/index.md  — published, committed to git
//   drafts/<slug>/index.md             — private work in progress, git-ignored,
//                                        visible only in `astro dev`
// Each post is a folder so Typora can paste images right next to the text.
const posts = defineCollection({
  loader: glob({
    base: '.',
    pattern: ['src/content/posts/**/index.md', 'drafts/**/index.md'],
    generateId: ({ entry, data }) =>
      typeof data.slug === 'string' && data.slug ? data.slug : entry.split('/').at(-2)!,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      // One line; shown as the author's comment (作者コメント) in the table of contents.
      description: z.string().optional(),
      tags: z.array(z.string()).default([]),
      slug: z.string().optional(),
      series: z.string().optional(),
      // The author's own drawing: title-page art and the cover panel.
      cover: image().optional(),
      draft: z.boolean().default(false),
      // Published and reachable by URL, but left out of lists and feeds.
      unlisted: z.boolean().default(false),

      // —— 分镜设定: all optional; every panel looks fine without them ——
      kind: z.string().optional(), // label on the panel; defaults to the first tag
      balloon: z.string().optional(), // a line of dialogue in a speech balloon
      balloonType: z.enum(['talk', 'shout', 'think', 'elec']).default('talk'),
      sfx: z.string().optional(), // 描き文字 sound effect, e.g. 噼里啪啦!!
      tone: z.enum(['speed', 'focus', 'tone', 'sky', 'night', 'red']).optional(),
      // A built-in scene, or a line-art SVG drawn for this post (e.g. ./scene.svg in
      // the post folder; drawn in currentColor so it follows the ink in dark mode).
      scene: z.union([z.enum(['pole', 'trees', 'tv', 'calendar']), z.string().regex(/\.svg$/)]).optional(),
      aori: z.string().optional(), // a closing line beside the 完 stamp
      // Unknown keys (e.g. Typora's `typora-copy-images-to`) are dropped.
    }),
});

// Translations sit next to the original: <post folder>/index.en.md, index.ja.md.
// Only the words are translated; date, tags, scene and art come from the original.
const translations = defineCollection({
  loader: glob({
    base: '.',
    pattern: ['src/content/posts/**/index.{en,ja}.md', 'drafts/**/index.{en,ja}.md'],
    generateId: ({ entry }) => entry,
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    kind: z.string().optional(),
    balloon: z.string().optional(),
    sfx: z.string().optional(),
    aori: z.string().optional(),
    translator: z.string().default('Claude'),
    // Set to true once the author has read the translation.
    reviewed: z.boolean().default(false),
  }),
});

export const collections = { posts, translations };
