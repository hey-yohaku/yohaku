import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { loadAllEntries, search, type SearchEntry } from '../lib/search'

export default function Search() {
  const { lang = 'en' } = useParams()
  const en = lang === 'en'
  const [entries, setEntries] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadAllEntries().then(setEntries)
  }, [])

  const results = useMemo(
    () => search(entries, query, en ? 'en' : 'zh'),
    [entries, query, en],
  )

  const pick = (v?: { en: string; zh: string }) => {
    if (!v) return ''
    return en ? v.en || v.zh : v.zh || v.en
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
      <p className="font-mono text-[11px] tracking-[0.24em] text-kumo-inactive mb-6">
        {en ? 'SEARCH' : '搜索'}
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={en ? 'Search every issue — EN or 中文' : '搜遍所有期 —— 中文或英文'}
        className="w-full px-4 py-3 bg-kumo-base border border-kumo-hairline rounded-sm text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand mb-8"
      />

      {query.trim() === '' ? (
        <p className="font-mono text-[11px] tracking-[0.14em] text-kumo-inactive">
          {en
            ? `${entries.length} LINKS INDEXED — TITLE · NOTE · TAG`
            : `已索引 ${entries.length} 条 — 可搜标题 · 点评 · 标签`}
        </p>
      ) : results.length === 0 ? (
        <p className="font-mono text-[11px] tracking-[0.14em] text-kumo-inactive">
          {en ? 'NO MATCHES' : '没有匹配'}
        </p>
      ) : (
        <div className="space-y-7">
          <p className="font-mono text-[11px] tracking-[0.14em] text-kumo-inactive">
            {en
              ? `${results.length} RESULT${results.length > 1 ? 'S' : ''}`
              : `${results.length} 条结果`}
          </p>
          {results.map((it, i) => (
            <div key={`${it.week}-${i}`} className="border-l-2 border-kumo-hairline pl-4">
              <div className="flex items-baseline gap-2 mb-1">
                <a
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-medium text-kumo-strong hover:text-kumo-brand transition-colors duration-200"
                >
                  {pick(it.title)}
                </a>
                <span className="text-kumo-inactive shrink-0 flex">
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </span>
              </div>
              <p className="text-kumo-subtle text-sm leading-relaxed mb-1.5">{pick(it.note)}</p>
              <p className="font-mono text-[11px] tracking-[0.12em] text-kumo-inactive">
                {it.week}
                <span className="mx-1.5 text-kumo-hairline">/</span>
                {pick(it.section)}
                <span className="mx-1.5 text-kumo-hairline">/</span>
                <Link to={`/${lang}/issues/${it.week}`} className="hover:text-kumo-subtle transition-colors duration-200">
                  {en ? 'OPEN ISSUE' : '查看当期'}
                </Link>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
