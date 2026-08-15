#!/usr/bin/env python3
"""check_issue.py 的单测（零依赖，标准库 unittest）。

运行：
  python3 scripts/test_check_issue.py
"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_issue as ci


def write(d, name, text):
    p = Path(d) / name
    p.write_text(text, encoding="utf-8")
    return p


VALID_EN = """---
title: "Test"
issue: 1
date: "2026-08-13"
cover: ""
summary: "A summary"
tags: ["ui", "test"]
---

## Resources

**[Foo](https://foo.com/)** — a thing with a take. `#ui #test`
"""


class TestFrontmatter(unittest.TestCase):
    def test_parses_scalar_and_list(self):
        fm = ci.parse_frontmatter(VALID_EN)
        self.assertEqual(fm["issue"], "1")
        self.assertEqual(fm["title"], "Test")
        self.assertEqual(fm["tags"], ["ui", "test"])

    def test_empty_when_missing(self):
        self.assertEqual(ci.parse_frontmatter("no frontmatter here"), {})


class TestItems(unittest.TestCase):
    def test_parses_item_and_tags(self):
        items = ci.parse_items(VALID_EN)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Foo")
        self.assertEqual(items[0]["url"], "https://foo.com/")
        self.assertEqual(items[0]["tags"], ["ui", "test"])
        self.assertEqual(items[0]["section"], "resources")
        self.assertNotIn("`#ui", items[0]["note"])


class TestLint(unittest.TestCase):
    def test_valid_en_has_no_errors(self):
        with tempfile.TemporaryDirectory() as d:
            p = write(d, "2026-W01.en.md", VALID_EN)
            errors = [m for lvl, m in ci.lint(p) if lvl == "ERROR"]
            self.assertEqual(errors, [])

    def test_banned_word_is_error(self):
        with tempfile.TemporaryDirectory() as d:
            p = write(d, "x.en.md", VALID_EN + "\n一句话里带赋能。\n")
            errors = [m for lvl, m in ci.lint(p) if lvl == "ERROR"]
            self.assertTrue(any("赋能" in m for m in errors))

    def test_snail_not_flagged(self):
        # 「牛」已从禁词表移除，正常词不应误伤
        with tempfile.TemporaryDirectory() as d:
            p = write(d, "x.en.md", VALID_EN + "\n蜗牛壳纹理。\n")
            errors = [m for lvl, m in ci.lint(p) if lvl == "ERROR"]
            self.assertEqual(errors, [])

    def test_niu_slang_still_flagged(self):
        with tempfile.TemporaryDirectory() as d:
            p = write(d, "x.en.md", VALID_EN + "\n这插件太牛逼了。\n")
            errors = [m for lvl, m in ci.lint(p) if lvl == "ERROR"]
            self.assertTrue(any("牛逼" in m for m in errors))

    def test_missing_frontmatter_is_error(self):
        with tempfile.TemporaryDirectory() as d:
            p = write(d, "x.en.md", "## Intro\n\nno fm\n")
            errors = [m for lvl, m in ci.lint(p) if lvl == "ERROR"]
            self.assertTrue(any("frontmatter" in m for m in errors))


class TestEmitJson(unittest.TestCase):
    def test_payload_has_full_fields(self):
        with tempfile.TemporaryDirectory() as d:
            src = write(d, "x.en.md", VALID_EN)
            dst = Path(d) / "x.json"
            fm = ci.parse_frontmatter(VALID_EN)
            payload = ci.emit_json(src, None, dst, fm)
            self.assertEqual(payload["schemaVersion"], 2)
            self.assertEqual(payload["issue"], 1)
            self.assertEqual(payload["summary"], "A summary")
            self.assertEqual(payload["cover"], "")
            self.assertEqual(payload["tags"], ["ui", "test"])
            self.assertEqual(payload["title"]["en"], "Test")
            self.assertEqual(payload["title"]["zh"], "")
            self.assertEqual(len(payload["items"]), 1)
            self.assertEqual(payload["items"][0]["tags"]["en"], ["ui", "test"])
            self.assertTrue(dst.exists())

    def test_merges_cn_by_url(self):
        with tempfile.TemporaryDirectory() as d:
            en = write(d, "x.en.md", VALID_EN)
            cn = write(d, "x.cn.md", '---\ntitle: "测试"\n---\n\n## 资源\n\n**[Foo](https://foo.com/)** — 一个有判断的点评。 `#ui #测试`\n')
            dst = Path(d) / "x.json"
            fm = ci.parse_frontmatter(VALID_EN)
            payload = ci.emit_json(en, cn, dst, fm)
            self.assertEqual(payload["title"]["zh"], "测试")
            self.assertEqual(payload["items"][0]["note"]["zh"], "一个有判断的点评。")
            self.assertEqual(payload["items"][0]["tags"]["zh"], ["ui", "测试"])
            self.assertEqual(payload["items"][0]["section"]["zh"], "资源")


class TestDedup(unittest.TestCase):
    def test_finds_cross_issue_duplicate(self):
        with tempfile.TemporaryDirectory() as d:
            base = {
                "schemaVersion": 1,
                "issue": 1,
                "items": [{"title": "Foo", "url": "https://foo.com/"}],
            }
            (Path(d) / "a.json").write_text(
                '{"issue": 1, "items": [{"url": "https://foo.com/"}]}', encoding="utf-8"
            )
            (Path(d) / "b.json").write_text(
                '{"issue": 2, "items": [{"url": "https://foo.com/"}]}', encoding="utf-8"
            )
            dups = ci.dedup(Path(d))
            self.assertIn("foo.com", dups)

    def test_no_duplicate(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "a.json").write_text(
                '{"issue": 1, "items": [{"url": "https://foo.com/"}]}', encoding="utf-8"
            )
            (Path(d) / "b.json").write_text(
                '{"issue": 2, "items": [{"url": "https://bar.com/"}]}', encoding="utf-8"
            )
            self.assertEqual(ci.dedup(Path(d)), {})


if __name__ == "__main__":
    unittest.main()
