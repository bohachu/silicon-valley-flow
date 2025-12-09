// ============================================================================
// knowledge-loader.mjs - 矽谷流知識庫載入器（單一職責原則）
// ============================================================================

import { readFile } from 'fs/promises';
import { KNOWLEDGE_PATH } from './constants.mjs';

let cachedKnowledge = null;

/**
 * 載入矽谷流知識庫
 * @returns {Promise<Object>} 知識庫物件
 */
export async function loadKnowledge() {
  if (cachedKnowledge) {
    return cachedKnowledge;
  }

  try {
    const data = await readFile(KNOWLEDGE_PATH, 'utf-8');
    cachedKnowledge = JSON.parse(data);
    return cachedKnowledge;
  } catch (error) {
    throw new Error(`無法載入知識庫: ${error.message}`);
  }
}

/**
 * 根據類型取得簡報模板
 * @param {string} type - 簡報類型 (proposal, status_update, pitch)
 * @returns {Promise<Object>} 簡報模板
 */
export async function getPresentationType(type) {
  const knowledge = await loadKnowledge();
  const presentationType = knowledge.presentation_types.find(pt => pt.id === type);

  if (!presentationType) {
    throw new Error(`找不到簡報類型: ${type}。可用類型: ${knowledge.presentation_types.map(pt => pt.id).join(', ')}`);
  }

  return presentationType;
}

/**
 * 取得所有簡報類型
 * @returns {Promise<Array>} 簡報類型列表
 */
export async function getAllPresentationTypes() {
  const knowledge = await loadKnowledge();
  return knowledge.presentation_types;
}

/**
 * 取得設計原則
 * @returns {Promise<Object>} 設計原則
 */
export async function getDesignPrinciples() {
  const knowledge = await loadKnowledge();
  return knowledge.design_principles;
}

/**
 * 取得核心架構說明
 * @returns {Promise<Object>} 故事四大路標架構
 */
export async function getCoreFramework() {
  const knowledge = await loadKnowledge();
  return knowledge.core_framework;
}

/**
 * 取得 prompt 工程設定
 * @returns {Promise<Object>} prompt 工程設定
 */
export async function getPromptEngineering() {
  const knowledge = await loadKnowledge();
  return knowledge.prompt_engineering;
}
