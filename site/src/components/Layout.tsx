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

function NavLabel({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
        show ? 'max-w-[72px] opacity-100' : 'max-w-0 opacity-0'
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
  const [hovered, setHovered] = useState<string | null>(null)

  const isEn = lang === 'en'
  const otherLang = isEn ? 'zh' : 'en'
  const t = T[isEn ? 'en' : 'zh']
  const switchPath = location.pathname.replace(/^\/(en|zh)/, `/${otherLang}`)

  const onHome = location.pathname === `/${lang}` || location.pathname === `/${lang}/`
  const onAbout = location.pathname.startsWith(`/${lang}/about`)

  // 同一时刻只有一个 tab 显示文字：hover 谁显示谁；无 hover 时显示 active 的
  const showIssues = hovered === 'issues' || (hovered === null && onHome)
  const showSearch = hovered === 'search'
  const showAbout = hovered === 'about' || (hovered === null && onAbout)

  const hoverProps = (key: string) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered(null),
  })

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
              {...hoverProps('issues')}
              className={`${linkBase} ${onHome ? 'text-kumo-strong' : 'text-kumo-subtle hover:text-kumo-default'}`}
            >
              <BookOpen size={15} strokeWidth={1.5} />
              <NavLabel show={showIssues}>{t.issues}</NavLabel>
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              title={t.search}
              aria-label={t.search}
              {...hoverProps('search')}
              className={`${linkBase} ${searchOpen ? 'text-kumo-brand' : 'text-kumo-subtle hover:text-kumo-default'}`}
            >
              <Search size={15} strokeWidth={1.5} />
              <NavLabel show={showSearch}>{t.search}</NavLabel>
            </button>
            <Link
              to={`/${lang}/about`}
              title={t.about}
              {...hoverProps('about')}
              className={`${linkBase} ${onAbout ? 'text-kumo-strong' : 'text-kumo-subtle hover:text-kumo-default'}`}
            >
              <Info size={15} strokeWidth={1.5} />
              <NavLabel show={showAbout}>{t.about}</NavLabel>
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
