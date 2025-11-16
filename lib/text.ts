export function stripMarkdown(s: string) {
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1') // links
    .replace(/__([^_]+)__/g, '$1') // bold alt
    .replace(/_([^_]+)_/g, '$1') // italic alt
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim()
}

