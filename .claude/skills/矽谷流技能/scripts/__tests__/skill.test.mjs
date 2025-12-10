#!/usr/bin/env node
// ============================================================================
// skill.test.mjs - 矽谷流技能單元測試
// ============================================================================

import { loadKnowledge, getPresentationType, getAllPresentationTypes } from '../knowledge-loader.mjs';
import { buildSlidePrompt, buildAllSlidePrompts, buildSpeakerNotes } from '../prompt-builder.mjs';
import { DEFAULTS, PRESENTATION_TYPES, VISUAL_STYLE } from '../constants.mjs';

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected: ${expected}, Got: ${actual}`);
  }
}

function assertTruthy(value, message = '') {
  if (!value) {
    throw new Error(`${message} Expected truthy value, got: ${value}`);
  }
}

function assertArray(value, message = '') {
  if (!Array.isArray(value)) {
    throw new Error(`${message} Expected array, got: ${typeof value}`);
  }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
  console.log('\n🧪 矽谷流技能單元測試\n');
  console.log('='.repeat(50));

  // Test 1: Constants
  console.log('\n📦 常數模組測試');

  test('DEFAULTS.type 應為 proposal', () => {
    assertEqual(DEFAULTS.type, 'proposal');
  });

  test('DEFAULTS.aspectRatio 應為 16:9', () => {
    assertEqual(DEFAULTS.aspectRatio, '16:9');
  });

  test('PRESENTATION_TYPES 應包含三種類型', () => {
    assertEqual(PRESENTATION_TYPES.length, 3);
    assertTruthy(PRESENTATION_TYPES.includes('proposal'));
    assertTruthy(PRESENTATION_TYPES.includes('status_update'));
    assertTruthy(PRESENTATION_TYPES.includes('pitch'));
  });

  test('VISUAL_STYLE 應有 basePrompt', () => {
    assertTruthy(VISUAL_STYLE.basePrompt);
    assertTruthy(VISUAL_STYLE.basePrompt.includes('Professional'));
  });

  // Test 2: Knowledge Loader
  console.log('\n📚 知識庫載入測試');

  test('loadKnowledge 應成功載入知識庫', async () => {
    const knowledge = await loadKnowledge();
    assertTruthy(knowledge);
    assertTruthy(knowledge.meta);
    assertEqual(knowledge.meta.name, '矽谷流萬用敘事簡報法則');
  });

  test('知識庫應有核心架構', async () => {
    const knowledge = await loadKnowledge();
    assertTruthy(knowledge.core_framework);
    assertTruthy(knowledge.core_framework.structure.WHY);
    assertTruthy(knowledge.core_framework.structure.WHAT);
    assertTruthy(knowledge.core_framework.structure.HOW);
  });

  test('getPresentationType 應返回 proposal 類型', async () => {
    const type = await getPresentationType('proposal');
    assertEqual(type.id, 'proposal');
    assertEqual(type.name, '提出建議');
    assertArray(type.slide_sequence);
  });

  test('getPresentationType 應返回 status_update 類型', async () => {
    const type = await getPresentationType('status_update');
    assertEqual(type.id, 'status_update');
    assertEqual(type.name, '近況更新');
  });

  test('getPresentationType 應返回 pitch 類型', async () => {
    const type = await getPresentationType('pitch');
    assertEqual(type.id, 'pitch');
    assertEqual(type.name, '創業簡報');
  });

  test('getAllPresentationTypes 應返回所有類型', async () => {
    const types = await getAllPresentationTypes();
    assertArray(types);
    assertEqual(types.length, 3);
  });

  // Test 3: Prompt Builder
  console.log('\n🔨 Prompt 建構測試');

  test('buildSlidePrompt 應替換 {topic}', async () => {
    const type = await getPresentationType('proposal');
    const slide = type.slide_sequence[0];
    const prompt = buildSlidePrompt(slide, '機師招募計畫');
    assertTruthy(prompt.includes('機師招募計畫'));
    assertTruthy(!prompt.includes('{topic}'));
  });

  test('buildSlidePrompt 應加入視覺規範', async () => {
    const type = await getPresentationType('proposal');
    const slide = type.slide_sequence[0];
    const prompt = buildSlidePrompt(slide, '測試主題');
    assertTruthy(prompt.includes('Blue'));
    assertTruthy(prompt.includes('orange'));
  });

  test('buildAllSlidePrompts 應返回正確數量投影片', async () => {
    const type = await getPresentationType('proposal');
    const prompts = buildAllSlidePrompts(type, '測試主題');
    assertEqual(prompts.length, 5); // proposal 有 5 張投影片
  });

  test('buildAllSlidePrompts 應支援 maxSlides 限制', async () => {
    const type = await getPresentationType('proposal');
    const prompts = buildAllSlidePrompts(type, '測試主題', { maxSlides: 3 });
    assertEqual(prompts.length, 3);
  });

  test('buildAllSlidePrompts 每張投影片應有 framework_element', async () => {
    const type = await getPresentationType('proposal');
    const prompts = buildAllSlidePrompts(type, '測試主題');
    for (const p of prompts) {
      assertTruthy(p.framework_element);
      assertTruthy(['WHY', 'WHAT', 'HOW'].includes(p.framework_element));
    }
  });

  test('buildSpeakerNotes 應生成講者備註', async () => {
    const type = await getPresentationType('proposal');
    const slide = type.slide_sequence[0];
    const notes = buildSpeakerNotes(slide, '測試主題');
    assertTruthy(notes);
    assertTruthy(notes.includes('測試主題'));
  });

  // Test 4: Presentation Type Validation
  console.log('\n📊 簡報類型驗證');

  test('proposal 應有 5 張投影片序列', async () => {
    const type = await getPresentationType('proposal');
    assertEqual(type.slide_sequence.length, 5);
  });

  test('status_update 應有 4 張投影片序列', async () => {
    const type = await getPresentationType('status_update');
    assertEqual(type.slide_sequence.length, 4);
  });

  test('pitch 應有 5 張投影片序列', async () => {
    const type = await getPresentationType('pitch');
    assertEqual(type.slide_sequence.length, 5);
  });

  test('每張投影片應有 prompt_template', async () => {
    const types = await getAllPresentationTypes();
    for (const type of types) {
      for (const slide of type.slide_sequence) {
        assertTruthy(slide.prompt_template, `${type.id} slide ${slide.order} missing prompt_template`);
        assertTruthy(slide.prompt_template.includes('{topic}'), `${type.id} slide ${slide.order} missing {topic} placeholder`);
      }
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 測試結果: ${passCount} 通過, ${failCount} 失敗\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('測試執行失敗:', error);
  process.exit(1);
});
