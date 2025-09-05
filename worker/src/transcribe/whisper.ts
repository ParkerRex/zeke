import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { log } from '../log.js';
import { createTempPath, cleanupTempFiles } from '../utils/temp-files.js';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  success: boolean;
  error?: string;
  modelUsed: string;
  processingTimeMs: number;
}

export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';

export interface WhisperOptions {
  model: WhisperModel;
  language?: string; // Auto-detect if not specified
  task?: 'transcribe' | 'translate'; // Default: transcribe
  temperature?: number; // 0.0 to 1.0, default: 0
  bestOf?: number; // Number of candidates, default: 5
  beamSize?: number; // Beam search size, default: 5
  patience?: number; // Beam search patience, default: 1.0
  lengthPenalty?: number; // Length penalty, default: 1.0
  suppressTokens?: string; // Comma-separated token IDs to suppress
  initialPrompt?: string; // Initial prompt to guide transcription
  conditionOnPreviousText?: boolean; // Default: true
  fp16?: boolean; // Use FP16 precision, default: true
  compressionRatioThreshold?: number; // Default: 2.4
  logprobThreshold?: number; // Default: -1.0
  noSpeechThreshold?: number; // Default: 0.6
  wordTimestamps?: boolean; // Include word-level timestamps
  prepend_punctuations?: string; // Default: "\"'"¿([{-"
  append_punctuations?: string; // Default: "\"'.。,，!！?？:：")]}、"
}

const DEFAULT_WHISPER_OPTIONS: WhisperOptions = {
  model: 'base',
  task: 'transcribe',
  temperature: 0,
  bestOf: 5,
  beamSize: 5,
  patience: 1.0,
  lengthPenalty: 1.0,
  conditionOnPreviousText: true,
  fp16: true,
  compressionRatioThreshold: 2.4,
  logprobThreshold: -1.0,
  noSpeechThreshold: 0.6,
  wordTimestamps: true,
};

/**
 * Transcribe audio file using OpenAI Whisper
 */
export async function transcribeAudio(
  audioPath: string,
  videoId: string,
  options: Partial<WhisperOptions> = {}
): Promise<TranscriptionResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_WHISPER_OPTIONS, ...options };

  // Create temp file for output
  const outputPath = createTempPath(videoId, 'json');

  try {
    log('whisper_transcription_start', {
      videoId,
      audioPath,
      outputPath,
      model: opts.model,
      language: opts.language || 'auto-detect',
      task: opts.task,
    });

    // Verify audio file exists
    await fs.access(audioPath);
    const audioStats = await fs.stat(audioPath);

    log('whisper_audio_file_info', {
      videoId,
      audioPath,
      fileSizeBytes: audioStats.size,
      fileSizeMB: Math.round((audioStats.size / (1024 * 1024)) * 100) / 100,
    });

    // Build Whisper command
    const whisperArgs = buildWhisperArgs(audioPath, outputPath, opts);

    // Run Whisper transcription
    const transcriptionPromise = new Promise<void>((resolve, reject) => {
      const whisper = spawn('whisper', whisperArgs);
      let stderr = '';
      let stdout = '';

      whisper.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      whisper.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      whisper.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Whisper failed with code ${code}. stderr: ${stderr}. stdout: ${stdout}`));
        }
      });

      whisper.on('error', (error) => {
        reject(new Error(`Failed to spawn whisper: ${error.message}`));
      });
    });

    // Set timeout based on audio file size (roughly 1 minute per MB, minimum 5 minutes)
    const timeoutMs = Math.max(5 * 60 * 1000, (audioStats.size / (1024 * 1024)) * 60 * 1000);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Whisper transcription timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    await Promise.race([transcriptionPromise, timeoutPromise]);

    // Read and parse the output JSON
    const outputContent = await fs.readFile(outputPath, 'utf-8');
    const whisperOutput = JSON.parse(outputContent);

    // Extract segments with proper typing
    const segments: TranscriptionSegment[] = (whisperOutput.segments || []).map((seg: any) => ({
      start: seg.start || 0,
      end: seg.end || 0,
      text: (seg.text || '').trim(),
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
    }));

    const processingTimeMs = Date.now() - startTime;
    const result: TranscriptionResult = {
      text: whisperOutput.text || '',
      segments,
      language: whisperOutput.language || 'unknown',
      duration: whisperOutput.duration || 0,
      success: true,
      modelUsed: opts.model,
      processingTimeMs,
    };

    log('whisper_transcription_complete', {
      videoId,
      model: opts.model,
      language: result.language,
      duration: result.duration,
      segmentCount: segments.length,
      textLength: result.text.length,
      processingTimeMs,
      processingTimeMinutes: Math.round((processingTimeMs / 60000) * 100) / 100,
    });

    // Clean up temp files
    await cleanupTempFiles([outputPath]);

    return result;
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    log(
      'whisper_transcription_error',
      {
        videoId,
        audioPath,
        model: opts.model,
        error: String(error),
        processingTimeMs,
      },
      'error'
    );

    // Clean up temp files
    try {
      await cleanupTempFiles([outputPath]);
    } catch {
      // Ignore cleanup errors
    }

    return {
      text: '',
      segments: [],
      language: 'unknown',
      duration: 0,
      success: false,
      error: String(error),
      modelUsed: opts.model,
      processingTimeMs,
    };
  }
}

/**
 * Build Whisper command arguments
 */
function buildWhisperArgs(audioPath: string, outputPath: string, options: WhisperOptions): string[] {
  const args = [
    audioPath,
    '--output_format',
    'json',
    '--output_dir',
    outputPath.replace(/\/[^/]+$/, ''), // Directory only
    '--model',
    options.model,
    '--task',
    options.task || 'transcribe',
    '--temperature',
    String(options.temperature || 0),
    '--best_of',
    String(options.bestOf || 5),
    '--beam_size',
    String(options.beamSize || 5),
    '--patience',
    String(options.patience || 1.0),
    '--length_penalty',
    String(options.lengthPenalty || 1.0),
    '--compression_ratio_threshold',
    String(options.compressionRatioThreshold || 2.4),
    '--logprob_threshold',
    String(options.logprobThreshold || -1.0),
    '--no_speech_threshold',
    String(options.noSpeechThreshold || 0.6),
  ];

  // Optional parameters
  if (options.language) {
    args.push('--language', options.language);
  }

  if (options.initialPrompt) {
    args.push('--initial_prompt', options.initialPrompt);
  }

  if (options.suppressTokens) {
    args.push('--suppress_tokens', options.suppressTokens);
  }

  if (options.conditionOnPreviousText === false) {
    args.push('--condition_on_previous_text', 'False');
  }

  if (options.fp16 === false) {
    args.push('--fp16', 'False');
  }

  if (options.wordTimestamps) {
    args.push('--word_timestamps', 'True');
  }

  if (options.prepend_punctuations) {
    args.push('--prepend_punctuations', options.prepend_punctuations);
  }

  if (options.append_punctuations) {
    args.push('--append_punctuations', options.append_punctuations);
  }

  return args;
}

/**
 * Check if Whisper is available and working
 */
export async function checkWhisperAvailability(): Promise<boolean> {
  try {
    const checkPromise = new Promise<boolean>((resolve, reject) => {
      const whisper = spawn('whisper', ['--help']);

      whisper.on('close', (code) => {
        resolve(code === 0);
      });

      whisper.on('error', (error) => {
        reject(error);
      });
    });

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 10000);
    });

    const isAvailable = await Promise.race([checkPromise, timeoutPromise]);

    log('whisper_availability_check', {
      available: isAvailable,
    });

    return isAvailable;
  } catch (error) {
    log(
      'whisper_availability_error',
      {
        error: String(error),
      },
      'error'
    );
    return false;
  }
}

/**
 * Get available Whisper models
 */
export function getAvailableModels(): WhisperModel[] {
  return ['tiny', 'base', 'small', 'medium', 'large', 'large-v2', 'large-v3'];
}

/**
 * Get recommended model based on audio duration and quality requirements
 */
export function getRecommendedModel(durationSeconds: number, prioritizeSpeed: boolean = false): WhisperModel {
  if (prioritizeSpeed) {
    return durationSeconds > 3600 ? 'tiny' : 'base'; // Use faster models for long content
  }

  // Balance quality and speed based on duration
  if (durationSeconds < 300) {
    // < 5 minutes
    return 'small';
  } else if (durationSeconds < 1800) {
    // < 30 minutes
    return 'base';
  } else if (durationSeconds < 3600) {
    // < 1 hour
    return 'base';
  } else {
    return 'tiny'; // Use fastest model for very long content
  }
}

/**
 * Estimate transcription time based on model and audio duration
 */
export function estimateTranscriptionTime(durationSeconds: number, model: WhisperModel): number {
  // Rough estimates based on CPU performance (in seconds)
  const modelMultipliers: Record<WhisperModel, number> = {
    tiny: 0.1,
    base: 0.2,
    small: 0.4,
    medium: 0.8,
    large: 1.2,
    'large-v2': 1.2,
    'large-v3': 1.2,
  };

  return Math.ceil(durationSeconds * modelMultipliers[model]);
}
