---
name: 圖片生成技能
description: 當使用者需要「生成圖片」、「畫一張圖」、「製作圖像」時使用。
allowed-tools: Bash
---

# 圖片生成技能

## 觸發條件
- 使用者說「生成圖片」、「畫圖」、「製作圖像」
- 使用者描述想要的圖片內容
- 需要 AI 生成圖片或插圖
- 使用者要求修改之前生成的圖片

## 執行方式

### 首次生成

執行以下腳本進行圖片生成：

```bash
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "圖片描述"
```

### 迭代修改（多輪對話）

當使用者想要修改之前生成的圖片時，使用 `--session` 參數：

```bash
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "修改描述" --session <session-id>
```

**重要：**
- Session ID 會在首次生成時輸出，請記住並在後續修改時使用
- Session 有效期為 30 分鐘
- SDK 會自動管理 Thought Signatures，確保圖片上下文正確傳遞

## 參數說明

| 參數 | 說明 | 預設值 |
|------|------|--------|
| --aspect, -a | 長寬比 (1:1, 16:9, 9:16, 21:9 等) | 1:1 |
| --style, -s | 藝術風格 (photorealistic, anime, oil painting 等) | 無 |
| --negative, -n | 要避免的元素 | 無 |
| --temperature, -t | 創意程度 (0-2) | 1.0 |
| --count, -c | 生成數量 (1-4) | 1 |
| --session | Session ID（用於多輪迭代修改） | 無 |

## 使用範例

### 基本使用

```bash
# 生成圖片
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "A serene Japanese garden with cherry blossoms"

# 指定長寬比
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "Mountain landscape" --aspect 16:9

# 指定風格
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "Portrait of a cat" --style "oil painting"

# 完整參數
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "A futuristic city" \
  --aspect 21:9 \
  --style "cyberpunk" \
  --negative "blurry, low quality" \
  --temperature 1.5
```

### 多輪迭代修改

```bash
# 1. 首次生成（會輸出 Session ID）
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "一隻可愛的橘貓"

# 輸出會包含：Session ID: abc123-def456-...

# 2. 修改圖片（使用相同 Session ID）
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "把背景改成海邊" --session abc123-def456-...

# 3. 繼續修改
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "加上太陽眼鏡" --session abc123-def456-...
```

## 輸出格式

腳本會輸出 Markdown 格式的結果：

```markdown
## 圖片生成結果

**統計資訊：**
- 生成數量: 1
- 長寬比: 16:9
- 風格: cyberpunk
- 模式: 多輪迭代（如適用）

### 圖片 1

![Generated Image 1](https://storage.googleapis.com/...)

- GCS URI: gs://bucket/path/file.png
- 有效期限: 2024-12-08T00:00:00.000Z

---
**迭代資訊：**
- Session ID: `abc123-def456-...`
- 如需修改此圖片，請使用 `--session` 參數
```

## 技術特性
- **模型**: Gemini 3 Pro Image (Vertex AI 全域端點)
- **解析度**: 固定 1K（確保穩定性）
- **儲存**: 自動上傳到 GCS
- **URL**: 7 天有效的 Signed URL
- **多輪對話**: 支援 Thought Signatures 自動管理
- **Session TTL**: 30 分鐘

## 架構設計

技能腳本採用 SOLID 原則重構：

```
scripts/
├── constants.mjs          # 常數定義
├── utils.mjs              # 通用工具函式
├── image-session-manager.mjs  # Session 管理
├── gemini-image-client.mjs    # Gemini API 客戶端
├── gcs-uploader.mjs       # GCS 上傳器
├── output-formatter.mjs   # 輸出格式化
└── generate-image.mjs     # 主程式入口
```

## 環境需求
- GOOGLE_CLOUD_PROJECT（預設: botrun-c）
- GCS_BUCKET（可選，無則回傳 base64）
- USER_ID（用於 GCS 路徑）
- SESSION_DIR（可選，預設 /tmp/image-sessions）
- Google Cloud 認證（gcloud auth）

## 範例對話

**使用者**：「幫我畫一張櫻花樹下的日式庭園」

**執行**：
```bash
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "A serene Japanese garden with cherry blossoms, traditional stone lantern, koi pond reflection" --style "photorealistic" --aspect 16:9
```

**使用者**：「把天空改成日落」

**執行**（使用上一次的 Session ID）：
```bash
node $OFFICIAL_SKILLS_DIR/圖片生成技能/scripts/generate-image.mjs "把天空改成日落" --session <上一次輸出的 session-id>
```
