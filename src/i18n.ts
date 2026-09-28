// Three languages. Chinese is the original and lives at the root; English and
// Japanese live under /en/ and /ja/. The author writes in Chinese only: posts are
// translated into index.en.md / index.ja.md next to the original.

export const LANGS = ['zh', 'en', 'ja'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'zh';

export const HTML_LANG: Record<Lang, string> = { zh: 'zh-CN', en: 'en', ja: 'ja' };
export const SWITCH_LABEL: Record<Lang, string> = { zh: '中', en: 'EN', ja: '日' };

export const isLang = (s: string | undefined): s is Lang => !!s && (LANGS as readonly string[]).includes(s);

/** '/p/x/' in the given language: '/p/x/', '/en/p/x/', '/ja/p/x/'. */
export const localePath = (lang: Lang, path: string) => (lang === DEFAULT_LANG ? path : `/${lang}${path}`);

/** Splits '/ja/p/x/' into ['ja', '/p/x/']. */
export function splitLocale(pathname: string): [Lang, string] {
  const m = pathname.match(/^\/(en|ja)(\/.*)?$/);
  return m ? [m[1] as Lang, m[2] ?? '/'] : [DEFAULT_LANG, pathname];
}

const TZ = 'Asia/Tokyo';

export const ui = {
  zh: {
    nav: { cover: '表纸', contents: '目次', volumes: '单行本', about: '作者的话', rss: '定期购读' },
    tagline: '无数渺小的思考充满了人的一生',
    motto: '徒然',
    description: '拉康的a 的博客。无数渺小的思考充满了人的一生。',
    skip: '跳到正文',
    bio: '读读闲书，看看动画。',
    counter: { caption: '累计写作', unit: '字', note: '※ 迄今写下的字数。', joke: (rest: string) => `距《银河英雄传说》十卷约 212 万字，尚差 ${rest} 字。`, label: (n: number) => `累计写作 ${n} 字` },
    latest: '最新',
    read: '阅读 →',
    empty: ['第一篇，正在写。', '（马上就好。）'],
    earlier: '更早的文章',
    author: '作者',
    volumes: '单行本',
    noVolumes: '还没有成卷的文章。',
    allPosts: '全部文章',
    contentsSfx: '目次',
    postCount: (n: number) => `共 ${n} 篇 →`,
    contents: { title: '目次', total: (n: number) => `全部 ${n} 篇`, year: (n: number) => `${n} 篇`, empty: '还没有文章。' },
    volumePage: { title: '单行本', sub: '每个标签是一卷', vol: (n: number) => `第 ${n} 卷`, count: (n: number) => `收录 ${n} 篇`, back: '← 全部单行本', empty: '还没有成卷的文章。' },
    aboutPage: { title: '作者的话', sfx: '作者的话', sub: "AUTHOR'S NOTE" },
    post: {
      meta: (words: string, min: number) => `${words} 字 · 约 ${min} 分钟`,
      fin: '完', next: '下一篇', prev: '上一篇', all: '全部文章', backToContents: '回到目次',
      letter: '留言', letterText: '看完有话想说？给我写几句吧。', letterButton: '写留言 →', letterTo: '寄到 GitHub Issues · 需要 GitHub 账号。', letterTitle: '留言',
      draft: '草稿',
      translated: (by: string, reviewed: boolean) => `翻译：${by}${reviewed ? ' · 作者已校对' : ''}`,
      original: '',
    },
    art: { big: '立绘位', s1: '作者手绘预留', s3: '1200 × 1800 · 透明底 PNG · 出血 3mm', note: '↑ 头发可以出框', label: '立绘位：作者手绘预留' },
    footer: { rights: '未经许可请勿转载' },
    notFound: { title: '这一页不存在。', sub: '也可能还没写。', back: '回到表纸 →' },
    markdown: { note: '※ 注', tip: '※ 提示', important: '※ 重要', warning: '！注意', footnote: (n: number) => `※ 作者注 ${n}`, back: '↩ 回正文', backLabel: '回到正文', noteLabel: (n: number) => `作者注 ${n}`, anchor: '链接到本节' },
    date: (d: Date) => new Intl.DateTimeFormat('zh-CN', { timeZone: TZ, year: 'numeric', month: 'long', day: 'numeric' }).format(d),
  },
  en: {
    nav: { cover: 'Cover', contents: 'Contents', volumes: 'Volumes', about: "Author's Note", rss: 'Subscribe' },
    tagline: 'Countless small thoughts fill a life',
    motto: 'Tsurezure',
    description: 'The blog of 拉康的a (Lacan’s a). Countless small thoughts fill a life.',
    skip: 'Skip to content',
    bio: 'Reads for fun, watches anime.',
    counter: { caption: 'WRITTEN', unit: '字', note: '※ Characters written so far.', joke: (rest: string) => ` ${rest} to go before Legend of the Galactic Heroes (~2,120,000).`, label: (n: number) => `${n} characters written` },
    latest: 'LATEST',
    read: 'Read →',
    empty: ['The first post is on its way.', '(Almost there.)'],
    earlier: 'Earlier',
    author: 'AUTHOR',
    volumes: 'VOLUMES',
    noVolumes: 'No volumes yet.',
    allPosts: 'ALL POSTS',
    contentsSfx: 'INDEX!',
    postCount: (n: number) => `${n} post${n === 1 ? '' : 's'} →`,
    contents: { title: 'Contents', total: (n: number) => `${n} post${n === 1 ? '' : 's'}`, year: (n: number) => `${n}`, empty: 'Nothing here yet.' },
    volumePage: { title: 'Volumes', sub: 'One volume per tag', vol: (n: number) => `Vol. ${n}`, count: (n: number) => `${n} post${n === 1 ? '' : 's'}`, back: '← All volumes', empty: 'No volumes yet.' },
    aboutPage: { title: "Author's Note", sfx: 'HELLO!', sub: '作者的话' },
    post: {
      meta: (_words: string, min: number) => `${min} min read`,
      fin: 'END', next: 'Next', prev: 'Previous', all: 'All posts', backToContents: 'Back to contents',
      letter: 'Letters', letterText: 'Something to say? Write me a few lines.', letterButton: 'Write a letter →', letterTo: 'Sent via GitHub Issues · needs a GitHub account.', letterTitle: 'Letter',
      draft: 'DRAFT',
      translated: (by: string, reviewed: boolean) => `Translated from the Chinese by ${by}${reviewed ? ' · reviewed by the author' : ''}`,
      original: 'This post is only available in Chinese.',
    },
    art: { big: '立绘位', s1: "Reserved for the author's drawing", s3: '1200 × 1800 · transparent PNG · 3mm bleed', note: '↑ hair may break the frame', label: "Art slot: reserved for the author's drawing" },
    footer: { rights: 'All rights reserved' },
    notFound: { title: 'This page does not exist.', sub: 'Or it hasn’t been written yet.', back: 'Back to the cover →' },
    markdown: { note: '※ Note', tip: '※ Tip', important: '※ Important', warning: '! Warning', footnote: (n: number) => `※ Note ${n}`, back: '↩ back', backLabel: 'Back to the text', noteLabel: (n: number) => `Note ${n}`, anchor: 'Link to this section' },
    date: (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'short', day: 'numeric' }).format(d),
  },
  ja: {
    nav: { cover: '表紙', contents: '目次', volumes: '単行本', about: '作者の言葉', rss: '定期購読' },
    tagline: '無数の小さな思考が、人の一生を満たしている',
    motto: '徒然',
    description: '拉康的a（ラカンのa）のブログ。無数の小さな思考が、人の一生を満たしている。',
    skip: '本文へ',
    bio: '気ままに本を読んだり、アニメを観たり。',
    counter: { caption: '累計執筆', unit: '字', note: '※ これまでに書いた字数。', joke: (rest: string) => `『銀河英雄伝説』全十巻（約212万字）まで、あと ${rest} 字。`, label: (n: number) => `累計執筆 ${n} 字` },
    latest: '最新',
    read: '読む →',
    empty: ['第一話、執筆中。', '（もうすぐです。）'],
    earlier: '以前の記事',
    author: '作者',
    volumes: '単行本',
    noVolumes: 'まだ単行本はありません。',
    allPosts: 'すべての記事',
    contentsSfx: '目次',
    postCount: (n: number) => `全${n}本 →`,
    contents: { title: '目次', total: (n: number) => `全${n}本`, year: (n: number) => `${n}本`, empty: 'まだ記事はありません。' },
    volumePage: { title: '単行本', sub: 'タグごとに一冊', vol: (n: number) => `第${n}巻`, count: (n: number) => `収録 ${n} 本`, back: '← 単行本一覧', empty: 'まだ単行本はありません。' },
    aboutPage: { title: '作者の言葉', sfx: '作者の言葉', sub: "AUTHOR'S NOTE" },
    post: {
      meta: (words: string, min: number) => `${words}字 · 約${min}分`,
      fin: '完', next: '次の記事', prev: '前の記事', all: 'すべての記事', backToContents: '目次へ',
      letter: 'お便り', letterText: '感想があれば、ひとことどうぞ。', letterButton: 'お便りを書く →', letterTo: 'GitHub Issues に届きます · GitHub アカウントが必要です。', letterTitle: 'お便り',
      draft: '下書き',
      translated: (by: string, reviewed: boolean) => `中国語原文より翻訳：${by}${reviewed ? '（作者確認済み）' : ''}`,
      original: 'この記事は中国語のみです。',
    },
    art: { big: '立ち絵', s1: '作者の手描き予定', s3: '1200 × 1800・透過PNG・塗り足し3mm', note: '↑ 髪は枠からはみ出してOK', label: '立ち絵枠：作者の手描き予定' },
    footer: { rights: '無断転載禁止' },
    notFound: { title: 'このページは存在しません。', sub: 'まだ描いていないのかも。', back: '表紙へ戻る →' },
    markdown: { note: '※ 注', tip: '※ ヒント', important: '※ 重要', warning: '！注意', footnote: (n: number) => `※ 作者注 ${n}`, back: '↩ 本文へ', backLabel: '本文へ戻る', noteLabel: (n: number) => `作者注 ${n}`, anchor: 'この節へのリンク' },
    date: (d: Date) => new Intl.DateTimeFormat('ja-JP', { timeZone: TZ, year: 'numeric', month: 'long', day: 'numeric' }).format(d),
  },
} as const;

export type UI = (typeof ui)['zh'];
export const t = (lang: Lang) => ui[lang] as unknown as UI;

/** Nav items for a language, with localized hrefs. */
export const navFor = (lang: Lang) => {
  const n = t(lang).nav;
  return [
    { label: n.cover, href: localePath(lang, '/') },
    { label: n.contents, href: localePath(lang, '/archive/') },
    { label: n.volumes, href: localePath(lang, '/tags/') },
    { label: n.about, href: localePath(lang, '/about/') },
  ];
};

// Tag names are written in Chinese in front matter; these are their faces elsewhere.
// Add a line when you start a new tag (unknown tags just show as written).
export const TAG_LABELS: Record<string, Partial<Record<Lang, string>>> = {
  随笔: { en: 'Essays', ja: '随筆' },
  读书: { en: 'Reading', ja: '読書' },
  技术: { en: 'Tech', ja: '技術' },
  番剧: { en: 'Anime', ja: 'アニメ' },
  算法: { en: 'Algorithms', ja: 'アルゴリズム' },
  分布式: { en: 'Distributed', ja: '分散システム' },
  测试: { en: 'Test', ja: 'テスト' },
};
export const tagLabel = (tag: string, lang: Lang) => TAG_LABELS[tag]?.[lang] ?? tag;
