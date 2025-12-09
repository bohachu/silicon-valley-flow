// ============================================================================
// constants.mjs - 矽谷流技能常數定義
// ============================================================================

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 路徑常數
export const SKILL_DIR = dirname(__dirname);
export const KNOWLEDGE_PATH = join(SKILL_DIR, 'knowledge', 'silicon-valley-flow.json');

// 圖片生成技能路徑
export const IMAGE_SKILL_PATH = process.env.OFFICIAL_SKILLS_DIR
  ? join(process.env.OFFICIAL_SKILLS_DIR, '圖片生成技能', 'scripts', 'generate-image.mjs')
  : join(dirname(dirname(dirname(__dirname))), 'gemini-3', '圖片生成技能', 'scripts', 'generate-image.mjs');

// 預設值
export const DEFAULTS = {
  type: 'proposal',
  lang: 'zh',
  aspectRatio: '16:9',
  style: 'professional infographic',
};

// 簡報類型
export const PRESENTATION_TYPES = ['proposal', 'status_update', 'pitch'];

// 視覺規範
export const VISUAL_STYLE = {
  basePrompt: 'Professional corporate presentation slide, clean modern design, 16:9 aspect ratio',
  colorPalette: 'Blue (#0066CC) and orange (#FF6600) accent colors on white background',
  typography: 'Bold headlines, clear hierarchy, minimal text',
  qualityTags: 'High quality, professional, business presentation, clean layout, infographic style',
};
