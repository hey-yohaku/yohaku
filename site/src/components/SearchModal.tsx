import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search as SearchIcon, X } from 'lucide-react'
import { loadAllEntries, search, type SearchEntry } from '../lib/search'

interface Props {
  open: boolean
  onClose: () => void
  lang: string
  en: boolean
}

export default function SearchModal({ open, onClose, lang, en }: Props) {
  const [entries, setEntries] = useState<SearchEntry[]>([])
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAllEntries().then(setEntries)
  }, [])

  // 打开时重置 + 聚焦 + Esc 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!open) return
    setQuery('')
    const timer = setTimeout(() => inputRef.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const results = useMemo(
    () => search(entries, query, en ? 'en' : 'zh'),
    [entries, query, en],
  )

  const pick = (v?: { en: string; zh: string }) => {
    if (!v) return ''
    return en ? v.en || v.zh : v.zh || v.en
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
      role="dialog"
      aria-modal="true"
      aria-label={en ? 'Search' : '搜索'}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-kumo-canvas border border-kumo-hairline rounded-sm shadow-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 border-b border-kumo-hairline">
          <SearchIcon size={15} strokeWidth={1.5} className="text-kumo-inactive shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={en ? 'Search every issue — EN or 中文' : '搜遍所有期 —— 中文或英文'}
            className="flex-1 py-3.5 bg-transparent text-[15px] text-kumo-default placeholder:text-kumo-inactive focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label={en ? 'Close' : '关闭'}
            className="text-kumo-inactive hover:text-kumo-default transition-colors duration-200 shrink-0"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-4 py-4">
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
            <div className="space-y-6">
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
                    <Link
                      to={`/${lang}/issues/${it.week}`}
                      onClick={onClose}
                      className="hover:text-kumo-subtle transition-colors duration-200"
                    >
                      {en ? 'OPEN ISSUE' : '查看当期'}
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
