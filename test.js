const marked = require('marked');
const renderer = {
  code(code, infostring) {
    const lang = (infostring || '').match(/\S*/)[0];
    if (lang === 'mermaid') {
      return `<div class="mermaid">${code}</div>\n`;
    }
    return `<pre><code>${code}</code></pre>`;
  }
};
marked.marked.use({ renderer });
console.log(marked.marked.parse("```mermaid\ngraph TD;\nA-->B;\n```"));
