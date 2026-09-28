// Code blocks are printed as ベタ (solid black) panels: paper-white ink,
// structure shown by weight and tint rather than colour.
export const mangaBeta = {
  name: 'manga-beta',
  type: /** @type {'dark'} */ ('dark'),
  colors: { 'editor.background': '#141312', 'editor.foreground': '#F4F0E8' },
  settings: [
    { settings: { foreground: '#F4F0E8', background: '#141312' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#9E998F' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.new'], settings: { fontStyle: 'bold' } },
    { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#D8D1C4' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#FFFFFF', fontStyle: 'bold' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { fontStyle: 'underline' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class'], settings: { foreground: '#FFFFFF' } },
  ],
};

const META = /(title|sfx)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;

/**
 * Copies code-fence meta such as ```rust title="src/interrupts.rs" sfx="嘀嗒"
 * onto the <pre> (data-title / data-sfx), and marks `unsafe` in spot red.
 */
export function shikiMeta() {
  return {
    name: 'manga-meta',
    pre(node) {
      const raw = this.options.meta?.__raw ?? '';
      for (const m of raw.matchAll(META)) {
        const value = m[2] ?? m[3] ?? m[4];
        node.properties[m[1] === 'title' ? 'dataTitle' : 'dataSfx'] = value;
      }
    },
    span(node) {
      const first = node.children?.[0];
      if (first?.type === 'text' && first.value === 'unsafe') this.addClassToHast(node, 'u');
    },
  };
}
