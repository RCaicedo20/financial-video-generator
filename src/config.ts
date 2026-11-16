import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('127.0.0.1'),
  PUBLIC_BASE_URL: z.string().url().default('http://127.0.0.1:3000'),
  DEMO_MODE: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  ELEVENLABS_API_KEY: z.string().default(''),
  ELEVENLABS_VOICE_ID: z.string().default(''),
  ELEVENLABS_TTS_MODEL: z.string().default('eleven_multilingual_v2'),
  GENERATE_MUSIC: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  MAX_VIDEO_SECONDS: z.coerce.number().int().min(5).max(180).default(180),
  VIDEO_FPS: z.coerce.number().int().refine((n) => n === 30, 'V1 currently supports only 30 fps').default(30),
});

export const config = EnvSchema.parse(process.env);

export function validateLiveConfig() {
  if (config.DEMO_MODE) return;
  if (!config.ELEVENLABS_API_KEY || !config.ELEVENLABS_VOICE_ID) {
    throw new Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env for live video generation.');
  }
}
