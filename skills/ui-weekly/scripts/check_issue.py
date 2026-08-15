#!/usr/bin/env python3
"""ui-weekly 校验 + 条目解析脚本（零依赖，纯标准库）。

职责一：确定性校验（lint）。把"靠模型自觉"的规则降级成脚本兜底：
  - frontmatter 必填字段（en 版）
  - 禁用词（营销黑话 / AI 腔 / 空强调词）
  - 栏目名白名单
  - 每条资源是否打了 #标签（检索召回的关键）
  - 条目点评是否过长（宽松 WARN）

职责二：从英文版 + 中文版 markdown 合并生成双语结构化条目 JSON。
  —— 这是检索库的原料（按 URL 对齐中英条目），由脚本生成，AI 不多写一个字。

职责三：跨期查重（--dedup）。扫描目录下历史 JSON，找出跨期重复的 URL。

用法：
  python3 check_issue.py issues/2026-W32.en.md
  python3 check_issue.py issues/2026-W32.en.md --emit-json issues/2026-W32.json
  python3 check_issue.py issues/  # 校验整个目录
  python3 check_issue.py issues/ --dedup   # 跨期查重

退出码：有 ERROR 时为 1（供 CI / 写作闭环使用）。
"""

import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# 规则配置（改规则改这里，别散落各处）
# ---------------------------------------------------------------------------

BANNED = [
    # 营销黑话
    "赋能", "一站式", "颠覆", "无缝", "闭环", "抓手", "颗粒度",
    "game-changer", "game changer", "revolutionize", "revolutionary",
    "seamless", "supercharge", "10x", "best-in-class", "cutting-edge",
    # AI 腔 / 空强调词 / 连接套话
    "绝了", "yyds", "太强了", "炸裂", "封神", "牛逼", "真牛", "太牛", "牛掰",
    "值得一提的是", "不难发现", "不难看出", "众所周知", "换言之",
    "genuinely", "actually", "literally", "it's not just", "not just",
]

# 栏目白名单：英文版（网站）与中文版（公众号）各自独立校验
SECTIONS_EN = [
    "intro", "maker of the week", "resources", "tools", "work",
    "worth reading", "misc", "look back", "steal this detail", "sign-off",
]
SECTIONS_CN = [
    "编者按", "本周主角", "资源", "工具软件", "作品案例",
    "值得一读", "随便看看", "回头看一眼", "偷一个细节", "收束",
]

# frontmatter 必填字段（仅 en 版）
REQUIRED_FRONTMATTER = ["title", "issue", "date", "summary", "tags"]

# 点评长度上限（超出 WARN，不 ERROR——长短句交替是被鼓励的）
NOTE_MAX_LEN = 200

# ---------------------------------------------------------------------------
# 解析器
# ---------------------------------------------------------------------------

# 条目行：**[资源名](url)** — 点评（破折号支持 — – - 三种）
ITEM_RE = re.compile(r"^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*[—–-]\s*(.+)$")
# 标签：反引号内 #词（如 `#motion #react`）
TAG_RE = re.compile(r"`#([^`]+)`")
# 栏目标题：## 标题
H2_RE = re.compile(r"^##\s+(.+)$")
# 配图行：![alt](相对路径)，紧跟在条目下一行
IMAGE_RE = re.compile(r"^!\[[^\]]*\]\(([^)]+)\)\s*$")
# frontmatter：开头 --- ... ---
FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(text: str) -> dict:
    m = FM_RE.match(text)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            k, v = line.split(":", 1)
            k, v = k.strip(), v.strip()
            # tags 之类是 JSON 数组，解析成 list；其余去首尾引号
            if v.startswith("[") and v.endswith("]"):
                try:
                    v = json.loads(v)
                except json.JSONDecodeError:
                    v = v.strip('"').strip("'")
            else:
                v = v.strip('"').strip("'")
            fm[k] = v
    return fm


def parse_items(text: str) -> list[dict]:
    """从正文抽条目，返回 [{title,url,note,tags,section,image}]。"""
    items = []
    current_section = ""
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        m = H2_RE.match(line)
        if m:
            current_section = m.group(1).strip().lower()
            i += 1
            continue
        m = ITEM_RE.match(line.strip())
        if m:
            title, url, note = m.group(1), m.group(2), m.group(3).strip()
            tags = []
            tm = TAG_RE.search(note)
            if tm:
                tags = [t.strip() for t in tm.group(1).split("#") if t.strip()]
                # 从点评里去掉标签尾巴，保留纯文本点评
                note = TAG_RE.sub("", note).strip().rstrip("—–-").strip()
            image = ""
            # 条目下一行若是配图行，则记为本条配图（中英两版共用同一张）
            if i + 1 < len(lines):
                im = IMAGE_RE.match(lines[i + 1].strip())
                if im:
                    image = im.group(1).strip()
                    i += 1
            items.append({
                "title": title,
                "url": url,
                "note": note,
                "tags": tags,
                "section": current_section,
                "image": image,
            })
        i += 1
    return items


# ---------------------------------------------------------------------------
# 校验
# ---------------------------------------------------------------------------

def lint(path: Path) -> list[str]:
    """返回 [(级别, 消息), ...]，级别为 ERROR / WARN。"""
    text = path.read_text(encoding="utf-8")
    results = []
    is_en = path.name.endswith(".en.md")
    is_cn = path.name.endswith(".cn.md")
    sections = SECTIONS_EN if is_en else SECTIONS_CN

    # 1. frontmatter（en 完整字段；cn 只需 title，供网站中文列表页）
    if is_en:
        fm = parse_frontmatter(text)
        if not fm:
            results.append(("ERROR", "缺少 frontmatter（--- 块）"))
        else:
            for key in REQUIRED_FRONTMATTER:
                if not fm.get(key):
                    results.append(("ERROR", f"frontmatter 缺少字段: {key}"))
            if fm.get("issue") and not fm["issue"].isdigit():
                results.append(("WARN", f"issue 应为纯数字: {fm['issue']}"))
    elif is_cn:
        fm_cn = parse_frontmatter(text)
        if not fm_cn.get("title"):
            results.append(("WARN", "中文版缺少 frontmatter title（网站中文列表页要用）"))

    # 2. 禁用词（带行号定位）
    for i, line in enumerate(text.splitlines(), 1):
        for word in BANNED:
            if word.lower() in line.lower():
                results.append(("ERROR", f"L{i} 禁用词「{word}」: {line.strip()[:60]}"))

    # 3. 栏目名白名单
    for i, line in enumerate(text.splitlines(), 1):
        m = H2_RE.match(line)
        if m and m.group(1).strip().lower() not in sections:
            results.append(
                ("WARN", f"L{i} 栏目不在白名单: 「{m.group(1)}」"
                         f"（白名单: {', '.join(sections)}）")
            )

    # 4. 条目标签（检索召回关键，两版都要求；公众号发布时由排版环节去标签）
    items = parse_items(text)
    for it in items:
        if not it["tags"]:
            results.append(("WARN", f"条目未打 #标签（影响检索召回）: {it['title']}"))
        if len(it["note"]) > NOTE_MAX_LEN:
            results.append(("WARN", f"点评偏长（{len(it['note'])} 字）: {it['title']}"))

    if not items and (is_en or is_cn):
        results.append(("WARN", "未解析到任何条目（检查格式 **[资源名](url)** — 点评）"))

    return results


def emit_json(src_en: Path, src_cn, dst: Path, fm: dict):
    """从 en + cn 两版 md 合并生成双语结构化条目 JSON（检索库原料）。

    src_cn 可为 None（找不到中文版时以英文兜底）。条目按 URL 对齐：
    中文版的标题/点评/标签/栏目对应英文版同 URL 的条目。
    """
    items_en = parse_items(src_en.read_text(encoding="utf-8"))
    cn_by_url = {}
    cn_title = ""
    if src_cn is not None and src_cn.exists():
        cn_text = src_cn.read_text(encoding="utf-8")
        cn_by_url = {it["url"]: it for it in parse_items(cn_text)}
        cn_title = parse_frontmatter(cn_text).get("title", "")

    items = []
    for it in items_en:
        cn = cn_by_url.get(it["url"], {})
        items.append({
            "title": {"en": it["title"], "zh": cn.get("title", it["title"])},
            "url": it["url"],
            "note": {"en": it["note"], "zh": cn.get("note", it["note"])},
            "tags": {"en": it["tags"], "zh": cn.get("tags", [])},
            "section": {"en": it["section"], "zh": cn.get("section", "")},
            "image": it.get("image", ""),
        })

    try:
        issue = int(fm.get("issue", 0))
    except (TypeError, ValueError):
        issue = 0
    payload = {
        "schemaVersion": 2,
        "issue": issue,
        "date": fm.get("date", ""),
        "title": {"en": fm.get("title", ""), "zh": cn_title},
        "summary": fm.get("summary", ""),
        "cover": fm.get("cover", ""),
        "cover_credit": fm.get("cover_credit", ""),
        "tags": fm.get("tags", []),
        "items": items,
    }
    dst.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return payload


def _norm_url(url: str) -> str:
    """规范化 URL 用于跨期比对：去 scheme/www、去尾斜杠、去 query/fragment、小写。"""
    url = (url or "").strip().lower()
    url = re.sub(r"^https?://", "", url)
    url = url.replace("www.", "", 1)
    url = url.rstrip("/")
    return url.split("?")[0].split("#")[0]


def dedup(dir_path: Path) -> dict:
    """扫描目录下所有 *.json，返回跨期重复的 {规范化URL: [期号, ...]}。"""
    seen = {}
    for j in sorted(dir_path.glob("*.json")):
        try:
            data = json.loads(j.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        issue = data.get("issue") or j.stem
        for item in data.get("items", []):
            url = _norm_url(item.get("url"))
            if url:
                seen.setdefault(url, []).append(issue)
    return {u: iss for u, iss in seen.items() if len(iss) > 1}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main(argv):
    if not argv:
        print(__doc__)
        return 2

    target = Path(argv[0])
    emit_dst = None
    if "--emit-json" in argv:
        emit_dst = Path(argv[argv.index("--emit-json") + 1])
    do_dedup = "--dedup" in argv

    files = []
    if target.is_dir():
        files = sorted(target.glob("*.md"))
    elif target.is_file():
        files = [target]
    else:
        print(f"目标不存在: {target}", file=sys.stderr)
        return 2

    errors = 0
    for f in files:
        print(f"\n== {f.name} ==")
        for level, msg in lint(f):
            print(f"  [{level}] {msg}")
            if level == "ERROR":
                errors += 1

    # 解析出 JSON（仅当指定了 --emit-json；源必须是 en 文件，自动找同周号 cn 文件做双语合并）
    if emit_dst:
        en_files = [f for f in files if f.name.endswith(".en.md")]
        if len(en_files) != 1:
            print("错误：--emit-json 需要指定单个英文文件（*.en.md）作为源。", file=sys.stderr)
            return 2
        src = en_files[0]
        src_cn = src.with_name(src.name.replace(".en.md", ".cn.md"))
        if not src_cn.exists():
            print(f"警告：找不到对应中文版 {src_cn.name}，将以英文兜底。", file=sys.stderr)
            src_cn = None
        fm = parse_frontmatter(src.read_text(encoding="utf-8"))
        payload = emit_json(src, src_cn, emit_dst, fm)
        print(f"\n== 已生成 {emit_dst.name}：{len(payload['items'])} 条条目（双语）==")

    # 跨期查重（可选，--dedup；只读历史 JSON，不影响退出码）
    if do_dedup:
        dup_dir = target if target.is_dir() else target.parent
        dups = dedup(dup_dir)
        print("\n== 跨期查重（--dedup）==")
        if dups:
            for url, issues in sorted(dups.items()):
                print(f"  [DEDUP] {url} ← 期号 {issues}")
        else:
            print("  无重复 URL。")

    if errors:
        print(f"\n{errors} 个 ERROR，未通过校验。", file=sys.stderr)
        return 1
    print("\n校验通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
