# yohaku · 余白周刊 (ui-weekly)

一个 Claude / Agent skill：把 Gavin 每周从 X 收藏的 UI / 设计 / 工具 / 产品资源，逐条研究、深挖作者背景，写成**英文站版 + 微信公众号版**两份周刊草稿。

## 目录

- `SKILL.md` — skill 主指令：工作流、栏目、条目格式、声音规则、校验流程。
- `voice.md` — 声音样本 + 刊物定位：Gavin 的写作画像与中英文样板（写作前必读）。
- `icon.svg` — skill 图标。
- `scripts/check_issue.py` — 校验 + 双语结构化 JSON 生成（零依赖）。确定性检查禁用词 / frontmatter / 栏目白名单 / 条目标签 / 点评长度；`--emit-json` 从英+中两版按 URL 对齐，合并生成双语检索库 JSON；`--dedup` 跨期查重。
- `scripts/new_issue.py` — 生成新一期文件骨架（自动算 ISO 周号 + issue 号）。
- `scripts/test_check_issue.py` — 校验脚本的单测。
- `issues/` — 每期三个文件：`<YYYY>-W<周号>.en.md`（英文站版）、`.cn.md`（公众号版）、`.json`（结构化条目，脚本生成）。

## 快速开始

每期流程：

```bash
# 1. 生成新一期骨架（自动算本周 ISO 周号）
python3 scripts/new_issue.py

# 2. 写内容（见 SKILL.md 工作流），然后校验 + 生成 JSON
python3 scripts/check_issue.py issues/<YYYY>-W<周号>.en.md
python3 scripts/check_issue.py issues/<YYYY>-W<周号>.cn.md
python3 scripts/check_issue.py issues/<YYYY>-W<周号>.en.md --emit-json issues/<YYYY>-W<周号>.json

# 3. （可选）跨期查重
python3 scripts/check_issue.py issues/ --dedup
```

`check_issue.py` 有 ERROR 时退出码为 1，可用于 CI 兜底。

## 约定

- **JSON 不手写**：`issues/*.json` 由 `--emit-json` 生成（双语条目），是网站检索库的原料。
- **标签是地基**：两版每条资源末尾 `#标签` 必打（en 英文、cn 中文，专有名词保留英文），决定中英文检索召回。
- **禁词唯一真源**：`scripts/check_issue.py` 里的 `BANNED` 列表，要加/删词直接改脚本，别在 SKILL.md 另列一份。

## 测试

```bash
python3 scripts/test_check_issue.py
```
