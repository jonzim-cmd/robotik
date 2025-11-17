"use client"
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Collapsible } from '@/components/collapsible'

function normalizeForLists(input: string) {
  if (!input) return input
  // Ensure proper spacing around lists
  return input
    .replace(/([^\n])\n(-\s+)/g, '$1\n\n$2')
    .replace(/([^\n])\n(\d+\.)\s+/g, '$1\n\n$2 ')
    .trim()
}

// Process collapsible blocks: Convert special blockquote syntax to React components
function processCollapsibles(text: string) {
  // Match blockquotes that start with emoji + bold text (our tip/hint pattern)
  const collapsiblePattern = /^(> (?:💡|🎯|⚠️|✨|🚀|📊|🎮|⚡|🏆|🔄) \*\*[^*]+\*\*.*?\n(?:>.*?\n)*)/gm
  
  const parts: (string | { type: 'collapsible'; title: string; content: string })[] = []
  let lastIndex = 0
  let match
  
  const regex = new RegExp(collapsiblePattern)
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    
    // Extract title and content from blockquote
    const block = match[1]
    const lines = block.split('\n').map(l => l.replace(/^> ?/, ''))
    const firstLine = lines[0] || ''
    const titleMatch = firstLine.match(/(💡|🎯|⚠️|✨|🚀|📊|🎮|⚡|🏆|🔄) \*\*([^*]+)\*\*/)
    
    if (titleMatch) {
      const emoji = titleMatch[1]
      const title = titleMatch[2]
      const content = lines.slice(1).join('\n').trim()
      
      parts.push({
        type: 'collapsible',
        title: `${emoji} <strong>${title}</strong>`,
        content
      })
    } else {
      parts.push(match[0])
    }
    
    lastIndex = regex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return parts
}

export function Markdown({ text }: { text: string }) {
  if (!text) return null
  const normalized = normalizeForLists(text)
  const parts = processCollapsibles(normalized)
  
  // If we have collapsibles, render mixed content
  if (parts.some(p => typeof p === 'object' && p.type === 'collapsible')) {
    return (
      <>
        {parts.map((part, idx) => {
          if (typeof part === 'string') {
            return (
              <ReactMarkdown
                key={idx}
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {part}
              </ReactMarkdown>
            )
          } else if (part.type === 'collapsible') {
            return (
              <Collapsible 
                key={idx}
                title={part.title}
                children={part.content}
              />
            )
          }
          return null
        })}
      </>
    )
  }
  
  // No collapsibles, render normally
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {normalized}
    </ReactMarkdown>
  )
}

const markdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h2 {...props} className="text-lg font-bold text-neutral-50 mt-4 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children, ...props }: any) => (
    <h3 {...props} className="text-base font-bold text-neutral-50 mt-3 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children, ...props }: any) => (
    <h4 {...props} className="text-[15px] font-semibold text-neutral-100 mt-3 mb-1.5 first:mt-0">
      {children}
    </h4>
  ),
  h4: ({ children, ...props }: any) => (
    <h5 {...props} className="text-sm font-semibold text-neutral-100 mt-2 mb-1 first:mt-0">
      {children}
    </h5>
  ),
  h5: ({ children, ...props }: any) => (
    <h6 {...props} className="text-sm font-medium text-neutral-100 mt-2 mb-1 first:mt-0">
      {children}
    </h6>
  ),
  h6: ({ children, ...props }: any) => (
    <div {...props} className="text-sm font-medium text-neutral-200 mt-2 mb-1 first:mt-0">
      {children}
    </div>
  ),
  p: ({ children, ...props }: any) => (
    <p {...props} className="text-[15px] leading-relaxed text-neutral-200 mb-3 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="list-disc ml-6 mb-3 last:mb-0 space-y-1.5 text-[15px] leading-relaxed text-neutral-200" style={{ listStyleType: 'disc', listStylePosition: 'outside' }}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="list-decimal ml-6 mb-3 last:mb-0 space-y-1.5 text-[15px] leading-relaxed text-neutral-200" style={{ listStyleType: 'decimal', listStylePosition: 'outside' }}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="pl-0.5 [&>p]:inline [&>p]:m-0 [&>p:first-child]:inline" style={{ display: 'list-item' }}>
      {children}
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-neutral-50">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic text-neutral-100">{children}</em>,
  a: ({ children, href, ...props }: any) => (
    <a 
      {...props}
      className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors" 
      href={href} 
      target="_blank" 
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: (props: any) => {
    const { inline, children } = props
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
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-neutral-700 pl-4 py-1 text-[15px] text-neutral-300 italic my-3 bg-neutral-900/30">
      {children}
    </blockquote>
  ),
}

// Inline Markdown variant for short labels (no paragraphs or block spacing)
export function MarkdownInline({ text, className = '' }: { text: string, className?: string }) {
  if (!text) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }: any) => <span className={className}>{children}</span>,
        strong: ({ children }: any) => <strong className="font-semibold text-neutral-50">{children}</strong>,
        em: ({ children }: any) => <em className="italic">{children}</em>,
        code: ({ children }: any) => (
          <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[0.9em] text-neutral-100 font-mono">
            {children}
          </code>
        ),
        a: ({ children, href, ...props }: any) => (
          <a 
            {...props}
            className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors" 
            href={href} 
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
