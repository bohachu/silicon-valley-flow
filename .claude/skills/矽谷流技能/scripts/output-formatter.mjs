// ============================================================================
// output-formatter.mjs - 輸出格式化（單一職責原則）
// ============================================================================

import { buildSpeakerNotes } from './prompt-builder.mjs';

/**
 * 格式化單張投影片輸出
 * @param {Object} slide - 投影片資訊
 * @param {string} topic - 主題
 * @returns {string} Markdown 格式輸出
 */
export function formatSlideOutput(slide, topic) {
  const { order, title, framework_element, result } = slide;

  let output = `### 投影片 ${order}：${title}\n\n`;
  output += `**矽谷流元素**：${framework_element}\n\n`;

  if (result && result.success) {
    output += result.output;
  } else {
    output += `⚠️ 生成失敗：${result?.error || '未知錯誤'}\n`;
  }

  output += `\n**講者備註**：${buildSpeakerNotes(slide, topic)}\n`;
  output += '\n---\n';

  return output;
}

/**
 * 格式化完整簡報輸出
 * @param {Object} params - 參數
 * @returns {string} Markdown 格式完整輸出
 */
export function formatFullOutput(params) {
  const { slides, presentationType, topic, options } = params;

  let output = `## 矽谷流投影片生成結果\n\n`;
  output += `**主題**：${topic}\n`;
  output += `**簡報類型**：${presentationType.name}（${presentationType.description}）\n`;
  output += `**生成數量**：${slides.length} 張投影片\n\n`;
  output += `### 故事架構：WHY → WHAT → HOW\n\n`;
  output += '---\n\n';

  // 輸出每張投影片
  for (const slide of slides) {
    output += formatSlideOutput(slide, topic);
  }

  // 統計
  const successCount = slides.filter(s => s.generated).length;
  output += `\n## 生成統計\n\n`;
  output += `- 成功：${successCount}/${slides.length}\n`;
  output += `- 失敗：${slides.length - successCount}/${slides.length}\n`;

  // 使用提示
  output += `\n## 使用建議\n\n`;
  output += `1. 依照投影片順序進行簡報\n`;
  output += `2. 參考講者備註準備口語內容\n`;
  output += `3. 記得強調大創意（WHAT）的核心訊息\n`;

  return output;
}

/**
 * 格式化進度輸出
 * @param {Object} progress - 進度資訊
 * @returns {string} 進度訊息
 */
export function formatProgress(progress) {
  return `正在生成投影片 ${progress.current}/${progress.total}：${progress.slide.title}...`;
}

/**
 * 格式化錯誤輸出
 * @param {string} message - 錯誤訊息
 * @returns {string} 格式化的錯誤訊息
 */
export function formatError(message) {
  return `❌ 錯誤：${message}`;
}

/**
 * 格式化使用說明
 * @returns {string} 使用說明
 */
export function formatUsage() {
  return `
## 矽谷流投影片生成技能

### 用法
node generate-slides.mjs --topic "主題" [選項]

### 選項
  --topic, -t    使用者想表達的主題（必填）
  --type         簡報類型: proposal, status_update, pitch（預設: proposal）
  --slides, -s   生成投影片數量（預設: 依類型自動決定）
  --lang         語言: zh, en（預設: zh）
  --help, -h     顯示此說明

### 範例
  node generate-slides.mjs --topic "擴大機師招募計畫" --type proposal
  node generate-slides.mjs -t "專案進度報告" --type status_update
  node generate-slides.mjs -t "創業融資" --type pitch --slides 5
`.trim();
}

/**
 * 輸出到 stdout
 * @param {string} message - 訊息
 */
export function output(message) {
  console.log(message);
}

/**
 * 輸出錯誤到 stderr
 * @param {string} message - 錯誤訊息
 */
export function outputError(message) {
  console.error(formatError(message));
}
