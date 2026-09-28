import { visit } from 'unist-util-visit';

const IMG = /^\s*<img\s([^>]*?)\/?>\s*$/i;
const ATTR = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

// Typora writes resized images as raw HTML, e.g. <img src="a.png" style="zoom:50%;" />.
// Astro only optimises Markdown images, so turn local <img> tags into image
// nodes, keeping the author's size (style / width) as attributes.
export function remarkHtmlImages() {
  return (tree) => {
    visit(tree, 'html', (node, index, parent) => {
      const match = node.value.match(IMG);
      if (!match || !parent || index === undefined) return;
      const attrs = {};
      for (const [, name, dq, sq] of match[1].matchAll(ATTR)) attrs[name.toLowerCase()] = dq ?? sq;
      const src = attrs.src;
      if (!src || /^(?:[a-z]+:|\/\/|\/)/i.test(src)) return; // remote, data: or site-absolute: leave as is

      const hProperties = {};
      const style = [attrs.style, attrs.width?.endsWith('%') ? `width:${attrs.width}` : '']
        .filter(Boolean).join(';');
      if (style) hProperties.style = style;
      if (/^\d+$/.test(attrs.width ?? '')) hProperties.width = Number(attrs.width);

      const image = { type: 'image', url: src, alt: attrs.alt ?? '', title: attrs.title ?? null, data: { hProperties } };
      // A block-level <img> becomes a paragraph, like a Markdown image on its own line.
      parent.children[index] = parent.type === 'paragraph' ? image : { type: 'paragraph', children: [image] };
    });
  };
}
