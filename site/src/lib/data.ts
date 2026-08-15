// 内容数据加载：index.json（期列表）与 issues/<week>.json（单期双语内容）

export interface IssueMeta {
  week: string
  issue: number
  date: string
  title: { en: string; zh: string }
  summary: string
  tags: string[]
}

export interface IssueItem {
  title: { en: string; zh: string }
  url: string
  note: { en: string; zh: string }
  tags: { en: string[]; zh: string[] }
  section: { en: string; zh: string }
  image: string
}

export interface Issue {
  schemaVersion: number
  issue: number
  date: string
  title: { en: string; zh: string }
  summary: string
  cover: string
  cover_credit: string
  tags: string[]
  items: IssueItem[]
}

const base = import.meta.env.BASE_URL

export async function loadIndex(): Promise<IssueMeta[]> {
  const res = await fetch(`${base}data/index.json`)
  const data = await res.json()
  return data.issues ?? []
}

export async function loadIssue(week: string): Promise<Issue> {
  const res = await fetch(`${base}data/issues/${week}.json`)
  return res.json()
}
