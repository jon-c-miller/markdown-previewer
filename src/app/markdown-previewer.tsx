"use client";

import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

const LIST_MARKER = /^(\s*)([-*+]|\d+[.)])\s+(\[[ xX]\])?\s*/;

// Matches the preview's own paragraph line-height (prose's line-height:
// 1.75, unitless, times its 1rem font-size), so one blank line in the
// source reads as exactly one extra line of vertical space.
const LINE_HEIGHT_REM = 1.75;

function countBlankLinesBefore(sourceLines: string[], startLine: number): number {
  let count = 0;
  for (let i = startLine - 2; i >= 0; i--) {
    if (sourceLines[i].trim() === "") count++;
    else break;
  }
  return count;
}

function Spacer({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div aria-hidden style={{ height: `${count * LINE_HEIGHT_REM}rem` }} />
  );
}

type NodeWithPosition = {
  position?: { start?: { line?: number } };
};

// A block only gets a spacer when it's directly under the document root.
// A node nested inside another block (a blockquote's paragraph, a list
// item's content) would otherwise compute the same "blank lines before
// me" as its container and double the gap. Each spacer block marks its
// own children as nested before rendering them.
const IsTopLevelContext = createContext(true);

function createSpacerBlock<Tag extends keyof React.JSX.IntrinsicElements>(
  tag: Tag,
  sourceLines: string[],
) {
  const Tag = tag;
  return function SpacerBlock({
    node,
    ...rest
  }: React.JSX.IntrinsicElements[Tag] & { node?: NodeWithPosition }) {
    const isTopLevel = useContext(IsTopLevelContext);
    const startLine = node?.position?.start?.line;
    const blanks =
      isTopLevel && startLine !== undefined
        ? countBlankLinesBefore(sourceLines, startLine)
        : 0;
    return (
      <IsTopLevelContext.Provider value={false}>
        <Spacer count={blanks} />
        {createElement(Tag, rest as React.ComponentProps<Tag>)}
      </IsTopLevelContext.Provider>
    );
  };
}

function buildSpacerComponents(sourceLines: string[]): Components {
  return {
    h1: createSpacerBlock("h1", sourceLines),
    h2: createSpacerBlock("h2", sourceLines),
    h3: createSpacerBlock("h3", sourceLines),
    h4: createSpacerBlock("h4", sourceLines),
    h5: createSpacerBlock("h5", sourceLines),
    h6: createSpacerBlock("h6", sourceLines),
    p: createSpacerBlock("p", sourceLines),
    ul: createSpacerBlock("ul", sourceLines),
    ol: createSpacerBlock("ol", sourceLines),
    blockquote: createSpacerBlock("blockquote", sourceLines),
    table: createSpacerBlock("table", sourceLines),
    pre: createSpacerBlock("pre", sourceLines),
    hr: createSpacerBlock("hr", sourceLines),
  };
}

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

type MarkdownPreviewerProps = {
  autoSeparateLists?: boolean;
};

export default function MarkdownPreviewer({
  autoSeparateLists = true,
}: MarkdownPreviewerProps) {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursor = useRef<number | null>(null);

  const previewComponents = useMemo(
    () => buildSpacerComponents(markdown.split("\n")),
    [markdown],
  );

  useLayoutEffect(() => {
    if (pendingCursor.current === null || !textareaRef.current) return;
    textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
      pendingCursor.current;
    pendingCursor.current = null;
  }, [markdown]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;

    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart !== selectionEnd) return;

    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const line = value.slice(lineStart, selectionStart);
    const match = line.match(LIST_MARKER);
    if (!match) return;

    const [fullMatch, indent, marker, checkbox] = match;
    const restOfLine = line.slice(fullMatch.length);

    e.preventDefault();

    if (restOfLine.trim() === "") {
      const newValue = value.slice(0, lineStart) + value.slice(selectionStart);
      setMarkdown(newValue);
      pendingCursor.current = lineStart;
      return;
    }

    const nextMarker = /^\d+[.)]$/.test(marker)
      ? `${parseInt(marker, 10) + 1}${marker.endsWith(")") ? ")" : "."}`
      : marker;
    const insertion = `\n${indent}${nextMarker} ${checkbox ? "[ ] " : ""}`;

    const newValue =
      value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
    setMarkdown(newValue);
    pendingCursor.current = selectionStart + insertion.length;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value, selectionStart } = e.target;

    // Only auto-insert on growth. Running this on a deletion (backspace,
    // delete, cut) would re-insert the very blank line the user just
    // removed, undoing their edit.
    if (!autoSeparateLists || value.length <= markdown.length) {
      setMarkdown(value);
      return;
    }

    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const lineEndIndex = value.indexOf("\n", selectionStart);
    const currentLine = value.slice(
      lineStart,
      lineEndIndex === -1 ? value.length : lineEndIndex,
    );

    if (lineStart === 0 || currentLine.trim() === "" || LIST_MARKER.test(currentLine)) {
      setMarkdown(value);
      return;
    }

    const prevLineEnd = lineStart - 1;
    const prevLineStart = value.lastIndexOf("\n", prevLineEnd - 1) + 1;
    const prevLine = value.slice(prevLineStart, prevLineEnd);

    if (prevLine.trim() === "" || !LIST_MARKER.test(prevLine)) {
      setMarkdown(value);
      return;
    }

    // A plain line typed directly below a list item, with no blank line
    // between them, is CommonMark's "lazy continuation": it renders as
    // part of the previous bullet instead of a new paragraph. Insert the
    // blank line so it renders as its own paragraph instead.
    const newValue = value.slice(0, lineStart) + "\n" + value.slice(lineStart);
    pendingCursor.current = selectionStart + 1;
    setMarkdown(newValue);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-rows-2 divide-y divide-zinc-200 md:grid-cols-2 md:grid-rows-1 md:divide-x md:divide-y-0 dark:divide-zinc-800">
      <section className="flex min-h-0 flex-col">
        <h2 className="border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          Markdown
        </h2>
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
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
          <article className="prose prose-zinc max-w-none [&_p]:whitespace-pre-line prose-headings:my-0 prose-p:my-0 prose-blockquote:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-table:my-0 prose-pre:my-0 prose-hr:my-0 dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={previewComponents}
            >
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </section>
    </div>
  );
}
