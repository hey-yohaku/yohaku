import { useState } from 'react'
import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { BookOpen, Info, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'
import SearchModal from './SearchModal'

const T = {
  en: { issues: 'ISSUES', search: 'SEARCH', about: 'ABOUT' },
  zh: { issues: '期刊', search: '搜索', about: '关于' },
}

const linkBase =
  'group flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.18em] transition-colors duration-200'

function NavLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
        active
          ? 'max-w-[72px] opacity-100'
          : 'max-w-0 opacity-0 group-hover:max-w-[72px] group-hover:opacity-100'
      }`}
    >
      {children}
    </span>
  )
}

export default function Layout() {
  const { lang = 'en' } = useParams()
  const location = useLocation()
  const { dark, toggle } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  const isEn = lang === 'en'
  const otherLang = isEn ? 'zh' : 'en'
  const t = T[isEn ? 'en' : 'zh']
  const switchPath = location.pathname.replace(/^\/(en|zh)/, `/${otherLang}`)

  const onHome = location.pathname === `/${lang}` || location.pathname === `/${lang}/`
  const onAbout = location.pathname.startsWith(`/${lang}/about`)

  return (
    <div className="min-h-screen bg-kumo-canvas text-kumo-default flex flex-col">
      <header className="border-b border-kumo-hairline">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link
            to={`/${lang}`}
            className="font-serif text-[20px] sm:text-[22px] leading-none text-kumo-strong tracking-tight"
          >
            yohaku
          </Link>

          <nav className="flex items-center gap-4 sm:gap-5">
            <Link
              to={`/${lang}`}
              title={t.issues}
              className={`${linkBase} ${onHome ? 'text-kumo-strong' : 'text-kumo-subtle hover:text-kumo-default'}`}
            >
              <BookOpen size={15} strokeWidth={1.5} />
              <NavLabel active={onHome}>{t.issues}</NavLabel>
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              title={t.search}
              aria-label={t.search}
              className={`${linkBase} ${searchOpen ? 'text-kumo-brand' : 'text-kumo-subtle hover:text-kumo-default'}`}
            >
              <Search size={15} strokeWidth={1.5} />
              <NavLabel active={false}>{t.search}</NavLabel>
            </button>
            <Link
              to={`/${lang}/about`}
              title={t.about}
              className={`${linkBase} ${onAbout ? 'text-kumo-strong' : 'text-kumo-subtle hover:text-kumo-default'}`}
            >
              <Info size={15} strokeWidth={1.5} />
              <NavLabel active={onAbout}>{t.about}</NavLabel>
            </Link>
            <span className="w-px h-3 bg-kumo-hairline" />
            <Link
              to={switchPath}
              className="text-kumo-subtle hover:text-kumo-brand transition-colors duration-200 font-mono text-[10px] sm:text-[11px] tracking-[0.16em]"
            >
              {otherLang.toUpperCase()}
            </Link>
            <button
              onClick={toggle}
              aria-label="toggle theme"
              className="text-kumo-subtle hover:text-kumo-brand transition-colors duration-200 flex"
            >
              {dark ? (
                <Sun size={18} strokeWidth={1.5} />
              ) : (
                <Moon size={18} strokeWidth={1.5} />
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-kumo-hairline">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8 sm:py-10 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-[0.14em] text-kumo-inactive">
          <span>yohaku · 余白</span>
          <span>{isEn ? 'INTERFACE & TASTE' : '界面 · 品位'}</span>
        </div>
      </footer>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} lang={lang} en={isEn} />
    </div>
  )
}
