import { getMonthlySummary } from '../services/telegram-analytics.service.js';
import { buildSummaryMessage } from '../formatters/message.formatter.js';
import type { CommandHandler } from '../telegram.types.js';

export const summaryCommand: CommandHandler = async (bot, ctx) => {
  await bot.sendChatAction(ctx.chatId, 'typing');

  const data = await getMonthlySummary(ctx.familyId);
  const text = buildSummaryMessage(data);

  await bot.sendMessage(ctx.chatId, text, { parse_mode: 'HTML' });
};
