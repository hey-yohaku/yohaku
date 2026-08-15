# yohaku · 余白

A weekly on interface & taste — curated links, judged with restraint. In English and Chinese.

一份关于界面与品位的周刊：克制的策展，有判断的点评。中英双语。

## 结构

- `skills/ui-weekly/` — 内容生产 skill：从 Raindrop 收藏链接研究，写成英文站版 + 微信公众号版两份 Markdown，脚本校验并生成检索 JSON
- `site/` — 网站：React + TypeScript + Tailwind v4 + Kumo（Cloudflare），静态部署，支持搜索 / 中英切换 / 明暗模式

## 快速开始

### 网站

```bash
cd site
npm install
node scripts/sync-issues.mjs   # 同步 issues JSON + 配图（从 skills/ui-weekly/issues）
npm run dev                    # 开发服务器 http://localhost:5173
npm run build                  # 生产构建（纯静态，可部署到任意静态托管）
```

### 内容 skill

```bash
cd skills/ui-weekly
python3 scripts/new_issue.py [2026-W40]                                  # 新建一期
python3 scripts/check_issue.py issues/<file>.en.md                       # 校验
python3 scripts/check_issue.py issues/<file>.en.md --emit-json issues/<file>.json   # 生成检索 JSON
python3 scripts/test_check_issue.py                                      # 单元测试
```

## 品牌

品牌色 Flexoki（纸白 `#FFFCF0` / 墨黑 `#100F0F` / 朱红 `#AF3029`，仅作信号色）。设计原则见 `site/DESIGN.md`。

## 语域

第三人称抽离、克制、敢损。详见 `skills/ui-weekly/voice.md`。
