#!/usr/bin/env node
// blog — 拉康的a 的写作台
//
// Drafts live in drafts/<slug>/index.md (git-ignored, never pushed); published
// posts in src/content/posts/<slug>/index.md. Each post is a folder so Typora
// can paste images next to the text.

import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import * as p from '@clack/prompts';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fs.realpathSync(fileURLToPath(import.meta.url))), '..');
const POSTS = path.join(ROOT, 'src/content/posts');
const DRAFTS = path.join(ROOT, 'drafts');
const DEV_PORT = Number(process.env.BLOG_PORT ?? 4321);
const EDITOR = process.env.BLOG_EDITOR ?? 'Typora';
const SITE = 'https://luvstar.top';
// BLOG_NO_OPEN=1 skips launching the editor and browser (for scripted runs).
const NO_OPEN = Boolean(process.env.BLOG_NO_OPEN);

const dim = (s) => styleText('dim', s);
const bold = (s) => styleText('bold', s);

// ── posts on disk ───────────────────────────────────────────────────────────

function readPost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { data: YAML.parse(m[1]) ?? {}, fm: m[1], body: m[2] } : { data: {}, fm: '', body: raw };
}

/** Rewrites a few front-matter keys in place, keeping comments and key order. */
function updateFrontMatter(file, fm, body, changes) {
  const doc = YAML.parseDocument(fm);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) doc.delete(key);
    else doc.set(key, value);
  }
  fs.writeFileSync(file, `---\n${doc.toString({ lineWidth: 0 }).trimEnd()}\n---\n\n${body.replace(/^\n+/, '')}`);
}

// New posts start from this, so the optional 分镜设定 are discoverable in Typora.
const NEW_POST = (title, date) => `---
title: ${JSON.stringify(title)}
date: ${date}
description: ""       # 一句话，显示为目次里的作者コメント
tags: []
# —— 分镜设定（都可以不填，不填也好看）——
# kind: 随笔                # 分格上的类别，默认取第一个标签
# balloon: "……写点 / 什么吧。"  # 对话框里的台词，" / " 换行
# balloonType: talk         # talk 说话 / think 心想 / shout 大喊 / elec 电视或电话里的声音
# sfx: 噼里啪啦!!            # 拟声字
# tone: speed               # 背景：speed 流线 / focus 集中线 / tone 网点 / sky 天空 / night 夜空 / red 红网点
# scene: pole               # 小场景：pole 电线杆 / trees 枣树 / tv 电视 / calendar 日历 / ./scene.svg 专属场景图
# cover: ./cover.png        # 你自己画的扉页图（放在这篇的文件夹里）
# aori: 下一话，敬请期待      # 文末 つづく 前的煽句
typora-copy-images-to: ./
---

`;

function writePost(file, data, body) {
  const yaml = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\n${yaml}\n---\n\n${body.replace(/^\n+/, '')}`);
}

const CJK = /[㐀-䶿一-鿿豈-﫿぀-ヿ가-힯]/g;
function countWords(md) {
  const text = md.replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  return (text.match(CJK) ?? []).length + (text.replace(CJK, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
}

function collect() {
  const items = [];
  for (const [base, kind] of [[DRAFTS, 'draft'], [POSTS, 'post']]) {
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base)) {
      const file = path.join(base, name, 'index.md');
      if (!fs.existsSync(file)) continue;
      const { data, fm, body } = readPost(file);
      const stat = fs.statSync(file);
      items.push({
        kind: kind === 'draft' || data.draft ? 'draft' : 'post',
        dir: path.join(base, name),
        file,
        slug: data.slug || name,
        title: data.title || name,
        date: data.date ? new Date(data.date) : stat.birthtime,
        words: countWords(body),
        mtime: stat.mtimeMs,
        data,
        fm,
        body,
      });
    }
  }
  return items.sort((a, b) => b.mtime - a.mtime);
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local time with offset, e.g. 2026-09-27T23:30:00+09:00 — what Typora users expect to read. */
function nowIso(d = new Date()) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
}

function suggestSlug(title) {
  // Chinese titles make perfectly good URLs (/p/自知之明/); Latin ones become kebab-case.
  if (CJK.test(title)) return title.trim().replace(/[\s/\\?#%*:|"<>]+/g, '-');
  return title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function validateSlug(slug, taken) {
  if (!slug?.trim()) return '需要一个 slug（文章网址的最后一段）';
  if (/[\s/\\?#%]/.test(slug)) return 'slug 里不能有空格、斜杠、问号、# 或 %';
  if (taken.has(slug)) return `已经有一篇叫 ${slug} 的文章或草稿了`;
}

function label(item) {
  const badge = item.kind === 'draft' ? styleText('yellow', '草稿') : styleText('green', '已发布');
  return `${badge} ${item.title}`;
}

function hint(item) {
  return `${ymd(item.date)} · ${item.words.toLocaleString('zh-CN')} 字 · /p/${item.slug}/`;
}

// ── processes ───────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function portOpenOn(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.once('connect', () => { socket.end(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

// `astro dev` listens on "localhost", which is ::1 on recent macOS.
async function portOpen(port) {
  const results = await Promise.all(['127.0.0.1', '::1'].map((host) => portOpenOn(port, host)));
  return results.some(Boolean);
}

const ASTRO = path.join(ROOT, 'node_modules/.bin/astro');

/** Starts `astro dev` in the background (once) so every save shows up in the browser. */
async function ensureDevServer() {
  if (await portOpen(DEV_PORT)) return;
  const r = spawnSync(ASTRO, ['dev', '--background', '--port', String(DEV_PORT)], { cwd: ROOT, encoding: 'utf8' });
  for (let i = 0; i < 120; i++) {
    if (await portOpen(DEV_PORT)) return;
    await sleep(250);
  }
  throw new Error(`本地预览没能启动。\n${(r.stderr || r.stdout || '').trim().slice(-600)}\n日志：npx astro dev logs`);
}

function openEditor(file) {
  if (NO_OPEN) return;
  const r = EDITOR === 'code' || EDITOR === 'cursor'
    ? spawnSync(EDITOR, [file], { stdio: 'ignore' })
    : spawnSync('open', ['-a', EDITOR, file], { stdio: 'ignore' });
  if (r.status !== 0) p.log.warn(`没能用 ${EDITOR} 打开，文件在：${file}`);
}

const openUrl = (url) => NO_OPEN || spawnSync('open', [url], { stdio: 'ignore' });
const previewUrl = (slug) => `http://localhost:${DEV_PORT}/p/${encodeURIComponent(slug)}/`;

async function writeAndPreview(item) {
  const s = p.spinner();
  s.start('启动本地预览');
  try {
    await ensureDevServer();
    s.stop(`预览：${previewUrl(item.slug)}`);
  } catch (e) {
    s.stop(e.message, 1);
  }
  openEditor(item.file);
  openUrl(previewUrl(item.slug));
  p.note(
    [
      `在 ${EDITOR} 里写，保存后浏览器自动刷新。`,
      `粘贴的图片会存进文章文件夹：${dim(path.relative(ROOT, item.dir) + '/')}`,
      item.kind === 'draft' ? `写好了运行 ${bold('blog publish')}` : `改好了运行 ${bold('blog deploy')} 推送上线`,
    ].join('\n'),
    item.title,
  );
}

function git(...args) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

// ── commands ────────────────────────────────────────────────────────────────

const cancelled = (v) => {
  if (p.isCancel(v)) { p.cancel('已取消'); process.exit(0); }
  return v;
};

async function pick(items, message, query) {
  if (!items.length) return null;
  if (query) {
    const q = query.toLowerCase();
    const hits = items.filter((x) => x.title.toLowerCase().includes(q) || x.slug.toLowerCase().includes(q));
    if (hits.length === 1) return hits[0];
    if (hits.length) items = hits;
  }
  const choice = cancelled(await p.autocomplete({
    message,
    placeholder: '输入标题或 slug 过滤',
    maxItems: 12,
    options: items.map((x, i) => ({ value: i, label: label(x), hint: hint(x) })),
  }));
  return items[choice];
}

async function cmdNew(titleArg) {
  const taken = new Set(collect().map((x) => x.slug));
  const title = titleArg?.trim() || cancelled(await p.text({
    message: '标题',
    validate: (v) => (v?.trim() ? undefined : '先起个标题吧'),
  })).trim();
  const slug = cancelled(await p.text({
    message: 'slug（网址：luvstar.top/p/<slug>/）',
    initialValue: suggestSlug(title),
    validate: (v) => validateSlug(v?.trim(), taken),
  })).trim();
  const dir = path.join(DRAFTS, slug);
  const file = path.join(dir, 'index.md');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, NEW_POST(title, nowIso()));
  p.log.success(`草稿已创建：${dim(path.relative(ROOT, file))}`);
  await writeAndPreview({ kind: 'draft', dir, file, slug, title });
}

async function cmdEdit(query) {
  const item = await pick(collect(), '继续写哪一篇？', query);
  if (!item) return p.log.warn('还没有任何文章，用 blog new 开始写第一篇');
  await writeAndPreview(item);
}

function cmdList() {
  const items = collect().sort((a, b) => (a.kind === b.kind ? b.date - a.date : a.kind === 'draft' ? -1 : 1));
  if (!items.length) return p.log.info('空空如也。blog new 开始写第一篇。');
  const drafts = items.filter((x) => x.kind === 'draft');
  const posts = items.filter((x) => x.kind === 'post');
  const words = posts.reduce((n, x) => n + x.words, 0);
  // Translation status: EN / 日 lit when index.en.md / index.ja.md exist next to the post.
  const tr = (x) => ['en', 'ja'].map((l) => (fs.existsSync(path.join(x.dir, `index.${l}.md`)) ? styleText('green', l === 'en' ? 'EN' : '日') : dim(l === 'en' ? 'EN' : '日'))).join(' ');
  const row = (x) => `${dim(ymd(x.date))}  ${String(x.words).padStart(6)} 字  ${tr(x)}  ${x.title}  ${dim('/p/' + x.slug + '/')}`;
  if (drafts.length) p.log.message([styleText('yellow', `草稿 ${drafts.length}`), ...drafts.map(row)].join('\n'));
  p.log.message([styleText('green', `已发布 ${posts.length} · 共 ${words.toLocaleString('zh-CN')} 字`), ...posts.map(row)].join('\n'));
}

async function cmdPreview() {
  const s = p.spinner();
  s.start('启动本地预览');
  await ensureDevServer();
  s.stop(`预览：http://localhost:${DEV_PORT}/`);
  openUrl(`http://localhost:${DEV_PORT}/`);
}

function cmdStop() {
  const r = spawnSync(ASTRO, ['dev', 'stop'], { cwd: ROOT, encoding: 'utf8' });
  p.log.info(r.status === 0 ? '本地预览已关闭' : '本地预览没有在运行');
}

function buildCheck() {
  const r = spawnSync(ASTRO, ['build'], { cwd: ROOT, encoding: 'utf8' });
  return { ok: r.status === 0, log: (r.stdout ?? '') + (r.stderr ?? '') };
}

async function cmdPublish(query) {
  const item = await pick(collect().filter((x) => x.kind === 'draft'), '发布哪一篇草稿？', query);
  if (!item) return p.log.info('没有草稿可以发布。blog new 开始写一篇。');
  if (!item.words) {
    const go = cancelled(await p.confirm({ message: '这篇还是空的，确定要发布吗？', initialValue: false, active: '是', inactive: '否' }));
    if (!go) return;
  }

  const data = { ...item.data };
  data.description = cancelled(await p.text({
    message: '一句话简介（显示在列表、RSS 和分享卡片里，可留空）',
    initialValue: data.description ?? '',
  })).trim();
  const tags = cancelled(await p.text({
    message: '标签（用逗号分开，可留空）',
    initialValue: (data.tags ?? []).join(', '),
  }));
  data.tags = tags.split(/[,，、\s]+/).map((t) => t.trim()).filter(Boolean);
  const when = cancelled(await p.select({
    message: '发布日期',
    options: [
      { value: 'now', label: '现在', hint: ymd(new Date()) },
      { value: 'keep', label: '保留草稿日期', hint: ymd(item.date) },
    ],
  }));
  if (when === 'now') data.date = nowIso();

  const target = path.join(POSTS, path.basename(item.dir));
  if (item.dir !== target && fs.existsSync(target)) {
    return p.log.error(`src/content/posts/${path.basename(item.dir)} 已经存在，换个 slug 再发布`);
  }
  updateFrontMatter(item.file, item.fm, item.body, {
    date: data.date,
    description: data.description || undefined,
    tags: data.tags,
    draft: undefined,
  });
  fs.mkdirSync(POSTS, { recursive: true });
  if (item.dir !== target) fs.renameSync(item.dir, target);

  const s = p.spinner();
  s.start('构建检查（图片、公式、链接……）');
  const { ok, log } = buildCheck();
  if (!ok) {
    if (item.dir !== target) fs.renameSync(target, item.dir); // roll back to drafts
    s.stop('构建失败，文章已退回草稿', 1);
    p.log.error(log.split('\n').filter((l) => /error|Error|✘/.test(l)).slice(0, 12).join('\n') || log.slice(-2000));
    return;
  }
  s.stop('构建通过');
  p.log.success(`《${data.title}》已进入正式文章：${dim(path.relative(ROOT, target))}`);

  const push = cancelled(await p.confirm({ message: '现在推送上线吗？', initialValue: true, active: '是', inactive: '否' }));
  if (push) await cmdDeploy(`发布：${data.title}`);
  else p.log.info(`稍后运行 ${bold('blog deploy')} 推送上线`);
}

function inkVault() {
  if (process.env.INK_VAULT) return process.env.INK_VAULT;
  const config = path.join(os.homedir(), 'Library/Application Support/Ink/config.json');
  try {
    return JSON.parse(fs.readFileSync(config, 'utf8')).vault;
  } catch {
    return path.join(os.homedir(), 'Documents/Ink');
  }
}

// Only Ink's articles/ are offered — journals and ideas stay private.
async function cmdImport(query) {
  const articles = path.join(inkVault(), 'articles');
  if (!fs.existsSync(articles)) return p.log.error(`找不到 Ink 的文章目录：${articles}`);
  const items = fs.readdirSync(articles).filter((f) => f.endsWith('.md')).map((f) => {
    const file = path.join(articles, f);
    const { data, body } = readPost(file);
    const stat = fs.statSync(file);
    return {
      kind: data.status === 'draft' ? 'draft' : 'post', file, dir: articles, body, data,
      slug: suggestSlug(data.title ?? f.replace(/\.md$/, '')),
      title: data.title ?? f.replace(/\.md$/, ''),
      date: data.created ? new Date(data.created) : stat.birthtime,
      words: countWords(body), mtime: stat.mtimeMs,
    };
  }).sort((a, b) => b.mtime - a.mtime);

  const src = await pick(items, '从 Ink 导入哪篇文章？（只读取，不会改动 Ink）', query);
  if (!src) return p.log.info('Ink 里还没有文章');

  const taken = new Set(collect().map((x) => x.slug));
  const slug = cancelled(await p.text({
    message: 'slug（网址：luvstar.top/p/<slug>/）',
    initialValue: src.slug,
    validate: (v) => validateSlug(v?.trim(), taken),
  })).trim();
  const dir = path.join(DRAFTS, slug);
  fs.mkdirSync(dir, { recursive: true });

  // Ink's template starts with "# 标题"; the blog prints the title itself.
  let body = src.body.replace(/^\s*#\s+(.+)\n/, (line, h) => (h.trim() === src.title.trim() ? '' : line));
  let copied = 0;
  const copyImage = (ref) => {
    if (/^(https?:|data:|\/)/.test(ref)) return ref;
    const from = path.resolve(path.dirname(src.file), decodeURI(ref));
    if (!fs.existsSync(from)) return ref;
    const name = path.basename(from);
    fs.copyFileSync(from, path.join(dir, name));
    copied++;
    return `./${encodeURI(name)}`;
  };
  body = body
    .replace(/(!\[[^\]]*\]\()(<?)([^)\s>]+)(>?)([^)]*\))/g, (_, a, lt, ref, gt, rest) => `${a}${lt}${copyImage(ref)}${gt}${rest}`)
    .replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (_, a, ref, b) => `${a}${copyImage(ref)}${b}`);

  const file = path.join(dir, 'index.md');
  writePost(file, {
    title: src.title,
    date: src.data.created ?? nowIso(),
    description: '',
    tags: [],
    'typora-copy-images-to': './',
  }, body);
  p.log.success(`已导入为草稿：${dim(path.relative(ROOT, file))}（图片 ${copied} 张）`);
  await writeAndPreview({ kind: 'draft', dir, file, slug, title: src.title });
}

async function cmdDeploy(message) {
  if (git('rev-parse', '--is-inside-work-tree').status !== 0) {
    return p.log.error('这个目录还没有连上 GitHub 仓库，先完成首次上线设置。');
  }
  const status = git('status', '--porcelain').stdout.trim();
  if (!status) return p.log.info('没有新的改动需要推送');
  const lines = status.split('\n');
  p.log.message([dim(`改动 ${lines.length} 处：`), ...lines.slice(0, 15).map((l) => dim(l)), lines.length > 15 ? dim('…') : ''].join('\n'));
  const msg = message || cancelled(await p.text({ message: '这次更新的说明', initialValue: `更新：${ymd(new Date())}` }));
  const go = cancelled(await p.confirm({ message: `推送到 GitHub 并部署到 ${SITE}？`, active: '是', inactive: '否' }));
  if (!go) return;
  const s = p.spinner();
  s.start('推送中');
  for (const args of [['add', '-A'], ['commit', '-m', msg], ['push']]) {
    const r = git(...args);
    if (r.status !== 0) { s.stop(`git ${args[0]} 失败`, 1); return p.log.error(r.stderr || r.stdout); }
  }
  s.stop('已推送');
  const remote = git('remote', 'get-url', 'origin').stdout.trim().replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
  p.log.success(`GitHub Actions 正在构建，大约一分钟后上线：${SITE}\n${dim(remote + '/actions')}`);
}

function cmdDoctor() {
  const check = (ok, text) => p.log[ok ? 'success' : 'warn'](text);
  check(Number(process.versions.node.split('.')[0]) >= 22, `Node ${process.versions.node}`);
  check(fs.existsSync(`/Applications/${EDITOR}.app`) || EDITOR === 'code' || EDITOR === 'cursor', `编辑器：${EDITOR}`);
  check(fs.existsSync(path.join(ROOT, 'node_modules')), '依赖已安装');
  const inRepo = git('rev-parse', '--is-inside-work-tree').status === 0;
  check(inRepo, inRepo ? `git 远端：${git('remote', 'get-url', 'origin').stdout.trim() || '（未设置）'}` : '还不是 git 仓库（首次上线时设置）');
  check(fs.existsSync(path.join(inkVault(), 'articles')), `Ink 写作库：${inkVault()}`);
  const drafts = collect().filter((x) => x.kind === 'draft').length;
  p.log.info(`草稿 ${drafts} 篇 · 草稿目录不会被推送（.gitignore）`);
}

const HELP = `
${bold('blog')} — 拉康的a 的写作台

  blog                    打开菜单
  blog new [标题]         新建草稿：Typora 里写，浏览器实时预览
  blog edit [关键词]      继续写一篇（草稿或已发布）
  blog list               列出全部草稿和文章
  blog publish [关键词]   把草稿发布成正式文章（构建检查通过后可直接上线）
  blog import [关键词]    从 Ink 的 articles/ 导入一篇为草稿（只读，不改动 Ink）
  blog deploy [说明]      推送全部改动，自动部署到 luvstar.top
  blog preview            打开本地预览
  blog stop               关掉本地预览
  blog doctor             检查写作环境

  环境变量：BLOG_EDITOR（默认 Typora，也可以是 code）、BLOG_PORT（默认 4321）
`;

async function menu() {
  const action = cancelled(await p.select({
    message: '想做什么？',
    options: [
      { value: 'new', label: '写一篇新文章' },
      { value: 'edit', label: '继续写' },
      { value: 'publish', label: '发布草稿' },
      { value: 'import', label: '从 Ink 导入', hint: '只读 articles/' },
      { value: 'list', label: '看看都写了什么' },
      { value: 'preview', label: '打开本地预览' },
      { value: 'deploy', label: '推送上线' },
    ],
  }));
  await COMMANDS[action]();
}

const COMMANDS = {
  new: cmdNew, edit: cmdEdit, list: cmdList, ls: cmdList, publish: cmdPublish, import: cmdImport,
  deploy: cmdDeploy, preview: cmdPreview, dev: cmdPreview, stop: cmdStop, doctor: cmdDoctor,
};

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(HELP);
} else {
  p.intro(`${styleText(['bgRed', 'white', 'bold'], ' a ')} ${bold('拉康的a')} ${dim('· 写作台')}`);
  try {
    if (!cmd) await menu();
    else if (COMMANDS[cmd]) await COMMANDS[cmd](rest.join(' ') || undefined);
    else { p.log.error(`没有 ${cmd} 这个命令`); console.log(HELP); process.exitCode = 1; }
    p.outro(dim(SITE));
  } catch (e) {
    p.log.error(e.message);
    process.exitCode = 1;
  }
}
