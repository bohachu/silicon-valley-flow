#!/usr/bin/env node
// ============================================================================
// generate-slides.mjs - 矽谷流投影片生成主程式
//
// 將使用者概念轉換成矽谷流風格的投影片圖片
//
// Usage:
//   node generate-slides.mjs --topic "主題" --type proposal
//   node generate-slides.mjs -t "進度報告" --type status_update
//
// 環境變數:
//   OFFICIAL_SKILLS_DIR - 圖片生成技能路徑
//   GOOGLE_CLOUD_PROJECT, GCS_BUCKET, USER_ID
// ============================================================================

import { DEFAULTS, PRESENTATION_TYPES } from './constants.mjs';
import { getPresentationType } from './knowledge-loader.mjs';
import { buildAllSlidePrompts } from './prompt-builder.mjs';
import { generateSlides } from './slide-generator.mjs';
import {
  formatFullOutput,
  formatProgress,
  formatUsage,
  output,
  outputError,
} from './output-formatter.mjs';

// ============================================================================
// 參數解析
// ============================================================================

function parseArgs(args) {
  const params = {
    topic: null,
    type: DEFAULTS.type,
    slides: null,
    lang: DEFAULTS.lang,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--topic':
      case '-t':
        params.topic = args[++i];
        break;
      case '--type':
        params.type = args[++i];
        break;
      case '--slides':
      case '-s':
        params.slides = parseInt(args[++i], 10);
        break;
      case '--lang':
        params.lang = args[++i];
        break;
      case '--help':
      case '-h':
        params.help = true;
        break;
      default:
        // 如果是第一個無標記參數，視為 topic
        if (!arg.startsWith('-') && !params.topic) {
          params.topic = arg;
        }
    }
  }

  return params;
}

function validateParams(params) {
  if (params.help) {
    return; // help 模式不需要驗證
  }

  if (!params.topic) {
    throw new Error('請提供主題 (--topic)');
  }

  if (!PRESENTATION_TYPES.includes(params.type)) {
    throw new Error(`無效的簡報類型: ${params.type}。可用類型: ${PRESENTATION_TYPES.join(', ')}`);
  }

  if (params.slides && (params.slides < 1 || params.slides > 10)) {
    throw new Error('投影片數量必須在 1-10 之間');
  }
}

// ============================================================================
// 主程式
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // 解析參數
  const params = parseArgs(args);

  // 顯示說明
  if (params.help || args.length === 0) {
    output(formatUsage());
    process.exit(0);
  }

  // 驗證參數
  try {
    validateParams(params);
  } catch (error) {
    outputError(error.message);
    output('\n' + formatUsage());
    process.exit(1);
  }

  try {
    // 1. 取得簡報類型模板
    output(`📚 載入簡報模板：${params.type}...`);
    const presentationType = await getPresentationType(params.type);

    // 2. 建構所有投影片的 prompts
    output(`📝 分析主題並建構投影片結構...`);
    const slidePrompts = buildAllSlidePrompts(presentationType, params.topic, {
      lang: params.lang,
      maxSlides: params.slides,
    });

    output(`🎨 準備生成 ${slidePrompts.length} 張投影片...\n`);

    // 3. 生成投影片
    const results = await generateSlides(
      slidePrompts,
      {
        aspectRatio: DEFAULTS.aspectRatio,
        style: DEFAULTS.style,
      },
      progress => {
        output(formatProgress(progress));
      }
    );

    // 4. 格式化輸出
    output('\n');
    const formattedOutput = formatFullOutput({
      slides: results,
      presentationType,
      topic: params.topic,
      options: params,
    });

    output(formattedOutput);

  } catch (error) {
    outputError(error.message);
    process.exit(1);
  }
}

main();
