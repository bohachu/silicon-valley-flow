# YouTube 內容擷取技能

## 觸發條件
- 使用者提供 YouTube 連結並想了解內容
- 使用者說「YouTube」、「YT」、「影片內容」
- 使用者說「擷取影片」、「影片字幕」、「影片摘要」
- 使用者想根據 YouTube 影片製作簡報或內容

## 功能說明
自動擷取 YouTube 影片的：
1. **標題與描述**：影片基本資訊
2. **字幕/轉錄**：完整的影片文字內容
3. **Metadata**：作者、時長、觀看次數等

## 執行方式

### 步驟 1：擷取 YouTube 內容

執行以下腳本：

```bash
node "$CLAUDE_PROJECT_DIR/.claude/skills/YouTube內容擷取技能/scripts/extract-youtube.mjs" "YouTube URL"
```

**參數說明**：
- 第一個參數：YouTube URL 或 Video ID
- `--json`：輸出 JSON 格式（可選）

### 步驟 2：分析內容

根據擷取的內容，分析影片的：
- 主題與核心訊息
- 關鍵論點
- 重要段落

### 步驟 3：整合其他技能（可選）

可以將擷取的內容傳給其他技能處理：
- **矽谷流技能**：製作投影片
- **圖片生成技能**：生成相關圖片

## 使用範例

### 範例 1：擷取影片內容
**使用者**：「幫我看看這個影片在講什麼 https://www.youtube.com/watch?v=xxxxx」

**執行**：
```bash
node "$CLAUDE_PROJECT_DIR/.claude/skills/YouTube內容擷取技能/scripts/extract-youtube.mjs" "https://www.youtube.com/watch?v=xxxxx"
```

### 範例 2：根據影片製作簡報
**使用者**：「用矽谷流幫我製作這個 https://www.youtube.com/watch?v=xxxxx」

**執行**：
1. 先用本技能擷取影片內容
2. 分析內容，找出 WHY/WHAT/HOW
3. 呼叫矽谷流技能生成投影片

### 範例 3：JSON 格式輸出
```bash
node "$CLAUDE_PROJECT_DIR/.claude/skills/YouTube內容擷取技能/scripts/extract-youtube.mjs" "VIDEO_ID" --json
```

## 輸出格式

### 文字格式（預設）
```
========== YouTube 影片內容 ==========

📹 標題: 影片標題
👤 作者: 頻道名稱
⏱️ 時長: 10:30
👁️ 觀看次數: 1,234,567
📅 發布日期: 2025-01-15

📝 描述:
影片描述內容...

🏷️ 關鍵字: keyword1, keyword2, keyword3

========== 字幕內容 ==========

完整的字幕文字...
```

### JSON 格式
```json
{
  "videoId": "xxxxx",
  "url": "https://www.youtube.com/watch?v=xxxxx",
  "metadata": {
    "title": "影片標題",
    "description": "描述",
    "author": "作者",
    "duration": 630,
    "viewCount": 1234567,
    "publishDate": "2025-01-15"
  },
  "transcript": {
    "fullText": "完整字幕文字",
    "segments": [
      { "text": "段落文字", "start": 0, "duration": 5 }
    ]
  }
}
```

## 注意事項

1. **字幕可用性**：並非所有影片都有字幕，無字幕影片只能取得 metadata
2. **私人影片**：無法擷取私人或年齡限制影片
3. **速率限制**：避免短時間內大量請求
4. **套件維護**：使用 @distube/ytdl-core（持續維護版本）

## 依賴套件
- @distube/ytdl-core：影片 metadata 擷取
- @danielxceron/youtube-transcript：字幕擷取

## 環境需求
- Node.js 18+
- 網路連線
