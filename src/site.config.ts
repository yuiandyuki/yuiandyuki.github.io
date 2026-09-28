// Everything a reader sees about "who and what" this site is lives here.
export const site = {
  // The masthead is the pen name.
  title: '拉康的a',
  // Masthead lettering: `main` in heavy serif, `accent` in red italic.
  logo: { main: '拉康的', accent: 'a' },
  // 徒然: Chinese "in vain"; Japanese つれづれ, as in 徒然草. Shown in the footer.
  motto: '徒然',
  tagline: '无数渺小的思考充满了人的一生',
  description: '拉康的a 的博客。无数渺小的思考充满了人的一生。',
  url: 'https://luvstar.top',
  // Pen name. (luvstar is only the domain / handle.)
  author: '拉康的a',
  lang: 'zh-CN',
  since: 2023,
  github: 'https://github.com/yuiandyuki',
  githubUser: 'yuiandyuki',
  // Source repository: 留言 opens an issue here.
  repo: 'https://github.com/yuiandyuki/yuiandyuki.github.io',
} as const;

export const profile = {
  // The author box on the home and about pages.
  name: '拉康的a',
  bio: '写代码，读闲书，偶尔画画。',
  // 立绘位: 'slot' shows the reserved panel for your own drawing, 'off' hides it,
  // 'image' shows `artImage` (put the file in public/, e.g. /art/cover.png).
  art: 'slot' as 'slot' | 'off' | 'image',
  artImage: '',
} as const;

// Japanese manga-book words: 表纸 (表紙, the cover), 目次 (contents), 单行本 (collected volumes, one per tag),
// 作者的话 (author's note); 定期购读 (subscription) is the RSS link in the masthead.
export const nav = [
  { label: '表纸', href: '/' }, // 表紙: the cover
  { label: '目次', href: '/archive/' },
  { label: '单行本', href: '/tags/' },
  { label: '作者的话', href: '/about/' },
] as const;
