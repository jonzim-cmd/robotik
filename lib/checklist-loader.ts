import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'yaml'

export type Checklist = {
  robot: string
  title: string
  levels: { key: string; title: string; items: { key: string; label: string; description?: string }[] }[]
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
      items: (l.items || []).map((it: any) => ({ key: it.key, label: it.label, description: it.description }))
    }))
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function parseMarkdownChecklist(md: string, robot: string): Checklist {
  const lines = md.split(/\r?\n/)
  const levels: { key: string; title: string; items: { key: string; label: string; description?: string }[] }[] = []
  let current: { key: string; title: string; items: any[] } | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const h2 = /^##\s+(.+)$/.exec(line)
    if (h2) {
      const title = h2[1].replace(/^[0-9\s–-]+/,'').trim()
      const key = slugify(title)
      current = { key, title, items: [] }
      levels.push(current)
      continue
    }
    const item = /^- \[ \] (.+)$/.exec(line)
    if (item && current) {
      const raw = item[1].trim()
      // merge following indented lines as description until blank or next bullet/h2
      let desc: string[] = []
      let j = i + 1
      while (j < lines.length) {
        const ln = lines[j]
        if (/^\s*- \[ \]/.test(ln) || /^##\s/.test(ln) || /^---$/.test(ln)) break
        if (ln.trim().length === 0) { j++; continue }
        // strip leading list markers or blockquote symbols
        desc.push(ln.replace(/^\s*>\s?/, '').replace(/^\s{2,}/, '').trim())
        j++
      }
      i = j - 1
      current.items.push({ key: slugify(raw.split('  ')[0]), label: raw, description: desc.join(' ') || undefined })
    }
  }
  return { robot, title: 'Checkliste', levels }
}

