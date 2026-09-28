# 徒然 · luvstar.top

拉康的a 的博客。无数渺小的思考充满了人的一生。

名字取自《徒然草》（つれづれ，把掠过心里的念头随手写下）；中文里“徒然”又是“白费”。页面用漫画分格的美术风格排版。

## 写作

```bash
blog                    # 菜单
blog new "标题"         # 新建草稿：Typora 里写，浏览器实时预览
blog edit [关键词]      # 继续写
blog publish [关键词]   # 草稿 → 正式文章（构建检查通过后可直接上线）
blog import [关键词]    # 从 Ink 的 articles/ 导入一篇为草稿（只读，不改动 Ink）
blog deploy [说明]      # 推送改动，GitHub Actions 自动部署
blog list | preview | stop | doctor
```

- 每篇文章是一个文件夹：`index.md` 加上它的图片。在 Typora 里直接粘贴图片，会自动存进这个文件夹。
- 草稿在 `drafts/`，被 `.gitignore` 排除，**永远不会推送到公开仓库**；只在本地预览里出现，并带“草稿”标记。
- 正式文章在 `src/content/posts/<slug>/`，网址是 `luvstar.top/p/<slug>/`。

### Front matter

```yaml
---
title: 标题                 # 必填
date: 2026-09-27T23:30:00+09:00
description: 一句话          # 文章列表里的手写体简介，也用于 RSS 和分享卡片
tags: [随笔, rust]
updated: 2026-10-01         # 可选：最近修改
series: 系列名              # 可选
unlisted: true              # 可选：能通过网址访问，但不进列表和 RSS
draft: true                 # 可选：即使在正式目录里也不发布

# —— 分镜设定（都可以不填，不填也好看）——
kind: 技术                  # 分格上的类别，默认取第一个标签
balloon: "……写点 / 什么吧。"   # 对话框台词，" / " 换行
balloonType: talk           # talk 说话 / think 心想 / shout 大喊 / elec 电视或电话里的声音
sfx: 噼里啪啦!!              # 拟声字
tone: speed                 # 背景：speed 流线 / focus 集中线 / tone 网点 / sky 天空 / night 夜空 / red 红网点
scene: pole                 # 小场景：pole 电线杆 / trees 枣树 / tv 电视 / calendar 日历
scene: ./scene.svg          # ……或者这篇专属的场景线稿（放在文章文件夹里）
cover: ./cover.png          # 你自己画的扉页图
aori: 一句收尾的话          # 可选：文末「完」字印章旁的一句话
---
```

### 正文会被排成漫画

| 写法 | 效果 |
| --- | --- |
| `## 小标题` | 带流线的横格，右下角 § 编号 |
| `> 一株是枣树，`<br>`> 还有一株也是枣树。`<br>`>`<br>`> —— 鲁迅《秋夜》` | 对话框；短句竖排、长句横排；以 —— 开头的最后一行是署名 |
| `> [!NOTE]` / `> [!WARNING]` | 旁白框 |
| ` ```rust title="src/x.rs" sfx="嘀嗒" ` | 黑底ベタ格，左上角语言标签，可加拟声字 |
| `[^1]` 脚注 | 页边的「※ 作者注」（手机上跟在段落后） |
| 单独一行的图片 | 带框的格子，alt 文字是图注 |
| `---` | 场景切换 ◆ ◆ ◆ |
| `**加粗**` / `*强调*` | 荧光笔划线 / 着重号 |

还支持表格、`$公式$`（KaTeX）。第一段自动放大加粗当导语，段落首行缩进两格。

### 自动生成的东西

- 首页：最新一篇是大格，之后 6 篇排成两排分格；更早的文章进列表。
- 文末：「完」字印章，接上一篇 / 下一篇，以及留言（GitHub Issues）。
- 辉光管：累计写下的字数。

### 立绘位与画

- 首页右上的「立绘位」留给你的手绘：在 `src/site.config.ts` 里把 `profile.art` 改成 `'image'`，`artImage` 指向 `public/` 下的图（建议 1200×1800 透明底 PNG）；不想要就改成 `'off'`。手机上占位框不显示。
- 某一篇想用自己的画当扉页：图放进文章文件夹，写 `cover: ./图.png`。
- 场景线稿（`scene.svg`）用 `currentColor` 画，就会自动用墨色。

## 三语

- 中文在 `luvstar.top/`，英文在 `/en/`，日文在 `/ja/`，刊头右上角切换。
- 只写中文。想要译文时说一声“翻译这篇”，Claude 会在文章文件夹里生成 `index.en.md` 和 `index.ja.md`：

  ```yaml
  ---
  title: On “Autumn Night”
  description: 一句话简介的译文
  translator: Claude
  reviewed: false     # 你读过、觉得没问题就改成 true，页面上会显示“作者已校对”
  ---
  ```

- 没有译文的文章，英文/日文版里照常列出，点进去显示中文原文并注明“只有中文版”。英文、日文的 RSS 只收录已翻译的文章。
- 界面文字在 `src/i18n.ts`；新标签的英文/日文写法加在 `TAG_LABELS`。
- `blog list` 里 EN / 日 亮起表示已有译文。

## 开发

```bash
npm install
npm run dev      # http://localhost:4321（草稿也会显示）
npm run build    # astro build + Pagefind 全文搜索索引
```

- `src/site.config.ts`：站名、笔名、简介、导航、立绘位
- `src/content.config.ts`：文章字段定义
- `src/plugins/rehype-manga.mjs`：把 Markdown 排成漫画的规则
- `src/styles/manga.css`：全部样式；`src/scripts/manga.ts`：现场生成集中线、流线、对话框
- 字体在构建时从 Google Fonts 下载后自托管（`astro.config.mjs` 的 `fonts`），国内读者也能正常显示
- `scripts/blog.mjs`：写作工具（`~/.local/bin/blog` 链接到这里）

## 部署

推送到 `main` 后，`.github/workflows/deploy.yml` 构建并发布到 GitHub Pages；`public/CNAME` 绑定 `luvstar.top`。
