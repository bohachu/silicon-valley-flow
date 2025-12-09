// ============================================================================
// utils.test.mjs - 工具函式單元測試
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  parseArgs,
  buildFullPrompt,
  validateParams,
  generateSessionId,
  generateFilename,
} from '../utils.mjs';

describe('utils.mjs', () => {
  describe('parseArgs', () => {
    it('should parse basic prompt', () => {
      const result = parseArgs(['A cute cat']);
      expect(result.prompt).toBe('A cute cat');
      expect(result.aspectRatio).toBe('1:1');
    });

    it('should parse aspect ratio', () => {
      const result = parseArgs(['prompt', '--aspect', '16:9']);
      expect(result.aspectRatio).toBe('16:9');
    });

    it('should parse style', () => {
      const result = parseArgs(['prompt', '--style', 'oil painting']);
      expect(result.style).toBe('oil painting');
    });

    it('should parse session ID', () => {
      const result = parseArgs(['prompt', '--session', 'abc-123']);
      expect(result.session).toBe('abc-123');
    });

    it('should parse all options', () => {
      const result = parseArgs([
        'A mountain',
        '--aspect', '16:9',
        '--style', 'photorealistic',
        '--negative', 'blur',
        '--temperature', '1.5',
        '--count', '2',
        '--session', 'sess-123',
      ]);

      expect(result.prompt).toBe('A mountain');
      expect(result.aspectRatio).toBe('16:9');
      expect(result.style).toBe('photorealistic');
      expect(result.negativePrompt).toBe('blur');
      expect(result.temperature).toBe(1.5);
      expect(result.count).toBe(2);
      expect(result.session).toBe('sess-123');
    });
  });

  describe('buildFullPrompt', () => {
    it('should return base prompt when no options', () => {
      const result = buildFullPrompt('A cat');
      expect(result).toBe('A cat');
    });

    it('should prepend style', () => {
      const result = buildFullPrompt('A cat', { style: 'anime' });
      expect(result).toBe('anime style: A cat');
    });

    it('should append negative prompt', () => {
      const result = buildFullPrompt('A cat', { negativePrompt: 'blur' });
      expect(result).toBe('A cat. Avoid: blur');
    });

    it('should combine style and negative prompt', () => {
      const result = buildFullPrompt('A cat', {
        style: 'anime',
        negativePrompt: 'blur',
      });
      expect(result).toBe('anime style: A cat. Avoid: blur');
    });
  });

  describe('validateParams', () => {
    it('should throw on empty prompt', () => {
      expect(() => validateParams({ prompt: null })).toThrow('請提供圖片描述');
    });

    it('should throw on invalid temperature', () => {
      expect(() => validateParams({ prompt: 'test', temperature: 3 })).toThrow();
      expect(() => validateParams({ prompt: 'test', temperature: -1 })).toThrow();
    });

    it('should throw on invalid count', () => {
      expect(() => validateParams({ prompt: 'test', count: 0 })).toThrow();
      expect(() => validateParams({ prompt: 'test', count: 5 })).toThrow();
    });

    it('should pass valid params', () => {
      expect(() => validateParams({
        prompt: 'test',
        temperature: 1,
        count: 2,
      })).not.toThrow();
    });
  });

  describe('generateSessionId', () => {
    it('should generate UUID format', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateFilename', () => {
    it('should include index', () => {
      const filename = generateFilename(0);
      expect(filename).toContain('-0.png');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const filename = generateFilename(0);
      const after = Date.now();

      const match = filename.match(/generated-(\d+)-/);
      expect(match).not.toBeNull();

      const timestamp = parseInt(match[1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});
