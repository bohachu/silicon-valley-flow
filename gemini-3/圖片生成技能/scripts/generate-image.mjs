#!/usr/bin/env node
// ============================================================================
// generate-image.mjs - 圖片生成技能主程式（重構版）
// 支援多輪對話迭代（Thought Signatures 由 SDK 自動管理）
//
// Usage:
//   node generate-image.mjs "prompt" [options]
//   node generate-image.mjs "修改描述" --session <session-id>
//
// 環境變數:
//   GOOGLE_CLOUD_PROJECT, GCS_BUCKET, USER_ID
// ============================================================================

import { parseArgs, validateParams, log } from './utils.mjs';
import { generateImage, initializeClient, isClientAvailable } from './gemini-image-client.mjs';
import { uploadImages } from './gcs-uploader.mjs';
import { formatFullOutput, output, outputError, outputUsage } from './output-formatter.mjs';
import { cleanupExpiredSessions, loadSession } from './image-session-manager.mjs';

// ============================================================================
// 主程式
// ============================================================================

async function main() {
  // 初始化客戶端
  initializeClient();

  // 背景清理過期 sessions（不等待）
  cleanupExpiredSessions().catch(() => {});

  // 解析參數
  const args = process.argv.slice(2);

  if (args.length === 0) {
    outputUsage();
    process.exit(1);
  }

  const params = parseArgs(args);

  // 驗證參數
  try {
    validateParams(params);
  } catch (error) {
    outputError(error.message);
    process.exit(1);
  }

  // 檢查客戶端
  if (!isClientAvailable()) {
    outputError('Vertex AI 未初始化，請檢查 Google Cloud 認證');
    process.exit(1);
  }

  // 檢查是否為多輪對話
  const isMultiTurn = !!params.session;
  if (isMultiTurn) {
    const existingSession = await loadSession(params.session);
    if (!existingSession) {
      log(`警告: Session ${params.session} 不存在或已過期，將建立新 session`);
    }
  }

  try {
    // 生成圖片
    const result = await generateImage({
      prompt: params.prompt,
      sessionId: params.session,
      aspectRatio: params.aspectRatio,
      numberOfImages: params.count,
      temperature: params.temperature,
      negativePrompt: params.negativePrompt,
      style: params.style,
    });

    // 上傳到 GCS
    const uploadedImages = await uploadImages(result.images, {
      prompt: params.prompt.substring(0, 500),
      aspectRatio: params.aspectRatio,
      style: params.style,
      sessionId: result.sessionId,
    });

    // 格式化並輸出結果
    const formattedOutput = formatFullOutput({
      images: uploadedImages,
      textResponse: result.textResponse,
      sessionId: result.sessionId,
      aspectRatio: params.aspectRatio,
      style: params.style,
      isMultiTurn,
    });

    output(formattedOutput);

  } catch (error) {
    outputError(error.message);
    log('詳細錯誤:', error);
    process.exit(1);
  }
}

main();
