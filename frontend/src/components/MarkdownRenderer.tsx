"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-extrabold text-white mt-6 mb-3 leading-tight border-b border-white/10 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white mt-5 mb-2 leading-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-purple-300 mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-cyan-400 mt-3 mb-1 uppercase tracking-wider">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-200">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-none space-y-1 mb-3 pl-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 pl-2 text-sm text-gray-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-300 flex gap-2 items-start leading-relaxed">
              <span className="text-purple-400 shrink-0 mt-1">▸</span>
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 bg-purple-950/20 px-4 py-3 rounded-r-lg my-3 text-sm text-gray-300 italic">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClass, children, ...props }: any) => {
            const isBlock = codeClass?.includes("language-");
            if (isBlock) {
              return (
                <div className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <div className="flex items-center gap-1.5 bg-[#0d0d1f] px-4 py-2 border-b border-white/[0.06]">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-[10px] font-mono text-gray-500">
                      {codeClass?.replace("language-", "") || "code"}
                    </span>
                  </div>
                  <code className={`${codeClass} block text-xs`} {...props}>
                    {children}
                  </code>
                </div>
              );
            }
            return (
              <code
                className="bg-purple-950/40 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono border border-purple-500/20"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[#080816] text-sm font-mono overflow-x-auto p-4">{children}</pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
              <table className="w-full text-xs text-gray-300">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-950/30 text-purple-300 font-semibold uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-white/[0.03] transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2.5 text-left">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2.5">{children}</td>,
          hr: () => <hr className="border-white/10 my-5" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
