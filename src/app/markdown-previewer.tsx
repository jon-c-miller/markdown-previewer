"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

const INITIAL_MARKDOWN = `# Hello, Markdown

Type here. The preview updates as you type.

## Things you can try

- **Bold**, *italic*, and \`inline code\`
- [Links](https://nextjs.org)
- [x] Task lists
- [ ] Tables, too

> Block quotes work as well.

| Feature | Supported |
| ------- | --------- |
| Tables  | Yes       |
| Lists   | Yes       |

\`\`\`ts
const greet = (name: string) => \`Hello, \${name}\`;
\`\`\`
`;

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-2 divide-y divide-zinc-200 md:grid-cols-2 md:grid-rows-1 md:divide-x md:divide-y-0 dark:divide-zinc-800">
      <section className="flex min-h-0 flex-col">
        <h2 className="border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          Markdown
        </h2>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          spellCheck={false}
          aria-label="Markdown editor"
          className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 outline-none"
        />
      </section>

      <section className="flex min-h-0 flex-col">
        <h2 className="border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          Preview
        </h2>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <article className="prose prose-zinc max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </section>
    </div>
  );
}
