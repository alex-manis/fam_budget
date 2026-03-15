import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env.js';

let _bot: TelegramBot | null = null;

/**
 * Lazy singleton. Returns null when TELEGRAM_BOT_TOKEN is not configured
 * so the rest of the app can start without the bot.
 */
export const createBotClient = (): TelegramBot | null => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('[TelegramBot] TELEGRAM_BOT_TOKEN not set — bot is disabled');
    return null;
  }

  if (_bot) return _bot;

  _bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
    polling: {
      interval: 300,
      autoStart: true,
      params: { timeout: 10 },
    },
  });

  _bot.on('polling_error', (err) => {
    console.error('[TelegramBot] Polling error:', err.message);
  });

  return _bot;
};

export const isBotConfigured = (): boolean => Boolean(env.TELEGRAM_BOT_TOKEN);
