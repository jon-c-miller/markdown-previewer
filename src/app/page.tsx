import MarkdownPreviewer from "./markdown-previewer";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-sm font-semibold tracking-tight">
          Markdown Previewer
        </h1>
      </header>
      <MarkdownPreviewer />
    </div>
  );
}
