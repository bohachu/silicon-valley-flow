// ============================================================================
// image-session-manager.mjs - Gemini Chat Session 管理器
// 遵循 SOLID 原則：
// - 單一職責：只負責 session 的儲存和讀取
// - 開放封閉：可擴展儲存後端（檔案、Redis 等）
// ============================================================================

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { SESSION_DIR, SESSION_TTL_MS } from './constants.mjs';
import { log, generateSessionId } from './utils.mjs';

/**
 * Session 資料結構
 * @typedef {Object} ImageSession
 * @property {string} id - Session ID
 * @property {Array} history - Gemini Chat 歷史（含 Thought Signatures）
 * @property {number} createdAt - 建立時間戳
 * @property {number} lastUsedAt - 最後使用時間戳
 * @property {Object} metadata - 額外資訊
 */

/**
 * 確保 session 目錄存在
 */
async function ensureSessionDir() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * 取得 session 檔案路徑
 * @param {string} sessionId - Session ID
 * @returns {string} 檔案路徑
 */
function getSessionPath(sessionId) {
  // 安全性：只允許 UUID 格式
  const safeId = sessionId.replace(/[^a-zA-Z0-9-]/g, '');
  return join(SESSION_DIR, `${safeId}.json`);
}

/**
 * 建立新的 session
 * @param {Object} options - 選項
 * @param {string} [options.id] - 自訂 session ID
 * @param {Object} [options.metadata] - 額外資訊
 * @returns {Promise<ImageSession>} 新建立的 session
 */
export async function createSession(options = {}) {
  await ensureSessionDir();

  const session = {
    id: options.id || generateSessionId(),
    history: [],
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    metadata: options.metadata || {},
  };

  await saveSession(session);
  log(`建立新 session: ${session.id}`);

  return session;
}

/**
 * 儲存 session
 * @param {ImageSession} session - Session 資料
 * @returns {Promise<void>}
 */
export async function saveSession(session) {
  await ensureSessionDir();

  const path = getSessionPath(session.id);
  session.lastUsedAt = Date.now();

  await fs.writeFile(path, JSON.stringify(session, null, 2), 'utf-8');
  log(`儲存 session: ${session.id}`);
}

/**
 * 讀取 session
 * @param {string} sessionId - Session ID
 * @returns {Promise<ImageSession|null>} Session 資料，不存在或過期則返回 null
 */
export async function loadSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  try {
    const path = getSessionPath(sessionId);
    const data = await fs.readFile(path, 'utf-8');
    const session = JSON.parse(data);

    // 檢查 TTL
    const age = Date.now() - session.lastUsedAt;
    if (age > SESSION_TTL_MS) {
      log(`Session ${sessionId} 已過期 (${Math.round(age / 60000)} 分鐘)`);
      await deleteSession(sessionId);
      return null;
    }

    log(`載入 session: ${sessionId} (歷史記錄: ${session.history.length} 筆)`);
    return session;
  } catch (error) {
    if (error.code === 'ENOENT') {
      log(`Session ${sessionId} 不存在`);
      return null;
    }
    throw error;
  }
}

/**
 * 更新 session 歷史
 * @param {string} sessionId - Session ID
 * @param {Object} userMessage - 使用者訊息
 * @param {Object} modelResponse - 模型回應（含 Thought Signature）
 * @returns {Promise<ImageSession>} 更新後的 session
 */
export async function updateSessionHistory(sessionId, userMessage, modelResponse) {
  let session = await loadSession(sessionId);

  if (!session) {
    session = await createSession({ id: sessionId });
  }

  // 添加使用者訊息
  session.history.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // 添加模型回應（包含完整的 parts，可能含 Thought Signature）
  session.history.push({
    role: 'model',
    parts: modelResponse.parts || [{ text: modelResponse.text || '' }],
  });

  await saveSession(session);
  return session;
}

/**
 * 刪除 session
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} 是否成功刪除
 */
export async function deleteSession(sessionId) {
  try {
    const path = getSessionPath(sessionId);
    await fs.unlink(path);
    log(`刪除 session: ${sessionId}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * 清理過期的 sessions
 * @returns {Promise<number>} 清理的 session 數量
 */
export async function cleanupExpiredSessions() {
  await ensureSessionDir();

  let cleanedCount = 0;

  try {
    const files = await fs.readdir(SESSION_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const path = join(SESSION_DIR, file);
        const data = await fs.readFile(path, 'utf-8');
        const session = JSON.parse(data);

        const age = Date.now() - session.lastUsedAt;
        if (age > SESSION_TTL_MS) {
          await fs.unlink(path);
          cleanedCount++;
        }
      } catch (e) {
        // 忽略單一檔案錯誤
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log('清理過期 sessions 失敗:', error.message);
    }
  }

  if (cleanedCount > 0) {
    log(`清理了 ${cleanedCount} 個過期 sessions`);
  }

  return cleanedCount;
}

/**
 * 取得 session 歷史（用於傳遞給 Gemini Chat）
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} 對話歷史陣列
 */
export async function getSessionHistory(sessionId) {
  const session = await loadSession(sessionId);
  return session?.history || [];
}
