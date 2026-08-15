import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { loadIssue, type Issue, type IssueItem } from '../lib/data'

export default function Issue() {
  const { lang = 'en', week } = useParams()
  const en = lang === 'en'
  const [issue, setIssue] = useState<Issue | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!week) return
    loadIssue(week)
      .then(setIssue)
      .catch(() => setError(true))
  }, [week])

  const t = (v?: { en: string; zh: string }) => (v ? (en ? v.en : v.zh) : '')

  // 按栏目分组（保持首次出现的顺序）
  const groups = useMemo(() => {
    if (!issue) return []
    const map = new Map<string, IssueItem[]>()
    for (const it of issue.items) {
      const key = t(it.section) || '—'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return Array.from(map.entries())
  }, [issue, en])

  // 扁平条目列表（每个内容一个刻度）
  const flatItems = useMemo(() => {
    const arr: { id: string; title: string; section: string }[] = []
    groups.forEach(([section, items], gi) => {
      items.forEach((it, ii) => {
        arr.push({ id: `sec-${gi}-${ii}`, title: t(it.title), section })
      })
    })
    return arr
  }, [groups])

  // 侧边索引高亮（scroll spy，按条目）
  const [activeItem, setActiveItem] = useState(0)
  useEffect(() => {
    if (flatItems.length === 0) return
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
      if (nearBottom) {
        setActiveItem(flatItems.length - 1)
        return
      }
      let current = 0
      const pos = window.scrollY + 120
      for (let i = 0; i < flatItems.length; i++) {
        const el = document.getElementById(flatItems[i].id)
        if (!el) continue
        if (el.getBoundingClientRect().top + window.scrollY <= pos) current = i
      }
      setActiveItem(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [flatItems])

  return (
    <div className="lg:grid lg:grid-cols-[40px_minmax(0,700px)] lg:justify-center lg:gap-8">
      <aside className="hidden lg:block">
        {issue && flatItems.length > 1 && (
          <nav aria-label="Section scrubber" className="sticky top-1/2 -translate-y-1/2">
            <ol className="space-y-1.5">
              {flatItems.map((it, i) => (
                <li key={it.id}>
                  <a
                    href={`#${it.id}`}
                    aria-label={it.title}
                    onMouseEnter={() =>
                      document
                        .getElementById(it.id)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className="group relative flex items-center py-0.5"
                  >
                    <span
                      className={`block h-[3px] rounded-full transition-all duration-200 ${
                        activeItem === i
                          ? 'w-6 bg-kumo-brand'
                          : 'w-2.5 bg-kumo-hairline group-hover:w-4 group-hover:bg-kumo-subtle'
                      }`}
                    />
                    <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.14em] text-kumo-subtle opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-150">
                      {it.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </aside>
      <article className="max-w-3xl mx-auto px-6 py-14 md:py-20 lg:mx-0 lg:max-w-none lg:px-0">
      <Link
        to={`/${lang}`}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-kumo-inactive hover:text-kumo-subtle transition-colors duration-200"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        {en ? 'INDEX' : '目录'}
      </Link>

      {error && (
        <p className="text-kumo-subtle mt-10">{en ? 'Issue not found.' : '找不到这一期。'}</p>
      )}
      {!error && !issue && (
        <p className="font-mono text-[11px] tracking-[0.14em] text-kumo-inactive mt-10">
          {en ? 'LOADING…' : '加载中…'}
        </p>
      )}

      {issue && (
        <>
          <header className="mt-10 mb-14">
            <p className="font-mono text-[11px] tracking-[0.22em] text-kumo-inactive mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                {en ? 'ISSUE ' : '第 '}
                {String(issue.issue).padStart(2, '0')}
                {en ? '' : ' 期'}
              </span>
              <span className="text-kumo-hairline">/</span>
              <span>{issue.date}</span>
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-[42px] leading-[1.12] text-kumo-strong">
              {t(issue.title)}
            </h1>
            {en && issue.summary && (
              <p className="text-kumo-subtle leading-relaxed mt-5 max-w-xl">{issue.summary}</p>
            )}
            {issue.cover && (
              <figure className="mt-7 overflow-hidden rounded-sm border border-kumo-hairline bg-kumo-recessed">
                <img
                  src={`${import.meta.env.BASE_URL}${issue.cover}`}
                  alt={t(issue.title)}
                  className="w-full aspect-[16/10] object-cover"
                />
                {issue.cover_credit && (
                  <figcaption className="px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-kumo-inactive border-t border-kumo-hairline">
                    {en ? 'COVER · ' : '封面来自 '}
                    {issue.cover_credit}
                  </figcaption>
                )}
              </figure>
            )}
          </header>

          <div className="space-y-12">
            {groups.map(([section, items], gi) => (
              <section
                key={section}
                id={`sec-${gi}`}
                className="rise-in"
                style={{ animationDelay: `${gi * 60}ms` }}
              >
                <h2 className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[11px] text-kumo-brand tracking-widest">
                    {String(gi + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.2em] text-kumo-subtle">
                    {section}
                  </span>
                  <span className="flex-1 h-px bg-kumo-hairline" />
                </h2>

                <div className="space-y-6">
                  {items.map((it, ii) => (
                    <div
                      key={ii}
                      id={`sec-${gi}-${ii}`}
                      className="rise-in border-l-2 border-kumo-hairline pl-4 hover:border-kumo-brand transition-colors duration-200"
                      style={{ animationDelay: `${gi * 60 + ii * 45 + 90}ms` }}
                    >
                      <h3 className="text-base font-medium text-kumo-strong mb-1">
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-kumo-brand transition-colors duration-200"
                        >
                          {t(it.title)}
                          <ArrowUpRight
                            size={13}
                            strokeWidth={1.5}
                            className="inline text-kumo-inactive ml-0.5 align-[-2px]"
                          />
                        </a>
                      </h3>
                      <p className="text-kumo-subtle text-sm leading-relaxed">{t(it.note)}</p>
                      {it.image && (
                        <figure className="mt-3 overflow-hidden rounded-sm border border-kumo-hairline bg-kumo-recessed">
                          <img
                            src={`${import.meta.env.BASE_URL}${it.image}`}
                            alt={t(it.title)}
                            loading="lazy"
                            className="w-full aspect-[16/10] object-cover"
                          />
                        </figure>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-16 pt-6 border-t border-kumo-hairline flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-kumo-inactive">
            <span>yohaku · 余白</span>
            <span className="inline-flex items-center gap-1">
              <ArrowUpRight size={11} strokeWidth={1.5} />
              {en ? 'LINKS OPEN EXTERNALLY' : '外链新开'}
            </span>
          </footer>
        </>
      )}
      </article>
    </div>
  )
}
