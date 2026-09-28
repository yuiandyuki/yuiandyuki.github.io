# Notes for AI assistants

Personal Chinese blog 「徒然」 by the pen name 拉康的a (luvstar.top), Astro 7. The visual style is manga
(分镜: panels, 网点, 集中线, balloons, 描き文字) but it is a plain blog — no magazine issues, episode
numbers or 预告; the owner writes few posts, so layouts must look good with one or two. Talk to the owner
in Chinese. See README.md for the writing workflow, front matter and the Markdown → manga rules.

- `drafts/` is private and git-ignored. Never move, copy, publish or push anything from it unless the owner asks for that specific post.
- Posts are the owner's words: don't rewrite, trim or "polish" post text unless asked. Fixing front matter or markup is fine.
- The repo is public (GitHub Pages). Don't commit secrets, and ask before `git push` — a push deploys the live site.
- Light theme only: the owner decided against a dark/night version. Keep new UI paper + ink + one spot red.
- The owner dislikes "AI 味" design (soft-shadow cards, glow gradients, emoji, generic slogans). New visuals should use the
  manga grammar already in `src/styles/manga.css`.
- Drawing a post's scene when asked ("给这篇画个扉页"): write `scene.svg` into the post's folder (viewBox about 800×320,
  line art in `currentColor`, solid areas `fill="currentColor"`, occluding shapes `fill="var(--paper)"`), then set
  `scene: ./scene.svg` in its front matter. Draw places and objects, not people — characters are the owner's to draw.
- Three languages: Chinese at `/`, English at `/en/`, Japanese at `/ja/`. UI strings live in `src/i18n.ts` (add new tags to
  `TAG_LABELS`). The owner writes Chinese only. When asked to translate a post ("翻译这篇"), write `index.en.md` and
  `index.ja.md` next to its `index.md`: front matter `title`, `description`, optional `balloon` / `aori` / `kind` / `sfx`,
  `translator: Claude`, `reviewed: false`; translate the body faithfully in the owner's voice, keep Markdown, images and
  code (translate code comments only). Only the owner flips `reviewed: true`. Japanese uses Japanese glyph forms (棗, 読).
- Fonts are served as `/fonts/{zh,ja,en}.css` by `src/pages/fonts/[set].css.ts`, which reads Astro's internal font data;
  if an Astro upgrade breaks that endpoint, the build fails there.
- Markdown runs through the unified (remark/rehype) processor configured in `astro.config.mjs`, not Astro 7's default Sätteri.
- Dates display in Asia/Tokyo (`src/lib/posts.ts`) so local and CI builds agree.
- Check changes with `npm run build` and `npx astro check`; preview with `npx astro dev --background` / `npx astro dev stop`.
