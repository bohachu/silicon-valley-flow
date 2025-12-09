// ============================================================================
// constants.mjs - 圖片生成技能常數定義
// 遵循 SOLID 原則：單一職責 - 只負責常數定義
// ============================================================================

// Vertex AI 配置
export const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'botrun-c';
export const VERTEX_AI_LOCATION = 'global';
export const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';

// GCS 配置
export const GCS_BUCKET = process.env.GCS_BUCKET || '';
export const GCS_AVAILABLE = !!GCS_BUCKET;
export const SIGNED_URL_EXPIRY_DAYS = 7;

// Session 配置
export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 分鐘
export const SESSION_DIR = process.env.SESSION_DIR || '/tmp/image-sessions';

// 使用者配置
export const USER_ID = process.env.USER_ID || 'anonymous';

// 圖片生成預設值
export const DEFAULT_ASPECT_RATIO = '1:1';
export const DEFAULT_TEMPERATURE = 1.0;
export const DEFAULT_IMAGE_COUNT = 1;
export const DEFAULT_IMAGE_SIZE = '1K';
export const DEFAULT_SAFETY_LEVEL = 'BLOCK_MEDIUM_AND_ABOVE';
export const DEFAULT_PERSON_GENERATION = 'allow_adult';

// 支援的長寬比
export const SUPPORTED_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'];

// 安全類別
export const SAFETY_CATEGORIES = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
];
