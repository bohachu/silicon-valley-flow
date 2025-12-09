// ============================================================================
// utils.mjs - 通用工具函式
// 遵循 SOLID 原則：單一職責 - 只負責通用工具
// ============================================================================

import { randomUUID } from 'crypto';

/**
 * 日誌輸出（輸出到 stderr，避免污染 stdout）
 * @param {...any} args - 日誌內容
 */
export function log(...args) {
  console.error('[Image-Generator]', ...args);
}

/**
 * 生成唯一的 Session ID
 * @returns {string} UUID 格式的 session ID
 */
export function generateSessionId() {
  return randomUUID();
}

/**
 * 生成唯一的檔案名稱
 * @param {number} index - 圖片索引
 * @returns {string} 唯一檔案名稱
 */
export function generateFilename(index = 0) {
  const timestamp = Date.now();
  const uuid = randomUUID().substring(0, 8);
  return `generated-${timestamp}-${uuid}-${index}.png`;
}

/**
 * 解析命令列參數
 * @param {string[]} args - 命令列參數陣列
 * @returns {Object} 解析後的參數物件
 */
export function parseArgs(args) {
  const result = {
    prompt: null,
    aspectRatio: '1:1',
    style: null,
    negativePrompt: null,
    temperature: 1.0,
    count: 1,
    session: null, // 新增：session ID 用於多輪對話
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--aspect' || arg === '-a') {
      result.aspectRatio = args[++i];
    } else if (arg === '--style' || arg === '-s') {
      result.style = args[++i];
    } else if (arg === '--negative' || arg === '-n') {
      result.negativePrompt = args[++i];
    } else if (arg === '--temperature' || arg === '-t') {
      result.temperature = parseFloat(args[++i]);
    } else if (arg === '--count' || arg === '-c') {
      result.count = parseInt(args[++i], 10);
    } else if (arg === '--session') {
      result.session = args[++i];
    } else if (!arg.startsWith('-') && !result.prompt) {
      result.prompt = arg;
    }
  }

  return result;
}

/**
 * 建構完整的 prompt（包含風格和負面提示）
 * @param {string} basePrompt - 基礎 prompt
 * @param {Object} options - 選項
 * @param {string} [options.style] - 藝術風格
 * @param {string} [options.negativePrompt] - 負面提示
 * @returns {string} 完整的 prompt
 */
export function buildFullPrompt(basePrompt, options = {}) {
  const { style, negativePrompt } = options;

  let fullPrompt = basePrompt;

  if (style) {
    fullPrompt = `${style} style: ${fullPrompt}`;
  }

  if (negativePrompt) {
    fullPrompt = `${fullPrompt}. Avoid: ${negativePrompt}`;
  }

  return fullPrompt;
}

/**
 * 驗證參數有效性
 * @param {Object} params - 參數物件
 * @throws {Error} 如果參數無效
 */
export function validateParams(params) {
  if (!params.prompt) {
    throw new Error('請提供圖片描述');
  }

  if (params.temperature < 0 || params.temperature > 2) {
    throw new Error('temperature 必須在 0 到 2 之間');
  }

  if (params.count < 1 || params.count > 4) {
    throw new Error('count 必須在 1 到 4 之間');
  }
}
