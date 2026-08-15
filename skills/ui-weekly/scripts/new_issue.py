#!/usr/bin/env python3
"""生成新一期的文件骨架（零依赖）。

用法：
  python3 scripts/new_issue.py              # 用今天的 ISO 周号
  python3 scripts/new_issue.py 2026-W34     # 指定周号

做的事：
  - 在 issues/ 下创建 <week>.en.md（带 frontmatter 骨架）和 <week>.cn.md（空）
  - 自动算 issue 号（扫描已有 en 版的 issue 取最大 + 1）
  - 打印三条校验命令，供直接复制
  - 已存在的文件不会覆盖

json 由 check_issue.py --emit-json 生成，不在这里手建。
"""

import sys
from datetime import date
from pathlib import Path

ISSUES_DIR = Path(__file__).resolve().parent.parent / "issues"

FM_TEMPLATE = """---
title: ""
issue: {issue}
# 发布日（通常是周日）；生成骨架的日期 ≠ 发布日时，写内容前记得改
date: "{date}"
cover: ""
summary: ""
tags: []
---
"""

CN_TEMPLATE = """---
title: ""
---
"""


def week_from_today() -> str:
    y, w, _ = date.today().isocalendar()
    return f"{y}-W{w:02d}"


def next_issue_number() -> int:
    """扫描 issues/*.en.md 的 frontmatter，取最大 issue + 1。"""
    max_issue = 0
    for f in sorted(ISSUES_DIR.glob("*.en.md")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("issue:"):
                val = line.split(":", 1)[1].strip().strip('"').strip("'")
                if val.isdigit():
                    max_issue = max(max_issue, int(val))
                break
    return max_issue + 1


def main(argv):
    week = argv[0] if argv else week_from_today()
    if "-W" not in week:
        print(f"周号格式应为 YYYY-Www，如 2026-W34（收到：{week}）", file=sys.stderr)
        return 2

    en = ISSUES_DIR / f"{week}.en.md"
    cn = ISSUES_DIR / f"{week}.cn.md"

    if en.exists() or cn.exists():
        print(f"已存在 {week} 的文件，不覆盖。", file=sys.stderr)
        return 1

    issue_no = next_issue_number()
    ISSUES_DIR.mkdir(parents=True, exist_ok=True)
    en.write_text(
        FM_TEMPLATE.format(issue=issue_no, date=date.today().isoformat()),
        encoding="utf-8",
    )
    cn.write_text(CN_TEMPLATE, encoding="utf-8")

    print(f"已创建（issue 号 {issue_no}）:")
    print(f"  {en}")
    print(f"  {cn}")
    print()
    print("写完跑校验:")
    print(f"  python3 scripts/check_issue.py {en}")
    print(f"  python3 scripts/check_issue.py {cn}")
    print(f"  python3 scripts/check_issue.py {en} --emit-json {ISSUES_DIR / (week + '.json')}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
