"use client";

// A dark code box with a copy button. Used by the install guide + dashboard.
import { useState } from "react";

export default function CopyBox({ code }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked on insecure origins; text is still selectable.
    }
  }
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-neutral-900 px-4 py-3 pr-20 text-sm text-neutral-100">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/20"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
