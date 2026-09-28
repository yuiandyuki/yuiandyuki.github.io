import { visit } from 'unist-util-visit';

const CJK = /[㐀-䶿一-鿿豈-﫿぀-ヿ가-힯]/g;
const LATIN_WORD = /[A-Za-z0-9]+(?:[''’-][A-Za-z0-9]+)*/g;

// Counts words the way a Chinese reader expects (each CJK character is a word,
// Latin runs count once) and exposes the result to layouts through
// `remarkPluginFrontmatter`: { words, minutes, hasMath }.
export function remarkReadingStats() {
  return (tree, file) => {
    let text = '';
    let hasMath = false;
    visit(tree, (node) => {
      if (node.type === 'math' || node.type === 'inlineMath') hasMath = true;
      if (node.type === 'text' || node.type === 'inlineCode') text += node.value + ' ';
    });
    const cjk = (text.match(CJK) ?? []).length;
    const latin = (text.replace(CJK, ' ').match(LATIN_WORD) ?? []).length;
    const words = cjk + latin;
    // ~400 CJK characters or ~220 English words per minute.
    const minutes = Math.max(1, Math.round(cjk / 400 + latin / 220));
    const fm = (file.data.astro ??= {}).frontmatter ??= {};
    Object.assign(fm, { words, minutes, hasMath });
  };
}
