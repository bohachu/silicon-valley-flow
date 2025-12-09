// ============================================================================
// gcs-uploader.mjs - GCS 圖片上傳器
// 遵循 SOLID 原則：
// - 單一職責：只負責 GCS 上傳操作
// - 開放封閉：可擴展其他儲存後端
// ============================================================================

import { Storage } from '@google-cloud/storage';
import {
  GCS_BUCKET,
  GCS_AVAILABLE,
  SIGNED_URL_EXPIRY_DAYS,
  USER_ID,
} from './constants.mjs';
import { log, generateFilename } from './utils.mjs';

// ============================================================================
// 初始化
// ============================================================================

let storage = null;

/**
 * 初始化 GCS 客戶端
 * @returns {Storage|null}
 */
export function initializeStorage() {
  if (storage) {
    return storage;
  }

  if (!GCS_AVAILABLE) {
    log('GCS_BUCKET 未設定，將使用 base64 輸出');
    return null;
  }

  try {
    storage = new Storage();
    log('GCS 初始化成功:', GCS_BUCKET);
    return storage;
  } catch (error) {
    log('GCS 初始化失敗:', error.message);
    return null;
  }
}

/**
 * 檢查 GCS 是否可用
 * @returns {boolean}
 */
export function isStorageAvailable() {
  return GCS_AVAILABLE && storage !== null;
}

// ============================================================================
// 上傳操作
// ============================================================================

/**
 * 上傳結果
 * @typedef {Object} UploadResult
 * @property {boolean} success - 是否成功
 * @property {string} imageUrl - 圖片 URL（Signed URL 或 base64）
 * @property {string} [gcsUri] - GCS URI
 * @property {string} filename - 檔案名稱
 * @property {string} mimeType - MIME 類型
 * @property {string} [expiresAt] - Signed URL 過期時間
 * @property {string} [error] - 錯誤訊息
 */

/**
 * 上傳圖片到 GCS
 * @param {Object} params - 上傳參數
 * @param {string} params.data - Base64 編碼的圖片資料
 * @param {number} [params.index] - 圖片索引
 * @param {Object} [params.metadata] - 額外的 metadata
 * @returns {Promise<UploadResult>}
 */
export async function uploadImage(params) {
  const { data, index = 0, metadata = {} } = params;

  const filename = generateFilename(index);

  // 如果 GCS 不可用，返回 base64
  if (!isStorageAvailable()) {
    return {
      success: true,
      imageUrl: `data:image/png;base64,${data}`,
      filename,
      mimeType: 'image/png',
    };
  }

  try {
    const gcsPath = `${USER_ID}/generated-images/${filename}`;
    const bucket = storage.bucket(GCS_BUCKET);
    const file = bucket.file(gcsPath);

    // 上傳圖片（確保是 binary 而非 text）
    await file.save(Buffer.from(data, 'base64'), {
      contentType: 'image/png',
      metadata: {
        ...metadata,
        generatedAt: new Date().toISOString(),
      },
    });

    // 設定 customTime（用於 Lifecycle Policy）
    try {
      await file.setMetadata({ customTime: new Date().toISOString() });
    } catch (e) {
      // 非關鍵錯誤，忽略
    }

    // 生成 Signed URL
    const signedUrlResult = await generateSignedUrl(file, gcsPath);

    return {
      success: true,
      imageUrl: signedUrlResult.url,
      gcsUri: `gs://${GCS_BUCKET}/${gcsPath}`,
      filename,
      mimeType: 'image/png',
      expiresAt: signedUrlResult.expiresAt,
    };
  } catch (error) {
    log('GCS 上傳失敗，回傳 base64:', error.message);

    return {
      success: true,
      imageUrl: `data:image/png;base64,${data}`,
      filename,
      mimeType: 'image/png',
      error: `GCS 上傳失敗: ${error.message}`,
    };
  }
}

/**
 * 生成 Signed URL
 * @param {File} file - GCS 檔案物件
 * @param {string} gcsPath - GCS 路徑
 * @returns {Promise<{url: string, expiresAt: string}>}
 */
async function generateSignedUrl(file, gcsPath) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SIGNED_URL_EXPIRY_DAYS);

  try {
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt,
    });

    log(`圖片已上傳: ${gcsPath}`);

    return {
      url: signedUrl,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (signError) {
    // Signed URL 失敗（可能是本地環境無權限）
    log('Signed URL 生成失敗，使用公開 URL:', signError.message);

    return {
      url: `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`,
      expiresAt: undefined,
    };
  }
}

/**
 * 批次上傳多張圖片
 * @param {Array<{data: string, mimeType: string}>} images - 圖片陣列
 * @param {Object} [metadata] - 共用的 metadata
 * @returns {Promise<UploadResult[]>}
 */
export async function uploadImages(images, metadata = {}) {
  const results = [];

  for (let i = 0; i < images.length; i++) {
    const result = await uploadImage({
      data: images[i].data,
      index: i,
      metadata,
    });
    results.push(result);
  }

  return results;
}

// 初始化
initializeStorage();
