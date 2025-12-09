# 矽谷流專案

## 專案簡介
將《矽谷流萬用敘事簡報法則》這本書轉換成可執行的 Claude Code 技能，讓使用者能透過對話生成專業的投影片風格圖片。

## 技能位置
- **矽谷流技能**：`.claude/skills/矽谷流技能/`
  - SKILL.md：技能定義檔
  - knowledge/silicon-valley-flow.json：矽谷流知識庫
  - scripts/：投影片生成腳本

## 使用方式
在 Claude Code 中，說：
- 「用矽谷流幫我做簡報」
- 「矽谷流投影片」
- 「故事簡報」
- 「WHY WHAT HOW」

## 簡報類型
1. **proposal**：提出建議（5張投影片）
2. **status_update**：近況更新（4張投影片）
3. **pitch**：創業簡報（5張投影片）

## 依賴
- 需要「圖片生成技能」已安裝
- GOOGLE_CLOUD_PROJECT 環境變數
- Google Cloud 認證

## 架構設計原則
- **BDD**：行為驅動設計，定義使用者故事
- **SOLID**：單一職責、開放封閉、依賴反轉
- **DRY**：複用現有圖片生成技能

## 地雷經驗記憶
（暫無，待後續使用累積）
