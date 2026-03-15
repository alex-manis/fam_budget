import type TelegramBot from 'node-telegram-bot-api';
import { createBotClient } from '../../infrastructure/telegram/bot.client.js';
import { resolveUserContext } from './services/telegram-user.service.js';
import { helpCommand } from './commands/help.command.js';
import { summaryCommand } from './commands/summary.command.js';
import { spentCommand } from './commands/spent.command.js';
import { forecastCommand } from './commands/forecast.command.js';
import { addCommand } from './commands/add.command.js';
import type { CommandHandler } from './telegram.types.js';

const NOT_LINKED_MSG =
  '🔗 Your Telegram account is not linked to FamBudget.\n\n' +
  'Please open the app, go to <b>Settings → Telegram</b> and follow the instructions.';

/**
 * Wraps a command handler with:
 *  1. User authentication (telegramChatId → TelegramContext)
 *  2. Argument extraction from the command text
 *  3. Error catching so the bot never silently crashes
 */
const withAuth =
  (bot: TelegramBot, handler: CommandHandler) =>
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    try {
      const ctx = await resolveUserContext(chatId);
      if (!ctx) {
        await bot.sendMessage(chatId, NOT_LINKED_MSG, { parse_mode: 'HTML' });
        return;
      }

      // Extract args: text after the command word, split by whitespace
      const rawArgs = match?.[1]?.trim() ?? '';
      const args = rawArgs ? rawArgs.split(/\s+/) : [];

      await handler(bot, ctx, args);
    } catch (err) {
      console.error('[TelegramBot] Command error:', err instanceof Error ? err.message : err);
      await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later.');
    }
  };

/**
 * Initialises the Telegram bot and registers all command handlers.
 * Returns null if TELEGRAM_BOT_TOKEN is not configured.
 */
export const initBot = (): TelegramBot | null => {
  const bot = createBotClient();
  if (!bot) return null;

  // /help or /start — no auth required to show help
  bot.onText(/^\/(?:help|start)(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const ctx = await resolveUserContext(chatId);
      if (!ctx) {
        await bot.sendMessage(chatId, NOT_LINKED_MSG, { parse_mode: 'HTML' });
        return;
      }
      await helpCommand(bot, ctx, []);
    } catch {
      await bot.sendMessage(chatId, '❌ Something went wrong.');
    }
  });

  // /summary — monthly overview
  bot.onText(/^\/summary(?:\s(.*))?$/, withAuth(bot, summaryCommand));

  // /spent [category] — e.g. /spent groceries
  bot.onText(/^\/spent(?:\s(.*))?$/, withAuth(bot, spentCommand));

  // /forecast — next month prediction
  bot.onText(/^\/forecast(?:\s(.*))?$/, withAuth(bot, forecastCommand));

  // /add 45 coffee at work  →  args = ["45", "coffee", "at", "work"]
  bot.onText(/^\/add(?:\s(.*))?$/, withAuth(bot, addCommand));

  console.log('[TelegramBot] Bot started and listening for commands');
  return bot;
};
