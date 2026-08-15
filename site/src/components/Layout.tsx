import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

const T = {
  en: { issues: 'ISSUES', search: 'SEARCH', about: 'ABOUT' },
  zh: { issues: '期刊', search: '搜索', about: '关于' },
}

export default function Layout() {
  const { lang = 'en' } = useParams()
  const location = useLocation()
  const { dark, toggle } = useTheme()

  const isEn = lang === 'en'
  const otherLang = isEn ? 'zh' : 'en'
  const t = T[isEn ? 'en' : 'zh']
  const switchPath = location.pathname.replace(/^\/(en|zh)/, `/${otherLang}`)

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

          <nav className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] sm:text-[11px] tracking-[0.16em] sm:tracking-[0.18em]">
            <Link
              to={`/${lang}`}
              className="text-kumo-subtle hover:text-kumo-default transition-colors duration-200"
            >
              {t.issues}
            </Link>
            <Link
              to={`/${lang}/search`}
              className="text-kumo-subtle hover:text-kumo-default transition-colors duration-200"
            >
              {t.search}
            </Link>
            <Link
              to={`/${lang}/about`}
              className="text-kumo-subtle hover:text-kumo-default transition-colors duration-200"
            >
              {t.about}
            </Link>
            <span className="w-px h-3 bg-kumo-hairline" />
            <Link
              to={switchPath}
              className="text-kumo-subtle hover:text-kumo-brand transition-colors duration-200"
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
    </div>
  )
}
