// 从 skill 项目同步 issues/*.json 到网站 public/data/，并生成 index.json
import { readdir, readFile, writeFile, mkdir, copyFile, cp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const SKILL_ISSUES = path.resolve(process.cwd(), '../skills/ui-weekly/issues')
const SITE_DATA = path.resolve(process.cwd(), 'public/data')
const SITE_ISSUES = path.join(SITE_DATA, 'issues')

async function main() {
  await mkdir(SITE_ISSUES, { recursive: true })

  const files = (await readdir(SKILL_ISSUES)).filter((f) => f.endsWith('.json'))
  const meta = []

  for (const f of files.sort()) {
    const src = path.join(SKILL_ISSUES, f)
    const data = JSON.parse(await readFile(src, 'utf-8'))
    await copyFile(src, path.join(SITE_ISSUES, f))
    meta.push({
      week: f.replace('.json', ''),
      issue: data.issue,
      date: data.date,
      title: data.title,
      summary: data.summary ?? '',
      tags: data.tags ?? [],
    })
  }

  meta.sort((a, b) => String(b.date).localeCompare(String(a.date))) // 最新在前
  await writeFile(
    path.join(SITE_DATA, 'index.json'),
    JSON.stringify({ issues: meta }, null, 2) + '\n',
  )

  // 同步配图 assets 目录（两版共用、语言无关）→ public/assets/
  const skillAssets = path.join(SKILL_ISSUES, 'assets')
  const siteAssets = path.resolve(process.cwd(), 'public/assets')
  if (existsSync(skillAssets)) {
    await rm(siteAssets, { recursive: true, force: true })
    await cp(skillAssets, siteAssets, { recursive: true })
  }

  console.log(`同步完成：${meta.length} 期 → public/data/`)
}

main()
