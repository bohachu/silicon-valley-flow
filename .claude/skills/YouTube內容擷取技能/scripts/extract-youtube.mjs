#!/usr/bin/env node
/**
 * YouTube 內容擷取腳本
 * 擷取 YouTube 影片的標題、描述、字幕
 */

import ytdl from '@distube/ytdl-core';
import { YoutubeTranscript } from '@danielxceron/youtube-transcript';

/**
 * 從 URL 或 ID 擷取 video ID
 */
function extractVideoId(input) {
  // 支援多種 YouTube URL 格式
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/  // 純 ID
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  throw new Error(`無法解析 YouTube URL/ID: ${input}`);
}

/**
 * 取得影片 metadata
 */
async function getVideoMetadata(videoId) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    return {
      title: info.videoDetails.title,
      description: info.videoDetails.description || '',
      author: info.videoDetails.author?.name || '',
      channelId: info.videoDetails.channelId || '',
      duration: parseInt(info.videoDetails.lengthSeconds) || 0,
      viewCount: parseInt(info.videoDetails.viewCount) || 0,
      publishDate: info.videoDetails.publishDate || '',
      thumbnails: info.videoDetails.thumbnails || [],
      keywords: info.videoDetails.keywords || []
    };
  } catch (error) {
    console.error(`取得 metadata 失敗: ${error.message}`);
    return null;
  }
}

/**
 * 取得影片字幕
 */
async function getTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    return {
      segments: transcript.map(item => ({
        text: item.text,
        start: item.offset / 1000,  // 轉換為秒
        duration: item.duration / 1000
      })),
      fullText: transcript.map(item => item.text).join(' ')
    };
  } catch (error) {
    console.error(`取得字幕失敗: ${error.message}`);
    return null;
  }
}

/**
 * 格式化持續時間
 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * 主程式
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('使用方式: node extract-youtube.mjs <YouTube URL 或 Video ID>');
    console.error('範例: node extract-youtube.mjs https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.error('範例: node extract-youtube.mjs dQw4w9WgXcQ');
    process.exit(1);
  }

  const input = args[0];
  const outputFormat = args.includes('--json') ? 'json' : 'text';

  try {
    const videoId = extractVideoId(input);
    console.error(`擷取影片 ID: ${videoId}`);

    // 平行擷取 metadata 和字幕
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      getTranscript(videoId)
    ]);

    const result = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      metadata,
      transcript
    };

    if (outputFormat === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // 人類可讀格式
      console.log('\n========== YouTube 影片內容 ==========\n');

      if (metadata) {
        console.log(`📹 標題: ${metadata.title}`);
        console.log(`👤 作者: ${metadata.author}`);
        console.log(`⏱️ 時長: ${formatDuration(metadata.duration)}`);
        console.log(`👁️ 觀看次數: ${metadata.viewCount.toLocaleString()}`);
        console.log(`📅 發布日期: ${metadata.publishDate}`);

        if (metadata.description) {
          console.log(`\n📝 描述:\n${metadata.description.slice(0, 500)}${metadata.description.length > 500 ? '...' : ''}`);
        }

        if (metadata.keywords?.length > 0) {
          console.log(`\n🏷️ 關鍵字: ${metadata.keywords.slice(0, 10).join(', ')}`);
        }
      } else {
        console.log('⚠️ 無法取得影片資訊');
      }

      if (transcript) {
        console.log('\n========== 字幕內容 ==========\n');
        console.log(transcript.fullText);
      } else {
        console.log('\n⚠️ 此影片沒有可用的字幕');
      }
    }

  } catch (error) {
    console.error(`❌ 錯誤: ${error.message}`);
    process.exit(1);
  }
}

main();
