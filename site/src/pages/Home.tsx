import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadIndex, type IssueMeta } from '../lib/data'
import NewsletterForm from '../components/NewsletterForm'

export default function Home() {
  const { lang = 'en' } = useParams()
  const en = lang === 'en'
  const [issues, setIssues] = useState<IssueMeta[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadIndex().then((list) => {
      setIssues(list)
      setLoaded(true)
    })
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 md:py-20">
      {/* —— 头版 —— */}
      <header className="mb-10 md:mb-12">
        <p className="font-mono text-[11px] tracking-[0.24em] text-kumo-inactive mb-6">
          {en ? 'A WEEKLY ON INTERFACE & TASTE' : '每周一期 · 界面与品位'}
        </p>
        <h1 className="font-serif text-[32px] sm:text-4xl md:text-[44px] leading-[1.1] text-kumo-strong mb-5">
          {en ? 'Taste is a practice,' : '品位是一种练习，'}
          <br />
          {en ? 'not a feature.' : '不是一个功能。'}
        </h1>
        <p className="text-kumo-subtle leading-relaxed max-w-xl">
          {en
            ? 'Curated links, judged with restraint. In English and Chinese.'
            : '克制的策展，有判断的点评。中英双语。'}
        </p>
      </header>

      {/* —— 订阅 —— */}
      <NewsletterForm lang={lang} />

      {/* —— 目录（索引）—— */}
      <div className="border-t border-kumo-hairline mt-12 md:mt-16">
        {!loaded ? (
          <p className="font-mono text-[11px] tracking-[0.14em] text-kumo-inactive py-6">
            {en ? 'LOADING…' : '加载中…'}
          </p>
        ) : issues.length === 0 ? (
          <p className="font-mono text-[11px] tracking-[0.14em] text-kumo-inactive py-6">
            {en ? 'NO ISSUES YET' : '还没有期刊'}
          </p>
        ) : (
          issues.map((it) => (
            <Link
              key={it.week}
              to={`/${lang}/issues/${it.week}`}
              className="group grid grid-cols-[2rem_1fr] gap-3 sm:gap-4 md:grid-cols-[2.5rem_1fr_auto] md:gap-6 items-baseline py-6 md:py-7 border-b border-kumo-hairline"
            >
              <span className="font-mono text-xs text-kumo-inactive tracking-widest">
                {String(it.issue).padStart(2, '0')}
              </span>

              <span className="min-w-0">
                <span className="block font-serif text-xl md:text-2xl leading-snug text-kumo-strong group-hover:text-kumo-brand transition-colors duration-200">
                  {en ? it.title.en : it.title.zh}
                </span>
                <span className="block md:hidden font-mono text-[10px] text-kumo-inactive tracking-wider mt-1.5">
                  {it.date}
                </span>
                {en && it.summary && (
                  <span className="block text-kumo-subtle text-sm leading-relaxed mt-2 max-w-xl">
                    {it.summary}
                  </span>
                )}
              </span>

              <span className="hidden md:block font-mono text-[11px] text-kumo-inactive tracking-wider">
                {it.date}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
