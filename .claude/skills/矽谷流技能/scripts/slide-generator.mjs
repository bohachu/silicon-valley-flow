// ============================================================================
// slide-generator.mjs - 投影片生成器（依賴反轉原則）
// ============================================================================

import { spawn } from 'child_process';
import { IMAGE_SKILL_PATH, DEFAULTS } from './constants.mjs';

/**
 * 執行圖片生成腳本
 * @param {string} prompt - 圖片描述
 * @param {Object} options - 選項
 * @returns {Promise<Object>} 生成結果
 */
export async function generateImage(prompt, options = {}) {
  const {
    aspectRatio = DEFAULTS.aspectRatio,
    style = DEFAULTS.style,
  } = options;

  return new Promise((resolve, reject) => {
    const args = [
      IMAGE_SKILL_PATH,
      prompt,
      '--aspect', aspectRatio,
      '--style', style,
    ];

    const child = spawn('node', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      stdout += data.toString();
    });

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout,
          error: null,
        });
      } else {
        resolve({
          success: false,
          output: stdout,
          error: stderr || `程式結束代碼: ${code}`,
        });
      }
    });

    child.on('error', error => {
      reject(new Error(`無法執行圖片生成: ${error.message}`));
    });
  });
}

/**
 * 批次生成投影片
 * @param {Array<Object>} slidePrompts - 投影片 prompts 列表
 * @param {Object} options - 選項
 * @param {Function} onProgress - 進度回呼
 * @returns {Promise<Array<Object>>} 生成結果列表
 */
export async function generateSlides(slidePrompts, options = {}, onProgress = null) {
  const results = [];

  for (let i = 0; i < slidePrompts.length; i++) {
    const slide = slidePrompts[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: slidePrompts.length,
        slide: slide,
      });
    }

    try {
      const result = await generateImage(slide.prompt, options);

      results.push({
        ...slide,
        result: result,
        generated: result.success,
      });

    } catch (error) {
      results.push({
        ...slide,
        result: { success: false, error: error.message },
        generated: false,
      });
    }
  }

  return results;
}

/**
 * 解析圖片生成輸出，提取圖片 URL
 * @param {string} output - 生成腳本輸出
 * @returns {Object} 解析後的資訊
 */
export function parseImageOutput(output) {
  const urlMatch = output.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
  const sessionMatch = output.match(/Session ID: `([^`]+)`/);

  return {
    imageUrl: urlMatch ? urlMatch[1] : null,
    sessionId: sessionMatch ? sessionMatch[1] : null,
    raw: output,
  };
}
