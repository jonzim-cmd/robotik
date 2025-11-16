import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'yaml'

export type Checklist = {
  robot: string
  title: string
  levels: { key: string; title: string; num?: number; intro?: string; items: { key: string; label: string; description?: string; type?: 'check' | 'text'; noteLabel?: string }[] }[]
}

export async function loadChecklist(robotKey: string): Promise<Checklist> {
  const dir = path.join(process.cwd(), 'checklists')
  // prefer YAML, fallback to MD
  const yml = path.join(dir, `${robotKey}.yml`)
  const md = path.join(dir, `${robotKey}.md`)
  try {
    const y = await fs.readFile(yml, 'utf-8')
    const parsed = YAML.parse(y)
    return normalize(parsed)
  } catch {
    const m = await fs.readFile(md, 'utf-8')
    const parsed = parseMarkdownChecklist(m, robotKey)
    return normalize(parsed)
  }
}

function normalize(data: any): Checklist {
  return {
    robot: data.robot,
    title: data.title || 'Checkliste',
    levels: (data.levels || []).map((l: any) => ({
      key: l.key,
      title: l.title,
      num: l.num,
      intro: l.intro,
      items: (l.items || []).map((it: any) => {
        const rawLabel = it.label || ''
        const inferText = /:{1}\s*_+\s*$/.test(rawLabel) || /_{3,}\s*$/.test(rawLabel)
        const cleanLabel = inferText ? rawLabel.replace(/:{1}\s*_+\s*$/,'').replace(/\s*_+\s*$/,'').trim() : rawLabel
        const type: 'check' | 'text' = (it.type as any) || (inferText ? 'text' : 'check')
        let description: string | undefined = it.description
        if (typeof description === 'string') {
          const parts = description.split(/\n+/)
          const first = parts[0] || ''
          const rest = parts.slice(1)
          const hasListStart = rest.some((l: string) => /^-\s+/.test(l))
          if (first && hasListStart && !/^\s*$/.test(first)) {
            description = [first, '', ...rest].join('\n')
          }
        }
        return { key: it.key, label: cleanLabel, description, type, noteLabel: it.noteLabel }
      })
    }))
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function parseMarkdownChecklist(md: string, robot: string): Checklist {
  const lines = md.split(/\r?\n/)
  const levels: { key: string; title: string; num?: number; intro?: string; items: { key: string; label: string; description?: string; type?: 'check'|'text' }[] }[] = []
  let current: { key: string; title: string; num?: number; intro?: string; items: any[] } | null = null
  let introBuf: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const h2 = /^##\s+(.+)$/.exec(line)
    if (h2) {
      const rawTitle = h2[1].trim()
      let title = rawTitle
      let num: number | undefined
      const m = /^Level\s+(\d+)\s*[–-]\s*(.+)$/i.exec(rawTitle)
      if (m) {
        num = parseInt(m[1], 10)
        title = m[2].trim()
      }
      const key = slugify(rawTitle)
      current = { key, title, num, intro: undefined, items: [] }
      introBuf = []
      levels.push(current)
      continue
    }
    // detect input prompt lines inside blockquote
    if (current) {
      const prompt = /^>\s*([^`>].*?):\s*$/.exec(line)
      const next = lines[i + 1] || ''
      if (prompt && /^>\s*`[_–\-\s]+`\s*$/.test(next)) {
        const label = prompt[1].trim()
        const isProject = /eigenes projekt/i.test(current.title || '')
        if (isProject) {
          let pj = (current.items as any[]).find((it) => it.__project === true)
          if (!pj) {
            pj = { key: slugify('Eigenes Projekt'), label: 'Eigenes Projekt', description: '', type: 'check', __project: true }
            current.items.push(pj)
          }
          pj.noteLabel = pj.noteLabel ? `${pj.noteLabel} / ${label}` : label
        } else {
          // Attach to the previous check item if available; otherwise create a standalone text item
          const last = current.items[current.items.length - 1]
          if (last && last.type !== 'text' && !last.noteLabel) {
            last.noteLabel = label
          } else {
            current.items.push({ key: slugify(label), label, type: 'text' })
          }
        }
        i += 1
        continue
      }
    }
    if (current) {
      // capture intro until first task list or next section
      const isRule = /^---$/.test(line)
      const isHeader = /^##\s/.test(line)
      const isTask = /^- \[ \] /.test(line)
      if (!current.items.length && !isTask && !isHeader) {
        const cleaned = line
          .replace(/^>\s?/, '')
          .replace(/^\*\*Ziel:\*\*\s*/i, '')
          .replace(/^\*\*Aufgaben:\*\*\s*/i, '')
          .trim()
        if (cleaned && !isRule) introBuf.push(cleaned)
      }
      if (isTask && introBuf.length && !current.intro) {
        current.intro = introBuf.join(' ').trim()
      }
    }

    const item = /^- \[ \] (.+)$/.exec(line)
    if (item && current) {
      const raw = item[1].trim()
      const isProject = /eigenes projekt/i.test(current.title || '')
      // merge following indented lines as description until blank or next bullet/h2
      let desc: string[] = []
      let j = i + 1
      while (j < lines.length) {
        const ln = lines[j]
        if (/^\s*- \[ \]/.test(ln) || /^##\s/.test(ln) || /^---$/.test(ln)) break
        // If the next lines form a blockquoted input prompt ("> Label:" followed by "> `_____`"),
        // stop consuming description so the outer loop can create a text item.
        const prompt = /^>\s*([^`>].*?):\s*$/.exec(ln)
        const next = lines[j + 1] || ''
        if (prompt && /^>\s*`[_–\-\s]+`\s*$/.test(next)) break
        if (ln.trim().length === 0) { j++; continue }
        // strip leading list markers or blockquote symbols
        desc.push(ln.replace(/^\s*>\s?/, '').replace(/^\s{2,}/, '').trim())
        j++
      }
      i = j - 1
      if (isProject) {
        // Collapse all project requirements into a single checklist item with a combined description list
        let pj = (current.items as any[]).find((it) => it.__project === true)
        if (!pj) {
          pj = { key: slugify('Eigenes Projekt'), label: 'Eigenes Projekt', description: '', type: 'check', __project: true }
          current.items.push(pj)
        }
        const bullet = `- ${raw}`
        const extra = desc.length ? desc.map((d) => `  - ${d}`).join('\n') : ''
        pj.description = [pj.description || '', bullet, extra].filter(Boolean).join('\n').trim()
      } else {
        // Detect placeholder inputs like ": ______" or trailing underscores → treat as text field
        const hasPlaceholder = /:{1}\s*_+\s*$/.test(raw) || /_{3,}/.test(raw) || desc.some(d => /^_+$/.test(d))
        const cleanLabel = hasPlaceholder ? raw.replace(/:{1}\s*_+\s*$/,'').replace(/\s*_+\s*$/,'').trim() : raw
        const type: 'check' | 'text' = hasPlaceholder ? 'text' : 'check'
        current.items.push({ key: slugify(cleanLabel.split('  ')[0]), label: cleanLabel, description: (desc.join('\n') || undefined), type })
      }
    }
  }
  // finalize last intro if any
  if (current && introBuf.length && !current.intro) current.intro = introBuf.join('\n').trim()
  return { robot, title: 'Checkliste', levels }
}
