import { resolve, join } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";

const ASSETS_DIR = resolve("./.docu/dist/assets");
const BUNDLE_FILE = join(ASSETS_DIR, "mdx-client.js");

export async function buildClientBundle() {
  await mkdir(ASSETS_DIR, { recursive: true });

  const bundle = `(function() {
  'use strict';
  
  function init(root) {
    var components = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      p: 'p',
      ul: 'ul',
      ol: 'ol',
      li: 'li',
      a: 'a',
      code: 'code',
      pre: 'pre',
      strong: 'strong',
      em: 'em',
      blockquote: 'blockquote',
      table: 'table',
      tr: 'tr',
      td: 'td',
      th: 'th',
      tbody: 'tbody',
      thead: 'thead',
      hr: 'hr',
      img: 'img',
    };
    return components;
  }
  
  function hydrate() {
    var root = document.getElementById('root');
    if (!root) return;
    
    var mdxSource = root.dataset.mdx;
    if (!mdxSource) return;
    
    try {
      var compiledSource = decodeURIComponent(mdxSource);
      var createMdxContent = new Function('return ' + compiledSource);
      var MdxContent = createMdxContent();
      var ContentComponent = MdxContent.default || MdxContent;
      
      if (typeof window.MDX_CONTENT !== 'undefined' && ContentComponent) {
        var components = init(root);
        
        if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
          var rootEl = document.getElementById('mdx-content');
          if (rootEl) {
            ReactDOM.createRoot(rootEl).render(
              React.createElement(ContentComponent, { components: components })
            );
          }
        } else {
          var contentEl = document.getElementById('mdx-content');
          if (contentEl) {
            contentEl.innerHTML = '<p>Loading content...</p>';
          }
        }
      }
    } catch (e) {
      console.error('Hydration error:', e);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
`;

  await writeFile(BUNDLE_FILE, bundle);
}