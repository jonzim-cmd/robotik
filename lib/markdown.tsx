"use client"
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function normalizeForLists(input: string) {
  if (!input) return input
  // Ensure proper spacing around lists
  return input
    .replace(/([^\n])\n(-\s+)/g, '$1\n\n$2')
    .replace(/([^\n])\n(\d+\.)\s+/g, '$1\n\n$2 ')
    .trim()
}

export function Markdown({ text }: { text: string }) {
  if (!text) return null
  const prepared = normalizeForLists(text)
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children, ...props }) => (
          <h2 {...props} className="text-lg font-bold text-neutral-50 mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h2: ({ children, ...props }) => (
          <h3 {...props} className="text-base font-bold text-neutral-50 mt-3 mb-2 first:mt-0">
            {children}
          </h3>
        ),
        h3: ({ children, ...props }) => (
          <h4 {...props} className="text-[15px] font-semibold text-neutral-100 mt-3 mb-1.5 first:mt-0">
            {children}
          </h4>
        ),
        h4: ({ children, ...props }) => (
          <h5 {...props} className="text-sm font-semibold text-neutral-100 mt-2 mb-1 first:mt-0">
            {children}
          </h5>
        ),
        h5: ({ children, ...props }) => (
          <h6 {...props} className="text-sm font-medium text-neutral-100 mt-2 mb-1 first:mt-0">
            {children}
          </h6>
        ),
        h6: ({ children, ...props }) => (
          <div {...props} className="text-sm font-medium text-neutral-200 mt-2 mb-1 first:mt-0">
            {children}
          </div>
        ),
        p: ({ children, ...props }) => (
          <p {...props} className="text-[15px] leading-relaxed text-neutral-200 mb-3 last:mb-0">
            {children}
          </p>
        ),
        ul: ({ children, ...props }) => (
          <ul {...props} className="list-disc ml-6 mb-3 last:mb-0 space-y-1.5 text-[15px] leading-relaxed text-neutral-200" style={{ listStyleType: 'disc', listStylePosition: 'outside' }}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol {...props} className="list-decimal ml-6 mb-3 last:mb-0 space-y-1.5 text-[15px] leading-relaxed text-neutral-200" style={{ listStyleType: 'decimal', listStylePosition: 'outside' }}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li {...props} className="pl-0.5 [&>p]:inline [&>p]:m-0 [&>p:first-child]:inline" style={{ display: 'list-item' }}>
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-neutral-50">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-neutral-100">{children}</em>,
        a: ({ children, href }) => (
          <a 
            className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors" 
            href={href as string} 
            target="_blank" 
            rel="noreferrer"
          >
            {children}
          </a>
        ),
        code: (props) => {
          const { inline, children } = props as any
          return inline ? (
            <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[0.9em] text-neutral-100 font-mono">
              {children}
            </code>
          ) : (
            <code className="block rounded-md bg-neutral-900 border border-neutral-800 p-3 text-[0.9em] text-neutral-100 font-mono overflow-x-auto my-3">
              {children}
            </code>
          )
        },
        hr: () => <div className="my-4 h-px w-full bg-neutral-800" />,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-neutral-700 pl-4 py-1 text-[15px] text-neutral-300 italic my-3 bg-neutral-900/30">
            {children}
          </blockquote>
        ),
      }}
    >
      {prepared}
    </ReactMarkdown>
  )
}

// Inline Markdown variant for short labels (no paragraphs or block spacing)
export function MarkdownInline({ text, className = '' }: { text: string, className?: string }) {
  if (!text) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <span className={className}>{children}</span>,
        strong: ({ children }) => <strong className="font-semibold text-neutral-50">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[0.9em] text-neutral-100 font-mono">
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a 
            className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors" 
            href={href as string} 
            target="_blank" 
            rel="noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
