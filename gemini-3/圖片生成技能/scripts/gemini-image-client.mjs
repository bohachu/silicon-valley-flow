// ============================================================================
// gemini-image-client.mjs - Gemini 3 Pro Image 客戶端
// 遵循 SOLID 原則：
// - 單一職責：只負責與 Gemini API 互動
// - 依賴反轉：依賴抽象的 session manager
// ============================================================================

import { GoogleGenAI, Modality } from '@google/genai';
import {
  GOOGLE_CLOUD_PROJECT,
  VERTEX_AI_LOCATION,
  GEMINI_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_SAFETY_LEVEL,
  DEFAULT_PERSON_GENERATION,
  SAFETY_CATEGORIES,
} from './constants.mjs';
import { log, buildFullPrompt } from './utils.mjs';
import {
  loadSession,
  createSession,
  updateSessionHistory,
  getSessionHistory,
} from './image-session-manager.mjs';

// ============================================================================
// 客戶端初始化
// ============================================================================

let genaiClient = null;

/**
 * 初始化 Gemini 客戶端
 * @returns {GoogleGenAI|null}
 */
export function initializeClient() {
  if (genaiClient) {
    return genaiClient;
  }

  try {
    genaiClient = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: VERTEX_AI_LOCATION,
    });
    log('Vertex AI 初始化成功');
    return genaiClient;
  } catch (error) {
    log('Vertex AI 初始化失敗:', error.message);
    return null;
  }
}

/**
 * 取得客戶端實例
 * @returns {GoogleGenAI}
 * @throws {Error} 如果客戶端未初始化
 */
export function getClient() {
  if (!genaiClient) {
    initializeClient();
  }

  if (!genaiClient) {
    throw new Error('Vertex AI 未初始化，請檢查 Google Cloud 認證');
  }

  return genaiClient;
}

// ============================================================================
// 圖片生成
// ============================================================================

/**
 * 生成圖片結果
 * @typedef {Object} GenerateImageResult
 * @property {Array<{data: string, mimeType: string}>} images - 生成的圖片陣列
 * @property {string} textResponse - 模型的文字回應
 * @property {string} sessionId - Session ID（用於後續迭代）
 * @property {Object} modelResponse - 完整的模型回應（含 Thought Signature）
 */

/**
 * 建立安全設定
 * @param {string} safetyLevel - 安全等級
 * @returns {Array} 安全設定陣列
 */
function buildSafetySettings(safetyLevel = DEFAULT_SAFETY_LEVEL) {
  return SAFETY_CATEGORIES.map((category) => ({
    category,
    threshold: safetyLevel,
  }));
}

/**
 * 建立生成設定
 * @param {Object} params - 參數
 * @returns {Object} 生成設定
 */
function buildGenerateConfig(params) {
  const {
    aspectRatio = '1:1',
    temperature = DEFAULT_TEMPERATURE,
    personGeneration = DEFAULT_PERSON_GENERATION,
    safetyLevel = DEFAULT_SAFETY_LEVEL,
  } = params;

  const config = {
    responseModalities: [Modality.TEXT, Modality.IMAGE],
    temperature,
    imageConfig: {
      aspectRatio,
      imageSize: DEFAULT_IMAGE_SIZE,
    },
    safetySettings: buildSafetySettings(safetyLevel),
  };

  if (personGeneration !== 'allow_adult') {
    config.personGeneration = personGeneration;
  }

  return config;
}

/**
 * 生成圖片（支援多輪對話）
 * @param {Object} params - 生成參數
 * @param {string} params.prompt - 圖片描述
 * @param {string} [params.sessionId] - 既有的 session ID（用於迭代）
 * @param {string} [params.aspectRatio] - 長寬比
 * @param {string} [params.style] - 藝術風格
 * @param {string} [params.negativePrompt] - 負面提示
 * @param {number} [params.temperature] - 創意程度
 * @param {number} [params.numberOfImages] - 生成數量
 * @returns {Promise<GenerateImageResult>} 生成結果
 */
export async function generateImage(params) {
  const {
    prompt,
    sessionId,
    aspectRatio = '1:1',
    numberOfImages = 1,
    style,
    negativePrompt,
    temperature = DEFAULT_TEMPERATURE,
  } = params;

  const client = getClient();

  // 建構完整 prompt
  const fullPrompt = buildFullPrompt(prompt, { style, negativePrompt });

  log(`生成中: "${prompt.substring(0, 50)}..."`);
  log(`參數: aspect=${aspectRatio}, style=${style || '無'}, temp=${temperature}`);

  // 檢查是否為多輪對話
  const existingSession = sessionId ? await loadSession(sessionId) : null;
  const isMultiTurn = !!existingSession;

  if (isMultiTurn) {
    log(`多輪對話模式: session=${sessionId}, 歷史=${existingSession.history.length}筆`);
  }

  // 建立生成設定
  const config = buildGenerateConfig({
    aspectRatio,
    temperature,
  });

  // 執行生成
  let response;
  let currentSessionId = sessionId;

  if (isMultiTurn) {
    // 多輪對話：使用 Chat API
    response = await generateWithChat(client, existingSession.history, fullPrompt, config);
  } else {
    // 首次生成：使用串流 API
    response = await generateWithStream(client, fullPrompt, config, numberOfImages);
    // 建立新 session
    const newSession = await createSession();
    currentSessionId = newSession.id;
  }

  // 更新 session 歷史
  if (response.images.length > 0) {
    await updateSessionHistory(currentSessionId, fullPrompt, response.modelResponse);
  }

  return {
    images: response.images,
    textResponse: response.textResponse,
    sessionId: currentSessionId,
    modelResponse: response.modelResponse,
  };
}

/**
 * 使用 Chat API 生成（多輪對話）
 * SDK 自動管理 Thought Signatures
 *
 * @google/genai SDK 正確格式：
 * - sendMessage({ message: "..." }) 而非 sendMessage(string)
 * - 參考文件: https://googleapis.github.io/js-genai/release_docs/classes/chats.Chat.html
 */
async function generateWithChat(client, history, prompt, config) {
  const chat = client.chats.create({
    model: GEMINI_MODEL,
    history: history,
    config: config,
  });

  // 修正：使用物件格式 { message: prompt } 而非直接傳入字串
  const response = await chat.sendMessage({ message: prompt });

  const images = [];
  let textResponse = '';

  // 處理回應
  if (response.candidates && response.candidates[0]) {
    const candidate = response.candidates[0];

    for (const part of candidate.content.parts || []) {
      if (part.text) {
        textResponse += part.text;
      }
      if (part.inlineData) {
        images.push({
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        });
      }
    }

    return {
      images,
      textResponse,
      modelResponse: candidate.content,
    };
  }

  return {
    images: [],
    textResponse: '',
    modelResponse: { parts: [] },
  };
}

/**
 * 使用串流 API 生成（首次生成）
 */
async function generateWithStream(client, prompt, config, numberOfImages) {
  const response = await client.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: prompt,
    config,
  });

  const images = [];
  let textResponse = '';
  const parts = [];

  // 處理串流回應
  for await (const chunk of response) {
    if (chunk.text) {
      textResponse += chunk.text;
      parts.push({ text: chunk.text });
    }

    if (chunk.data) {
      images.push({
        data: chunk.data,
        mimeType: 'image/png',
      });
      parts.push({
        inlineData: {
          data: chunk.data,
          mimeType: 'image/png',
        },
      });

      if (images.length >= numberOfImages) break;
    }
  }

  return {
    images,
    textResponse,
    modelResponse: { role: 'model', parts },
  };
}

/**
 * 驗證客戶端是否可用
 * @returns {boolean}
 */
export function isClientAvailable() {
  try {
    getClient();
    return true;
  } catch {
    return false;
  }
}
