import { loadIndex, loadIssue, type IssueItem } from './data'

export interface SearchEntry extends IssueItem {
  week: string
  date: string
  issueTitle: { en: string; zh: string }
}

// 加载所有期、所有条目，构建客户端检索索引
export async function loadAllEntries(): Promise<SearchEntry[]> {
  const index = await loadIndex()
  const entries: SearchEntry[] = []
  for (const meta of index) {
    const issue = await loadIssue(meta.week)
    for (const item of issue.items) {
      entries.push({
        ...item,
        week: meta.week,
        date: issue.date,
        issueTitle: issue.title,
      })
    }
  }
  return entries
}

// 跨语言检索：主语言权重略高，副语言也能命中（中文界面可搜英文词，反之亦然）
export function search(
  entries: SearchEntry[],
  query: string,
  lang: 'en' | 'zh',
): SearchEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const scoreIn = (e: SearchEntry, key: 'en' | 'zh') => {
    const title = (e.title[key] || '').toLowerCase()
    const note = (e.note[key] || '').toLowerCase()
    const tags = (e.tags[key] || []).join(' ').toLowerCase()
    let s = 0
    if (title.includes(q)) s += 3
    if (tags.includes(q)) s += 2
    if (note.includes(q)) s += 1
    return s
  }

  const primary = lang
  const secondary = lang === 'zh' ? 'en' : 'zh'

  return entries
    .map((e) => ({
      e,
      score: scoreIn(e, primary) * 1.2 + scoreIn(e, secondary),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.e.week.localeCompare(b.e.week))
    .map((x) => x.e)
}
