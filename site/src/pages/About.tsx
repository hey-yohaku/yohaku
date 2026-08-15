import { useParams } from 'react-router-dom'

export default function About() {
  const { lang } = useParams()
  const en = lang === 'en'

  return (
    <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
      <p className="font-mono text-[11px] tracking-[0.24em] text-kumo-inactive mb-6">
        {en ? 'ABOUT' : '关于'}
      </p>

      <h1 className="font-serif text-3xl md:text-4xl leading-tight text-kumo-strong mb-6">
        yohaku<span className="text-kumo-subtle">（余白）</span>
      </h1>

      <div className="space-y-5 text-kumo-subtle leading-relaxed">
        <p>
          {en
            ? 'The Japanese word for whitespace — the empty space that gives a composition its rhythm. This weekly treats curation as craft: fewer links, sharper judgment.'
            : '日语「留白」—— 给构图以节奏的那片空。这份周刊把策展当手艺：更少的链接，更准的判断。'}
        </p>
        <p>
          {en
            ? 'Every issue covers interface, design, and the tools behind them. Restraint over volume; a point of view over a list.'
            : '每期关注界面、设计，以及它们背后的工具。克制胜于堆量；观点胜于流水账。'}
        </p>
      </div>

      <footer className="mt-14 pt-6 border-t border-kumo-hairline font-mono text-[11px] tracking-[0.14em] text-kumo-inactive">
        yohaku · 余白
      </footer>
    </div>
  )
}
