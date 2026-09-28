import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';

// Turns ordinary Markdown into manga print furniture:
//   ## heading      → a narrow panel with speed lines and a § number
//   > quote         → a speech balloon; a last line starting with —— becomes the credit
//   > [!NOTE] …     → a narration caption box
//   ```code```      → a solid-black ベタ panel with a language tab
//   [^footnote]     → ※ 作者注 in the margin (inline on phones)
//   lone image      → a framed panel; alt text becomes the caption
//   ---             → a scene break

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
// Shiki writes `class` as a string; remark-rehype writes `className` as an array.
const cls = (node) => {
  const c = node.properties?.className ?? node.properties?.class ?? [];
  return Array.isArray(c) ? c : String(c).split(/\s+/);
};
const prop = (node, camel, kebab) => node.properties?.[camel] ?? node.properties?.[kebab];
const isWhitespace = (node) => node.type === 'text' && !node.value.trim();
const pad = (n) => String(n).padStart(2, '0');

/** Deterministic little RNG so the same post always gets the same lettering. */
export function seeded(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}

/**
 * 描き文字 letters — every character gets its own tilt, size and bounce.
 * @param {string} value
 * @param {number} seed
 * @returns {{ c: string, style: string }[]}
 */
export function sfxLetters(value, seed) {
  const r = seeded(seed);
  // "!!" stays together; everything else is lettered one character at a time.
  const chars = value.match(/[!！]{2,}|[\s\S]/gu) ?? [];
  return chars.map((c, i) => {
    const rot = Math.round((r() - 0.4) * 22);
    const scale = (0.78 + r() * 0.48).toFixed(2);
    const y = Math.round((r() - 0.6) * 20);
    return { c, style: `--r:${rot}deg;--s:${i === 0 ? 1 : scale};--y:${i === 0 ? 0 : y}px` };
  });
}

/** The same letters as hast <span>s, for use inside Markdown. */
export function sfxSpans(value, seed) {
  return sfxLetters(value, seed).map(({ c, style }) => el('span', { dataC: c, style }, [text(c)]));
}

// Labels this plugin prints, per language (mirrors `markdown` in src/i18n.ts).
// The language comes from the file name: index.en.md, index.ja.md, else Chinese.
const LABELS = {
  zh: { NOTE: '※ 注', TIP: '※ 提示', IMPORTANT: '※ 重要', WARNING: '！注意', CAUTION: '！注意', note: (n) => `※ 作者注 ${n}`, noteAria: (n) => `作者注 ${n}`, back: '↩ 回正文', backAria: '回到正文', anchor: '链接到本节' },
  en: { NOTE: '※ Note', TIP: '※ Tip', IMPORTANT: '※ Important', WARNING: '! Warning', CAUTION: '! Caution', note: (n) => `※ Note ${n}`, noteAria: (n) => `Note ${n}`, back: '↩ back', backAria: 'Back to the text', anchor: 'Link to this section' },
  ja: { NOTE: '※ 注', TIP: '※ ヒント', IMPORTANT: '※ 重要', WARNING: '！注意', CAUTION: '！注意', note: (n) => `※ 作者注 ${n}`, noteAria: (n) => `作者注 ${n}`, back: '↩ 本文へ', backAria: '本文へ戻る', anchor: 'この節へのリンク' },
};
const langOf = (path = '') => (path.match(/\.(en|ja)\.md$/)?.[1] ?? 'zh');

function transformBlockquote(node, L) {
  const blocks = node.children.filter((c) => !isWhitespace(c));
  const first = blocks[0];

  // GitHub-style alert → narration caption.
  const firstText = first?.children?.[0];
  const alert = firstText?.type === 'text' && firstText.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/);
  if (alert) {
    firstText.value = firstText.value.slice(alert[0].length);
    const kind = alert[1];
    return el('aside', { className: ['narr', kind === 'WARNING' || kind === 'CAUTION' ? 'warn' : ''].filter(Boolean) }, [
      el('span', { className: ['lbl'] }, [text(L[kind])]),
      ...blocks,
    ]);
  }

  // A last paragraph starting with a dash is the speaker / source.
  let credit = null;
  const last = blocks.at(-1);
  if (blocks.length > 1 && last.tagName === 'p' && /^\s*[—–-]{1,2}/.test(toString(last))) {
    credit = el('figcaption', {}, last.children);
    blocks.pop();
  }
  const said = toString(el('div', {}, blocks)).replace(/\s+/g, '');
  // Short lines stand as vertical columns; a long line would make one very tall column.
  const lines = toString(el('div', {}, blocks)).split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const vertical = said.length <= 36 && lines.every((l) => [...l].length <= 12)
    && !/[A-Za-z0-9]{3,}/.test(said) && blocks.every((b) => b.tagName === 'p');
  if (vertical) {
    // In a vertical balloon every line the author broke is its own column.
    visit(el('div', {}, blocks), 'text', (t, i, parent) => {
      if (!parent || !t.value.includes('\n')) return;
      const parts = t.value.split('\n');
      parent.children.splice(i, 1, ...parts.flatMap((part, j) => (j ? [el('br'), text(part)] : [text(part)])));
      return i + parts.length * 2 - 1;
    });
  }
  const balloon = el('blockquote', {
    className: vertical ? ['bl', 'v'] : ['bl'],
    dataGen: 'balloon',
    dataB: 'talk',
    dataTail: vertical ? '1.42,1.02' : '-.1,1.3',
    dataTs: vertical ? '.17' : '.12',
    dataBend: '.1',
  }, blocks);
  return el('figure', { className: vertical ? ['quote'] : ['quote', 'h'] }, credit ? [balloon, credit] : [balloon]);
}

function transformCode(pre, seed) {
  const lang = String(prop(pre, 'dataLanguage', 'data-language') ?? 'text');
  const title = prop(pre, 'dataTitle', 'data-title');
  const sfx = prop(pre, 'dataSfx', 'data-sfx');
  const caption = [lang === 'plaintext' || lang === 'text' ? 'TEXT' : lang.toUpperCase(), title].filter(Boolean).join(' · ');
  const children = [el('figcaption', {}, [text(caption)]), pre];
  if (sfx) children.push(el('p', { className: ['sfx', 'red'], ariaHidden: 'true' }, sfxSpans(String(sfx), seed)));
  return el('figure', { className: ['beta'] }, children);
}

function footnotesToSidenotes(tree, L) {
  const index = tree.children.findIndex((n) => n.type === 'element' && n.tagName === 'section' && 'dataFootnotes' in (n.properties ?? {}));
  if (index === -1) return;
  const section = tree.children[index];
  tree.children.splice(index, 1);

  const notes = new Map();
  let count = 0;
  visit(section, 'element', (li) => {
    if (li.tagName !== 'li' || !li.properties?.id) return;
    // Drop the ↩ back-references GFM adds; we add our own.
    visit(li, 'element', (a, i, parent) => {
      if (a.tagName === 'a' && 'dataFootnoteBackref' in a.properties && parent) {
        parent.children.splice(i, 1);
        return i;
      }
    });
    const body = li.children.filter((c) => !isWhitespace(c));
    const content = body.length === 1 && body[0].tagName === 'p' ? body[0].children : body;
    notes.set(`#${li.properties.id}`, { n: ++count, content });
  });

  const placed = new Set();
  tree.children = tree.children.flatMap((block) => {
    const before = [];
    visit(block, 'element', (sup, i, parent) => {
      const a = sup.tagName === 'sup' ? sup.children.find((c) => c.tagName === 'a' && 'dataFootnoteRef' in c.properties) : null;
      if (!a || !parent) return;
      const note = notes.get(String(a.properties.href));
      if (!note) return;
      const first = !placed.has(note.n);
      parent.children[i] = el('a', {
        className: ['fnref'],
        href: `#fn-${note.n}`,
        id: first ? `fnref-${note.n}` : undefined,
        ariaLabel: L.noteAria(note.n),
      }, [text(`※${note.n}`)]);
      if (first) {
        placed.add(note.n);
        before.push(el('aside', { className: ['sidenote'], id: `fn-${note.n}`, role: 'note' }, [
          el('span', { className: ['lbl'] }, [text(L.note(note.n))]),
          ...note.content,
          text(' '),
          el('a', { className: ['back'], href: `#fnref-${note.n}`, ariaLabel: L.backAria }, [text(L.back)]),
        ]));
      }
    });
    return [...before, block];
  });
}

export function rehypeManga() {
  return (tree, file) => {
    const L = LABELS[langOf(String(file.path ?? ''))];
    footnotesToSidenotes(tree, L);
    const seedBase = hashString(String(file.path ?? ''));
    let section = 0;
    let firstParagraphSeen = false;

    tree.children = tree.children.map((node, i) => {
      if (node.type !== 'element') return node;
      const seed = seedBase + i;

      switch (node.tagName) {
        case 'p': {
          const content = node.children.filter((c) => !isWhitespace(c));
          if (content.length === 1 && content[0].tagName === 'img') {
            const img = content[0];
            const alt = String(img.properties.alt ?? '').trim();
            return el('figure', { className: ['koma-img'] }, alt ? [img, el('figcaption', {}, [text(alt)])] : [img]);
          }
          if (!firstParagraphSeen) {
            firstParagraphSeen = true;
            node.properties.className = [...cls(node), 'lead'];
          }
          return node;
        }
        case 'h2': {
          section++;
          const id = node.properties.id;
          return el('h2', { id, className: ['koma-h'] }, [
            el('span', { className: ['gen'], dataGen: 'speed', dataN: '64', dataSeed: String(seed % 997), ariaHidden: 'true' }),
            el('span', { className: ['kh-t'] }, node.children),
            el('a', { className: ['kh-no'], href: `#${id}`, dataNo: `§ ${pad(section)}`, ariaLabel: L.anchor }),
          ]);
        }
        case 'h3':
          node.properties.className = [...cls(node), 'koma-h3'];
          return node;
        case 'blockquote':
          return transformBlockquote(node, L);
        case 'pre':
          return cls(node).includes('astro-code') ? transformCode(node, seed) : node;
        case 'table':
          return el('div', { className: ['tbl'] }, [node]);
        case 'hr':
          return el('div', { className: ['scene-break'], role: 'separator' }, [text('◆　◆　◆')]);
        default:
          return node;
      }
    });
  };
}
