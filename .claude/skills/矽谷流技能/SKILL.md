---
name: 矽谷流技能
description: 將你的概念轉換成矽谷流風格的投影片。當使用者說「矽谷流」、「故事簡報」、「做投影片」、「生成簡報」、「用故事說」、「WHY WHAT HOW」、「大創意」、「提出建議」、「近況更新」、「創業簡報」時使用。基於《矽谷流萬用敘事簡報法則》自動生成專業投影片風格圖片。
allowed-tools: Bash, Read
---

# 矽谷流技能

## 觸發條件
- 使用者說「矽谷流」、「故事簡報」、「做投影片」
- 使用者說「生成簡報」、「用故事說」
- 使用者說「WHY WHAT HOW」、「大創意」
- 使用者說「提出建議」、「近況更新」、「創業簡報」
- 使用者描述想要用故事方式呈現的概念

## 核心概念：矽谷流故事四大路標

```
WHY（為什麼需要改變）
├── 背景：設定場景
├── 人物：介紹關鍵角色
└── 衝突：找出挑戰

WHAT（大創意）
└── 核心訊息：一句話推動故事

HOW（如何解決）
├── 處理衝突：解決方案
└── 結局：行動呼籲
```

## 執行方式

### 步驟 1：分析使用者概念
分析使用者想表達的內容，選擇適合的簡報類型：
- **proposal**：提出建議（需要解決方案或新計畫時）
- **status_update**：近況更新（報告進度或狀態時）
- **pitch**：創業簡報（向投資人或利害關係人簡報時）

### 步驟 2：讀取知識庫
```bash
cat "$CLAUDE_PROJECT_DIR/.claude/skills/矽谷流技能/knowledge/silicon-valley-flow.json"
```

### 步驟 3：根據類型生成投影片

執行以下腳本生成投影片圖片：

```bash
node "$CLAUDE_PROJECT_DIR/.claude/skills/矽谷流技能/scripts/generate-slides.mjs" \
  --topic "使用者的概念" \
  --type "proposal|status_update|pitch" \
  --slides 5
```

**或使用現有圖片生成技能**（複用 DRY 原則）：

針對每張投影片，呼叫圖片生成技能：
```bash
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs \
  "Professional corporate presentation slide: [投影片描述]. Blue and orange accent colors, clean modern design, 16:9 aspect ratio, business presentation style" \
  --aspect 16:9 \
  --style "professional infographic"
```

## 參數說明

| 參數 | 說明 | 預設值 |
|------|------|--------|
| --topic, -t | 使用者想表達的主題 | 必填 |
| --type | 簡報類型 (proposal, status_update, pitch) | proposal |
| --slides, -s | 生成投影片數量 | 自動（依類型）|
| --lang | 語言 (zh, en) | zh |

## 投影片類型模板

### 1. 提出建議（proposal）- 5 張投影片
1. **背景與衝突**：設定場景，呈現挑戰
2. **人物與利害關係人**：介紹關鍵角色
3. **大創意**：核心訊息（用金句表達）
4. **解決方案**：三個方案支柱
5. **結局與行動呼籲**：預期成果與下一步

### 2. 近況更新（status_update）- 4 張投影片
1. **進度總覽**：時間軸與里程碑
2. **已完成項目**：達成的成就
3. **挑戰與風險**：當前挑戰
4. **下一步計畫**：後續行動

### 3. 創業簡報（pitch）- 5 張投影片
1. **問題陳述**：痛點呈現
2. **解決方案**：產品/服務展示
3. **市場機會**：TAM/SAM/SOM
4. **成績與實績**：關鍵指標
5. **募資需求**：資金用途

## 使用範例

### 範例 1：提出新專案
**使用者**：「用矽谷流幫我做一個關於擴大機師招募計畫的簡報」

**執行**：
```bash
# 讀取知識庫
cat "$CLAUDE_PROJECT_DIR/.claude/skills/矽谷流技能/knowledge/silicon-valley-flow.json"

# 生成 5 張投影片（proposal 類型）
# 投影片 1: 背景與衝突
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs \
  "Professional corporate presentation slide: Background showing airline industry growth on left, conflict showing pilot shortage crisis on right. Blue and orange accent colors, clean modern design, business infographic style. Topic: Pilot recruitment expansion plan" \
  --aspect 16:9

# 投影片 2-5... 依序生成
```

### 範例 2：近況更新
**使用者**：「幫我用矽谷流做專案進度報告」

**執行**：自動選擇 `status_update` 類型，生成 4 張投影片

### 範例 3：創業簡報
**使用者**：「用故事簡報方式做創業 pitch」

**執行**：自動選擇 `pitch` 類型，生成 5 張投影片

## 設計原則（來自矽谷流）

1. **不要傾倒數據**：圖表要有故事線
2. **衝突要明確**：清楚說明挑戰是什麼
3. **背景先行**：在開場建立脈絡
4. **大創意推動故事**：用一句話推動敘事
5. **視覺專業**：配色一致，排版清晰

## 視覺規範
- **配色**：藍色 (#0066CC) + 橘色 (#FF6600)
- **比例**：16:9 橫式投影片
- **風格**：專業商業簡報、現代簡潔
- **字體**：粗體標題、清晰層級

## 輸出格式

每張投影片輸出：
1. 投影片標題
2. 對應的矽谷流元素（WHY/WHAT/HOW）
3. 生成的圖片 URL
4. 簡短說明（講者備註）

## 環境需求
- 需要 `圖片生成技能` 已安裝並可用
- GOOGLE_CLOUD_PROJECT 環境變數
- Google Cloud 認證

## 參考資料
- 知識庫：`knowledge/silicon-valley-flow.json`
- 圖片生成技能：`$OFFICIAL_SKILLS_DIR/圖片生成技能/`
