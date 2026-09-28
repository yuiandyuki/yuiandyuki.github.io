import { visit } from 'unist-util-visit';

// Opens off-site links in a new tab and marks them so CSS can add a ↗.
export function rehypeExternalLinks({ host = 'luvstar.top' } = {}) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = String(node.properties?.href ?? '');
      if (!/^https?:\/\//.test(href)) return;
      if (new URL(href).hostname.endsWith(host)) return;
      node.properties.target = '_blank';
      node.properties.rel = ['noopener', 'noreferrer'];
      node.properties.className = [...(node.properties.className ?? []), 'external'];
    });
  };
}
