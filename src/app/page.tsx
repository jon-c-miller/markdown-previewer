"use client";

import { useState } from "react";
import MarkdownPreviewer from "./markdown-previewer";

export default function Home() {
  const [autoSeparateLists, setAutoSeparateLists] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <header className="relative flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-sm font-semibold tracking-tight">
          Markdown Previewer
        </h1>
        <button
          type="button"
          aria-label="Settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="absolute right-4 top-full z-10 mt-1 w-64 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoSeparateLists}
                onChange={(e) => setAutoSeparateLists(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Auto-separate list text
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  Insert a blank line when you type plain text directly below
                  a list item, so it renders as its own paragraph instead of
                  merging into the last bullet.
                </span>
              </span>
            </label>
          </div>
        )}
      </header>
      <MarkdownPreviewer autoSeparateLists={autoSeparateLists} />
    </div>
  );
}
