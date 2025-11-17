"use client"
import { useState } from 'react'
import { Markdown } from '@/lib/markdown'

type Props = {
  title: string
  children: string
}

export function Collapsible({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="my-3 rounded-lg border border-neutral-700 bg-neutral-900/40 overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-neutral-800/50 transition-colors text-left"
      >
        <span 
          className="text-brand-400 text-sm inline-block transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        <span className="font-semibold text-neutral-100" dangerouslySetInnerHTML={{ __html: title }} />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-700/50">
          <Markdown text={children} />
        </div>
      )}
    </div>
  )
}


