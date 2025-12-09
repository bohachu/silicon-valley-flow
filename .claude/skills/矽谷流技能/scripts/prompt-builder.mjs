// ============================================================================
// prompt-builder.mjs - Prompt 建構器（開放封閉原則）
// ============================================================================

import { VISUAL_STYLE } from './constants.mjs';
import { getPromptEngineering } from './knowledge-loader.mjs';

/**
 * 建構單張投影片的 prompt
 * @param {Object} slide - 投影片模板
 * @param {string} topic - 使用者主題
 * @param {string} lang - 語言 (zh/en)
 * @returns {string} 完整的圖片生成 prompt
 */
export function buildSlidePrompt(slide, topic, lang = 'zh') {
  // 替換模板中的 {topic}
  let prompt = slide.prompt_template.replace('{topic}', topic);

  // 加入視覺規範
  prompt = `${prompt}. ${VISUAL_STYLE.colorPalette}. ${VISUAL_STYLE.qualityTags}`;

  // 如果是中文，加入中文標題提示
  if (lang === 'zh') {
    prompt += '. Chinese text labels preferred.';
  }

  return prompt;
}

/**
 * 建構完整簡報的所有 prompts
 * @param {Object} presentationType - 簡報類型模板
 * @param {string} topic - 使用者主題
 * @param {Object} options - 選項
 * @returns {Array<Object>} 投影片 prompts 列表
 */
export function buildAllSlidePrompts(presentationType, topic, options = {}) {
  const { lang = 'zh', maxSlides } = options;

  let slides = presentationType.slide_sequence;

  // 如果指定數量，截取投影片
  if (maxSlides && maxSlides < slides.length) {
    slides = slides.slice(0, maxSlides);
  }

  return slides.map(slide => ({
    order: slide.order,
    type: slide.type,
    title: slide.title,
    prompt: buildSlidePrompt(slide, topic, lang),
    framework_element: getFrameworkElement(slide.type),
  }));
}

/**
 * 根據投影片類型取得對應的矽谷流架構元素
 * @param {string} slideType - 投影片類型
 * @returns {string} 架構元素 (WHY/WHAT/HOW)
 */
function getFrameworkElement(slideType) {
  const whyTypes = ['context', 'context_and_conflict', 'characters', 'conflict', 'problem', 'progress_overview', 'achievements'];
  const whatTypes = ['big_idea', 'solution'];
  const howTypes = ['resolution', 'next_steps', 'traction', 'ask', 'market', 'challenges'];

  if (whyTypes.includes(slideType)) return 'WHY';
  if (whatTypes.includes(slideType)) return 'WHAT';
  if (howTypes.includes(slideType)) return 'HOW';

  return 'WHAT'; // 預設
}

/**
 * 建構講者備註
 * @param {Object} slide - 投影片資訊
 * @param {string} topic - 使用者主題
 * @returns {string} 講者備註
 */
export function buildSpeakerNotes(slide, topic) {
  const notes = {
    context_and_conflict: `這張投影片要建立背景並引出衝突。先說明目前的狀況，然後帶出「${topic}」面臨的挑戰。`,
    characters: `介紹關鍵人物和利害關係人。讓觀眾認識誰會受到「${topic}」的影響。`,
    big_idea: `這是整個簡報的核心！用一句話說明「${topic}」的大創意。這句話要能推動故事向前。`,
    solution: `提出解決方案。針對「${topic}」，說明具體要怎麼做。`,
    resolution: `收尾並呼籲行動。總結「${topic}」的預期成果，並說明下一步。`,
    progress_overview: `呈現「${topic}」的整體進度。使用時間軸或進度條讓觀眾一目瞭然。`,
    achievements: `列出已經完成的成就。讓觀眾看到「${topic}」的具體成果。`,
    challenges: `誠實面對挑戰。說明「${topic}」目前遇到的困難和風險。`,
    next_steps: `說明接下來要做什麼。給出「${topic}」的具體行動項目和時間表。`,
    problem: `用視覺化方式呈現痛點。讓投資人感受到「${topic}」要解決的問題有多重要。`,
    market: `展示市場規模。用數據說明「${topic}」的市場機會有多大。`,
    traction: `亮出成績單。展示「${topic}」的關鍵指標和成長曲線。`,
    ask: `明確說出募資需求。說明需要多少錢、用途是什麼。`,
  };

  return notes[slide.type] || `說明「${topic}」的${slide.title}。`;
}
