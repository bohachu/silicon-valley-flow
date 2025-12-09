// ============================================================================
// output-formatter.mjs - 輸出格式化器
// 遵循 SOLID 原則：
// - 單一職責：只負責格式化輸出
// - 開放封閉：可擴展其他輸出格式
// ============================================================================

/**
 * 生成統計資訊區塊
 * @param {Object} params - 參數
 * @param {number} params.imageCount - 圖片數量
 * @param {string} params.aspectRatio - 長寬比
 * @param {string} [params.style] - 藝術風格
 * @param {string} [params.sessionId] - Session ID
 * @param {boolean} [params.isMultiTurn] - 是否為多輪對話
 * @returns {string}
 */
export function formatStatistics(params) {
  const { imageCount, aspectRatio, style, sessionId, isMultiTurn } = params;

  const lines = [
    '## 圖片生成結果\n',
    '**統計資訊：**',
    `- 生成數量: ${imageCount}`,
    `- 長寬比: ${aspectRatio}`,
  ];

  if (style) {
    lines.push(`- 風格: ${style}`);
  }

  if (isMultiTurn) {
    lines.push('- 模式: 多輪迭代');
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * 格式化單張圖片結果
 * @param {Object} params - 參數
 * @param {number} params.index - 圖片索引（從 0 開始）
 * @param {Object} params.image - 圖片資訊
 * @param {boolean} params.image.success - 是否成功
 * @param {string} [params.image.imageUrl] - 圖片 URL
 * @param {string} [params.image.gcsUri] - GCS URI
 * @param {string} [params.image.expiresAt] - 過期時間
 * @param {string} [params.image.error] - 錯誤訊息
 * @returns {string}
 */
export function formatImageResult(params) {
  const { index, image } = params;
  const imageNumber = index + 1;

  const lines = [`### 圖片 ${imageNumber}\n`];

  if (image.success) {
    // 只有 HTTPS URL 才顯示圖片（Markdown 格式）
    if (image.imageUrl?.startsWith('https://')) {
      lines.push(`![Generated Image ${imageNumber}](${image.imageUrl})\n`);
    }

    if (image.gcsUri) {
      lines.push(`- GCS URI: ${image.gcsUri}`);
    }

    if (image.expiresAt) {
      lines.push(`- 有效期限: ${image.expiresAt}`);
    }

    if (image.imageUrl?.startsWith('data:')) {
      lines.push('- 格式: Base64 (GCS 未設定)');
    }
  } else {
    lines.push(`錯誤: ${image.error}`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * 格式化模型文字回應
 * @param {string} textResponse - 模型回應文字
 * @returns {string}
 */
export function formatTextResponse(textResponse) {
  if (!textResponse) {
    return '';
  }

  return `**模型回應：**\n${textResponse}\n`;
}

/**
 * 格式化 Session 資訊（用於後續迭代）
 * @param {string} sessionId - Session ID
 * @returns {string}
 */
export function formatSessionInfo(sessionId) {
  if (!sessionId) {
    return '';
  }

  return [
    '',
    '---',
    '**迭代資訊：**',
    `- Session ID: \`${sessionId}\``,
    '- 如需修改此圖片，請使用 `--session` 參數',
    '',
    '範例：',
    '```bash',
    `node $HOME/.claude/skills/圖片生成技能/scripts/generate-image.mjs "修改描述" --session ${sessionId}`,
    '```',
    '',
  ].join('\n');
}

/**
 * 格式化完整輸出
 * @param {Object} params - 參數
 * @param {Array} params.images - 上傳結果陣列
 * @param {string} params.textResponse - 模型回應
 * @param {string} params.sessionId - Session ID
 * @param {string} params.aspectRatio - 長寬比
 * @param {string} [params.style] - 藝術風格
 * @param {boolean} [params.isMultiTurn] - 是否為多輪對話
 * @returns {string}
 */
export function formatFullOutput(params) {
  const {
    images,
    textResponse,
    sessionId,
    aspectRatio,
    style,
    isMultiTurn = false,
  } = params;

  const parts = [];

  // 統計資訊
  parts.push(
    formatStatistics({
      imageCount: images.length,
      aspectRatio,
      style,
      sessionId,
      isMultiTurn,
    })
  );

  // 每張圖片結果
  for (let i = 0; i < images.length; i++) {
    parts.push(formatImageResult({ index: i, image: images[i] }));
  }

  // 模型回應
  if (textResponse) {
    parts.push(formatTextResponse(textResponse));
  }

  // Session 資訊（用於後續迭代）
  parts.push(formatSessionInfo(sessionId));

  return parts.join('');
}

/**
 * 輸出到 stdout
 * @param {string} content - 輸出內容
 */
export function output(content) {
  console.log(content);
}

/**
 * 輸出錯誤訊息
 * @param {string} message - 錯誤訊息
 */
export function outputError(message) {
  console.error(`\n圖片生成失敗：${message}`);
}

/**
 * 輸出使用說明
 */
export function outputUsage() {
  console.error('請提供圖片描述');
  console.error('');
  console.error('Usage: node generate-image.mjs "prompt" [options]');
  console.error('');
  console.error('Options:');
  console.error('  --aspect, -a    長寬比 (1:1, 16:9, 9:16, 21:9 等)');
  console.error('  --style, -s     藝術風格 (photorealistic, anime, oil painting)');
  console.error('  --negative, -n  要避免的元素');
  console.error('  --temperature, -t  創意程度 (0-2)');
  console.error('  --count, -c     生成數量 (1-4)');
  console.error('  --session       Session ID（用於多輪迭代）');
  console.error('');
  console.error('Examples:');
  console.error('  node generate-image.mjs "A serene Japanese garden"');
  console.error('  node generate-image.mjs "Mountain" --aspect 16:9 --style "oil painting"');
  console.error('  node generate-image.mjs "加上彩虹" --session abc123');
}
