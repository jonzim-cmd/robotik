"use client"
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Markdown({ text }: { text: string }) {
  if (!text) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-neutral-300">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 text-sm text-neutral-300">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 text-sm text-neutral-300">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-neutral-100">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ children, href }) => (
          <a className="underline underline-offset-2" href={href as string} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        code: ({ inline, children }) => (
          inline ? (
            <code className="rounded bg-neutral-800 px-1 py-0.5 text-[0.85em]">{children}</code>
          ) : (
            <code className="block rounded bg-neutral-900 p-3 text-[0.9em]">{children}</code>
          )
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

